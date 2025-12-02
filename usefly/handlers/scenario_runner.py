import uuid
from datetime import datetime
from typing import Dict, Optional, List
from browser_use import AgentHistoryList
from sqlalchemy.orm import Session
from usefly.models import Scenario, SystemConfig, UserJourneyTask, AgentRunCreate
from usefly.common.browser_use_common import run_user_journey_task
from usefly.handlers.agent_runs import create_agent_run

_active_runs: Dict[str, Dict] = {}


def init_run_status(run_id: str, scenario_id: str, report_id: str, task_count: int):
    _active_runs[run_id] = {
        "run_id": run_id,
        "scenario_id": scenario_id,
        "report_id": report_id,
        "status": "in_progress",
        "total_tasks": task_count,
        "completed_tasks": 0,
        "failed_tasks": 0,
        "agent_run_ids": [],
        "started_at": datetime.now().isoformat()
    }


def update_run_status(run_id: str, completed: int = 0, failed: int = 0, agent_run_id: Optional[str] = None):
    if run_id in _active_runs:
        _active_runs[run_id]["completed_tasks"] += completed
        _active_runs[run_id]["failed_tasks"] += failed

        if agent_run_id:
            _active_runs[run_id]["agent_run_ids"].append(agent_run_id)

        run = _active_runs[run_id]
        total_done = run["completed_tasks"] + run["failed_tasks"]

        if total_done >= run["total_tasks"]:
            if run["failed_tasks"] == 0:
                run["status"] = "completed"
            elif run["failed_tasks"] == run["total_tasks"]:
                run["status"] = "failed"
            else:
                run["status"] = "partial_failure"
            run["completed_at"] = datetime.now().isoformat()


def get_run_status(run_id: str) -> Optional[Dict]:
    return _active_runs.get(run_id)


def cleanup_run_status(run_id: str):
    _active_runs.pop(run_id, None)


def validate_scenario_for_run(scenario: Scenario) -> tuple:
    if not scenario.tasks:
        return False, "Scenario has no tasks"

    selected_indices = scenario.selected_task_indices or []
    if not selected_indices:
        return False, "No tasks selected for execution"

    if any(idx >= len(scenario.tasks) for idx in selected_indices):
        return False, "Invalid task index in selection"

    return True, None


def extract_agent_run_data(history: AgentHistoryList, journey_task: UserJourneyTask) -> dict:
    events = []

    for h in history.history:
        if h.model_output:
            for action, result in zip(h.model_output.action, h.result):
                action_dict = action.model_dump(exclude_none=True, mode='json')
                action_name = list(action_dict.keys())[0]
                action_params = action_dict[action_name]

                if action_name == 'click_element' and action_params:
                    events.append({
                        'type': 'click',
                        'index': action_params.get('index'),
                        'coordinate_x': action_params.get('coordinate_x'),
                        'coordinate_y': action_params.get('coordinate_y'),
                        'url': h.state.url,
                        'metadata': result.metadata if result.metadata else {}
                    })
                elif action_name == 'scroll' and action_params:
                    events.append({
                        'type': 'scroll',
                        'direction': 'down' if action_params.get('down', True) else 'up',
                        'pages': action_params.get('pages', 1.0),
                        'index': action_params.get('index'),
                        'url': h.state.url
                    })

    return {
        'initial_prompt': journey_task.goal,
        'urls_visited': history.urls(),
        'events': events,
        'steps_completed': history.number_of_steps(),
        'judgement_data': history.judgement() or {}
    }


async def execute_single_task(
    db: Session,
    scenario: Scenario,
    task: Dict,
    report_id: str,
    run_id: str,
    system_config: SystemConfig
) -> str:
    try:
        journey_task = UserJourneyTask(**task)
        start_time = datetime.now()

        result = await run_user_journey_task(
            journey_task=journey_task,
            system_config=system_config,
            max_steps=30
        )

        end_time = datetime.now()

        history: AgentHistoryList = result.get("history")
        extracted_data = extract_agent_run_data(history, journey_task)

        agent_run_data = AgentRunCreate(
            config_id=scenario.id,
            report_id=report_id,
            persona_type=result.get("persona", "UNKNOWN"),
            status="success",
            timestamp=start_time,
            duration=int(result.get("duration", 0)),
            platform="web",
            location=None,
            error_type=result.get("error"),
            steps_completed=extracted_data['steps_completed'],
            total_steps=30,
            journey_path=extracted_data['urls_visited'],
            judgement_data=extracted_data['judgement_data'],
            initial_prompt=extracted_data['initial_prompt'],
            urls_visited=extracted_data['urls_visited'],
            events=extracted_data['events']
        )

        agent_run = create_agent_run(db, agent_run_data)

        update_run_status(run_id, completed=1, agent_run_id=agent_run.id)


        return agent_run.id

    except Exception as e:
        agent_run_data = AgentRunCreate(
            config_id=scenario.id,
            report_id=report_id,
            persona_type=task.get("persona", "UNKNOWN"),
            status="error",
            run_status="failed",
            verdict_status=None,
            timestamp=datetime.now(),
            duration=0,
            platform="web",
            location=None,
            error_type=str(e),
            steps_completed=0,
            total_steps=30,
            journey_path=[],
            goals_achieved=[],
            friction_points=[],
            metrics={},
            judgement_data={}
        )

        agent_run = create_agent_run(db, agent_run_data)
        update_run_status(run_id, failed=1, agent_run_id=agent_run.id)
        return agent_run.id


async def run_persona_tasks(db_session_factory, persona_id: str, report_id: str, run_id: str):
    db = db_session_factory()

    try:
        scenario = db.query(Scenario).filter(Scenario.id == persona_id).first()
        if not scenario:
            raise ValueError(f"Scenario {persona_id} not found")

        sys_config = db.query(SystemConfig).filter(SystemConfig.id == 1).first()
        if not sys_config:
            raise ValueError("System configuration not found")

        all_tasks = scenario.tasks or []
        selected_indices = scenario.selected_task_indices or list(range(len(all_tasks)))

        tasks_to_run = [
            all_tasks[idx]
            for idx in selected_indices
            if idx < len(all_tasks)
        ]

        if not tasks_to_run:
            raise ValueError("No tasks to run")

        init_run_status(run_id, persona_id, report_id, len(tasks_to_run))

        for task in tasks_to_run:
            await execute_single_task(db, scenario, task, report_id, run_id, sys_config)

    except Exception as e:
        print(f"Fatal error in run_scenario_tasks: {e}")
        if run_id in _active_runs:
            _active_runs[run_id]["status"] = "failed"
            _active_runs[run_id]["error"] = str(e)
    finally:
        db.close()
