from pathlib import Path
import uuid
from datetime import datetime
from typing import Dict, Optional, List
from browser_use import AgentHistoryList
from sqlalchemy.orm import Session
from usefly.common.browser_use_common import run_browser_use_agent
from usefly.models import Scenario, SystemConfig, UserJourneyTask, PersonaRunCreate
from usefly.handlers.persona_runs import create_persona_run

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


def extract_agent_events(history: AgentHistoryList) -> list:
    """Extract ALL agent actions from browser history sequentially."""
    events = []

    # Use model_actions() - official browser_use API for extracting actions
    actions = history.model_actions()
    results = history.action_results()

    for step_idx, (h, action_dict) in enumerate(zip(history.history, actions), start=1):
        # Guard against empty action dicts
        if not action_dict:
            continue

        # Get action name and params
        action_keys = [k for k in action_dict.keys() if k != 'interacted_element']
        if not action_keys:
            continue

        action_name = action_keys[0]
        action_params = action_dict[action_name]

        # Base event structure
        event = {
            'step': step_idx,
            'url': h.state.url if h.state else None,
        }

        # Extract by action type
        if action_name == 'click_element':
            event.update({
                'type': 'click',
                'index': action_params.get('index'),
                'coordinate_x': action_params.get('coordinate_x'),
                'coordinate_y': action_params.get('coordinate_y'),
            })

        elif action_name == 'scroll':
            event.update({
                'type': 'scroll',
                'direction': 'down' if action_params.get('down', True) else 'up',
                'pages': action_params.get('pages', 1.0),
                'index': action_params.get('index'),
            })

        elif action_name == 'navigate':
            event.update({
                'type': 'navigate',
                'target_url': action_params.get('url'),
                'new_tab': action_params.get('new_tab', False),
            })

        elif action_name == 'input':
            event.update({
                'type': 'input',
                'index': action_params.get('index'),
                'text': action_params.get('text'),
                'clear': action_params.get('clear', True),
            })

        elif action_name == 'search':
            event.update({
                'type': 'search',
                'query': action_params.get('query'),
                'engine': action_params.get('engine', 'google'),
            })

        elif action_name == 'go_back':
            event.update({'type': 'go_back'})

        elif action_name == 'wait':
            event.update({
                'type': 'wait',
                'seconds': action_params if isinstance(action_params, (int, float)) else action_params.get('seconds', 3),
            })

        elif action_name == 'upload_file':
            event.update({
                'type': 'upload_file',
                'index': action_params.get('index'),
                'path': action_params.get('path'),
            })

        elif action_name == 'switch':
            event.update({
                'type': 'switch_tab',
                'tab_id': action_params.get('tab_id'),
            })

        elif action_name == 'close':
            event.update({
                'type': 'close_tab',
                'tab_id': action_params.get('tab_id'),
            })

        elif action_name == 'extract':
            event.update({
                'type': 'extract',
                'query': action_params.get('query'),
                'extract_links': action_params.get('extract_links', False),
            })

        elif action_name == 'send_keys':
            event.update({
                'type': 'send_keys',
                'keys': action_params.get('keys'),
            })

        elif action_name == 'find_text':
            event.update({
                'type': 'find_text',
                'text': action_params if isinstance(action_params, str) else action_params.get('text'),
            })

        elif action_name == 'screenshot':
            event.update({'type': 'screenshot'})

        elif action_name == 'dropdown_options':
            event.update({
                'type': 'dropdown_options',
                'index': action_params.get('index'),
            })

        elif action_name == 'select_dropdown':
            event.update({
                'type': 'select_dropdown',
                'index': action_params.get('index'),
                'text': action_params.get('text'),
            })

        elif action_name == 'done':
            event.update({
                'type': 'done',
                'text': action_params.get('text'),
                'success': action_params.get('success', True),
            })

        else:
            # Fallback for unknown action types
            event.update({
                'type': action_name,
                'params': action_params,
            })

        # Add interacted_element if available (convert to dict for JSON serialization)
        if action_dict.get('interacted_element'):
            interacted_elem = action_dict['interacted_element']
            # Convert DOMInteractedElement to dict if it's not already
            if hasattr(interacted_elem, 'model_dump'):
                event['interacted_element'] = interacted_elem.model_dump(exclude_none=True)
            elif isinstance(interacted_elem, dict):
                event['interacted_element'] = interacted_elem
            else:
                event['interacted_element'] = str(interacted_elem)

        # Add result metadata
        if step_idx <= len(results) and results[step_idx - 1].metadata:
            event['metadata'] = results[step_idx - 1].metadata

        events.append(event)

    return events


async def execute_single_task(
    db: Session,
    scenario: Scenario,
    task: Dict,
    report_id: str,
    run_id: str,
    system_config: SystemConfig
) -> str:
    # Initialize status tracking if not already initialized
    if run_id not in _active_runs:
        init_run_status(
            run_id=run_id,
            scenario_id=scenario.id,
            report_id=report_id,
            task_count=1
        )

    try:
        journey_task = UserJourneyTask(**task)
        start_time = datetime.now()

        prompt_path = Path(__file__).parent.parent / "prompts" / "user_journey_task.txt"
        with open(prompt_path, "r") as f:
            prompt_template = f.read()

        task_description = prompt_template.format(
            persona=journey_task.persona,
            starting_url=journey_task.starting_url,
            goal=journey_task.goal,
            steps=journey_task.steps
        )
        max_steps = 30 #TODO introduce env var
        history: AgentHistoryList = await run_browser_use_agent(task=task_description, system_config=system_config, max_steps=max_steps)

        events = extract_agent_events(history)

        persona_run_data = PersonaRunCreate(
            config_id=scenario.id,
            report_id=report_id,
            persona_type=journey_task.persona,
            is_done=history.is_done(),
            timestamp=start_time,
            duration_seconds=history.total_duration_seconds(),
            platform="web",
            location=None,
            error_type="",#TODO add error
            steps_completed=history.number_of_steps(),
            total_steps=max_steps,
            final_result=history.final_result(),
            journey_path=history.urls(),
            judgement_data=history.judgement(),
            task_description=task_description,
            events=events
        )

        persona_run = create_persona_run(db, persona_run_data)

        update_run_status(run_id, completed=1, agent_run_id=persona_run.id)


        return persona_run.id

    except Exception as e:
        persona_run_data = PersonaRunCreate(
            config_id=scenario.id,
            report_id=report_id,
            persona_type=task.get("persona", "UNKNOWN"),
            is_done=False,
            timestamp=datetime.now(),
            duration_seconds=0,
            platform="web",
            location=None,
            error_type=str(e),
            steps_completed=0,
            total_steps=30,
            journey_path=[],
            final_result=f"ERROR: {str(e)}",
            judgement_data={},
            task_description=task.get("goal", "UNKNOWN"),
            events=[]
        )

        persona_run = create_persona_run(db, persona_run_data)
        update_run_status(run_id, failed=1, agent_run_id=persona_run.id)
        return persona_run.id


async def run_persona_tasks(db_session_factory, persona_id: str, report_id: str, run_id: str,background_tasks):
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
        
        for task in tasks_to_run:
            background_tasks.add_task(execute_single_task,db,scenario,task, report_id, run_id,sys_config)

    except Exception as e:
        print(f"Fatal error in run_scenario_tasks: {e}")
        if run_id in _active_runs:
            _active_runs[run_id]["status"] = "failed"
            _active_runs[run_id]["error"] = str(e)
    finally:
        db.close()
