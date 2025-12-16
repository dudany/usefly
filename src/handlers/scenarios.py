from sqlalchemy.orm import Session
from typing import List, Optional, Dict
import uuid
from datetime import datetime
from urllib.parse import urlparse, unquote

from usefly.models import (
    Scenario, SystemConfig, ScenarioCreate,
    CrawlerRun, TaskList
)
from usefly.common.browser_use_common import run_browser_use_agent
from usefly.handlers.task_generation import (
    generate_tasks,
    renumber_tasks,
    update_generation_metadata,
    calculate_auto_selected_tasks
)


def list_scenarios(db: Session) -> List[Scenario]:
    """List all test scenarios."""
    return db.query(Scenario).order_by(Scenario.created_at.desc()).all()

def create_scenario(db: Session, scenario: ScenarioCreate) -> Scenario:
    """Create a new test scenario."""
    db_scenario = Scenario(
        id=str(uuid.uuid4()),
        name=scenario.name,
        website_url=scenario.website_url,
        personas=scenario.personas or ["crawler"],
        description=scenario.description,
        metrics=scenario.metrics,
        email=scenario.email,
        tasks=scenario.tasks,
        selected_task_indices=scenario.selected_task_indices,
        tasks_metadata=scenario.tasks_metadata,
        discovered_urls=scenario.discovered_urls,
        crawler_final_result=scenario.crawler_final_result,
        crawler_extracted_content=scenario.crawler_extracted_content
    )
    db.add(db_scenario)
    db.commit()
    db.refresh(db_scenario)
    return db_scenario

def get_scenario(db: Session, scenario_id: str) -> Optional[Scenario]:
    """Get a specific test scenario."""
    return db.query(Scenario).filter(Scenario.id == scenario_id).first()

def delete_scenario(db: Session, scenario_id: str) -> bool:
    """Delete a test scenario and all related records."""
    from usefly.models import PersonaRun, CrawlerRun

    scenario = db.query(Scenario).filter(Scenario.id == scenario_id).first()
    if not scenario:
        return False

    # Delete related records first to avoid foreign key constraint violations
    db.query(PersonaRun).filter(PersonaRun.config_id == scenario_id).delete()
    db.query(CrawlerRun).filter(CrawlerRun.scenario_id == scenario_id).delete()

    # Now delete the scenario
    db.delete(scenario)
    db.commit()
    return True

def decode_url(url: str) -> str:
    """Decode URL-encoded characters to original form."""
    return unquote(url)


def process_urls(urls: List[str]) -> List[Dict[str, str]]:
    """
    Process URLs to store both encoded and decoded versions.
    Removes duplicates based on encoded URL.

    Args:
        urls: List of URLs from browser-use history

    Returns:
        List of dicts with 'url' (encoded) and 'url_decoded' (decoded)
    """
    seen = set()
    result = []

    for url in urls:
        if url not in seen:
            seen.add(url)
            result.append({
                "url": url,
                "url_decoded": decode_url(url)
            })

    return result


async def analyze_website(db: Session, request) -> Dict:
    sys_config = db.query(SystemConfig).filter(SystemConfig.id == 1).first()
    if not sys_config:
        raise ValueError("System configuration not found. Please configure settings first at /settings")

    hostname = urlparse(request.website_url).netloc or request.website_url
    scenario = Scenario(
        id=str(uuid.uuid4()),
        name=request.name or f"Crawler - {hostname}",
        website_url=request.website_url,
        personas=["crawler"],
        description=request.description,
        metrics=request.metrics,
        email=request.email
    )

    with open('usefly/prompts/website_crawler_prompt.txt', 'r') as f:
        task = f.read()
        task = task.replace('{website}', scenario.website_url)
        task = task.replace('{description}', scenario.description)

    history = await run_browser_use_agent(task=task, system_config=sys_config, max_steps=30)

    raw_urls = history.urls()
    processed_urls = process_urls(raw_urls)
    final_result = history.final_result()
    extracted_content = history.extracted_content()
    duration = history.total_duration_seconds()
    steps_completed = history.number_of_steps()
    is_successful = history.is_successful()
    error_list = history.errors()
    error_str = str(error_list[0]) if error_list else None

    scenario.discovered_urls = processed_urls
    scenario.crawler_final_result = final_result
    scenario.crawler_extracted_content = extracted_content

    task_list = generate_tasks(
            crawler_result=final_result,
            existing_tasks=[],
            model_name=sys_config.model_name,
            api_key=sys_config.api_key
        )

    task_list.website_url = request.website_url

    # Calculate persona distribution
    persona_counts = {}
    for task in task_list.tasks:
        persona_counts[task.persona] = persona_counts.get(task.persona, 0) + 1

    tasks_metadata = {
        "total_tasks": task_list.total_tasks,
        "persona_distribution": persona_counts,
        "generated_at": datetime.now().isoformat()
    }

    # Store tasks in scenario (not saved to DB yet)
    scenario.tasks = [task.dict() for task in task_list.tasks]
    scenario.tasks_metadata = tasks_metadata
    tasks_list = [task.dict() for task in task_list.tasks]

    # Convert extracted content to string
    extracted_content_str = ""
    if isinstance(extracted_content, str):
        extracted_content_str = extracted_content if extracted_content else ""
    elif isinstance(extracted_content, (dict, list)):
        if extracted_content:
            extracted_content_str = str(extracted_content)
    elif extracted_content is not None:
        extracted_content_str = str(extracted_content)

    crawler_run = CrawlerRun(
        id=str(uuid.uuid4()),
        scenario_id=None,  # No scenario in DB yet
        status="success" if is_successful else "error",
        timestamp=datetime.now(),
        duration=duration,
        steps_completed=steps_completed,
        total_steps=30,  # max_steps from agent config
        final_result=str(final_result) if final_result else "",
        extracted_content=extracted_content_str
    )

    db.add(crawler_run)
    db.commit()
    db.refresh(crawler_run)

    return {
        "run_id": crawler_run.id,
        "scenario_id": scenario.id,
        "status": crawler_run.status,
        "duration": crawler_run.duration,
        "steps": crawler_run.steps_completed,
        "error": error_str,
        "crawler_summary": final_result,
        "crawler_extracted_content": extracted_content_str,
        "tasks": tasks_list,
        "tasks_metadata": tasks_metadata if tasks_metadata else None
    }

def update_scenario_tasks(db: Session, scenario_id: str, request) -> Scenario:
    scenario = db.query(Scenario).filter(Scenario.id == scenario_id).first()
    if not scenario:
        raise ValueError("Scenario not found")

    all_tasks = scenario.tasks or []

    selected_indices = [
        i for i, task in enumerate(all_tasks)
        if task.get("number") in request.selected_task_numbers
    ]

    scenario.selected_task_indices = selected_indices

    current_metadata = scenario.tasks_metadata or {}
    scenario.tasks_metadata = {
        **current_metadata,
        "total_selected": len(selected_indices),
        "selected_task_numbers": request.selected_task_numbers,
    }

    db.commit()
    db.refresh(scenario)

    return scenario


def update_scenario_tasks_full(db: Session, scenario_id: str, request) -> Scenario:
    """
    Update scenario tasks array and selection.
    Used when tasks are deleted, edited, or added in the UI.
    """
    scenario = db.query(Scenario).filter(Scenario.id == scenario_id).first()
    if not scenario:
        raise ValueError("Scenario not found")

    # Update the tasks array
    scenario.tasks = request.tasks

    # Calculate selected indices from task numbers
    selected_indices = [
        i for i, task in enumerate(request.tasks)
        if task.get("number") in request.selected_task_numbers
    ]

    scenario.selected_task_indices = selected_indices

    # Update metadata
    current_metadata = scenario.tasks_metadata or {}

    # Recalculate persona distribution
    persona_counts = {}
    for task in request.tasks:
        persona = task.get("persona", "Unknown")
        persona_counts[persona] = persona_counts.get(persona, 0) + 1

    scenario.tasks_metadata = {
        **current_metadata,
        "total_tasks": len(request.tasks),
        "total_selected": len(selected_indices),
        "selected_task_numbers": request.selected_task_numbers,
        "persona_distribution": persona_counts,
    }

    db.commit()
    db.refresh(scenario)

    return scenario


def generate_more_tasks(db: Session, scenario_id: str, request) -> Dict:
    """
    Generate additional tasks for an existing scenario.

    This function orchestrates the task generation process by:
    1. Loading the scenario and system configuration
    2. Generating new tasks using unified task generation
    3. Renumbering and merging with existing tasks
    4. Updating metadata and auto-selecting new tasks
    """
    # Load required data from database
    scenario = _get_scenario_or_raise(db, scenario_id)
    sys_config = _get_system_config_or_raise(db)

    existing_tasks = scenario.tasks or []

    # Generate new tasks using unified task generation (always use friction prompt)
    new_task_list = generate_tasks(
        crawler_result=scenario.crawler_final_result,
        existing_tasks=existing_tasks,
        model_name=sys_config.model_name,
        api_key=sys_config.api_key,
        num_tasks=request.num_tasks,
        custom_prompt=request.custom_prompt
    )

    # Renumber and merge tasks
    renumbered_tasks = renumber_tasks(new_task_list.tasks, existing_tasks)
    all_tasks = existing_tasks + renumbered_tasks

    # Update scenario with new tasks and metadata
    scenario.tasks = all_tasks
    scenario.tasks_metadata = update_generation_metadata(
        current_metadata=scenario.tasks_metadata or {},
        new_tasks=renumbered_tasks,
        all_tasks=all_tasks,
        custom_prompt_used=bool(request.custom_prompt)
    )

    # Auto-select new tasks
    current_selected = (scenario.tasks_metadata or {}).get("selected_task_numbers", [])
    new_task_numbers = [t["number"] for t in renumbered_tasks]
    selected_indices, all_selected = calculate_auto_selected_tasks(
        all_tasks=all_tasks,
        current_selected_numbers=current_selected,
        new_task_numbers=new_task_numbers
    )

    scenario.selected_task_indices = selected_indices
    scenario.tasks_metadata["selected_task_numbers"] = all_selected
    scenario.tasks_metadata["total_selected"] = len(all_selected)

    # Persist changes
    db.commit()
    db.refresh(scenario)

    return {
        "scenario_id": scenario.id,
        "new_tasks": renumbered_tasks,
        "total_tasks": len(all_tasks),
        "tasks_metadata": scenario.tasks_metadata,
        "message": f"Generated {len(renumbered_tasks)} new tasks using friction prompt"
    }


def _get_scenario_or_raise(db: Session, scenario_id: str) -> Scenario:
    """Helper to get scenario or raise clear error."""
    scenario = db.query(Scenario).filter(Scenario.id == scenario_id).first()
    if not scenario:
        raise ValueError("Scenario not found")
    return scenario


def _get_system_config_or_raise(db: Session) -> SystemConfig:
    """Helper to get system config or raise clear error."""
    sys_config = db.query(SystemConfig).filter(SystemConfig.id == 1).first()
    if not sys_config:
        raise ValueError("System configuration not found")
    return sys_config


def get_distinct_personas(db: Session) -> dict:
    """Get all unique persona types from persona_runs table."""
    from sqlalchemy import text
    
    result = db.execute(text("SELECT DISTINCT persona_type FROM persona_runs"))
    personas = [row[0] for row in result.fetchall() if row[0]]
    
    return {
        "personas": sorted(personas)
    }


