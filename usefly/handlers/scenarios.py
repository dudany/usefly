from sqlalchemy.orm import Session
from typing import List, Optional, Dict
import uuid
from datetime import datetime
from urllib.parse import urlparse, unquote
from langchain_openai import ChatOpenAI as LangchainChatOpenAI
import json

from usefly.models import (
    Scenario, SystemConfig, ScenarioCreate,
    CrawlerRun, UserJourneyTask, TaskList
)
from usefly.common.browser_use_common import run_browser_use_agent


def list_scenarios(db: Session) -> List[Scenario]:
    """List all test scenarios."""
    return db.query(Scenario).order_by(Scenario.created_at.desc()).all()

def create_scenario(db: Session, scenario: ScenarioCreate) -> Scenario:
    """Create a new test scenario."""
    db_scenario = Scenario(
        id=str(uuid.uuid4()),
        name=scenario.name,
        website_url=scenario.website_url,
        personas=scenario.personas,
    )
    db.add(db_scenario)
    db.commit()
    db.refresh(db_scenario)
    return db_scenario

def get_scenario(db: Session, scenario_id: str) -> Optional[Scenario]:
    """Get a specific test scenario."""
    return db.query(Scenario).filter(Scenario.id == scenario_id).first()

def delete_scenario(db: Session, scenario_id: str) -> bool:
    """Delete a test scenario."""
    scenario = db.query(Scenario).filter(Scenario.id == scenario_id).first()
    if not scenario:
        return False

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


def generate_tasks_from_crawler_result(
    crawler_final_result: Dict,
    website_url: str,
    model_name: str,
    api_key: Optional[str] = None
) -> TaskList:
    with open("usefly/prompts/task_generator_prompt.txt") as f:
        task_generator_prompt = f.read()

    # Initialize LLM
    llm = LangchainChatOpenAI(model=model_name, api_key=api_key)

    # Create agent with structured output
    agent = llm.with_structured_output(TaskList)

    # Format input - convert crawler result to string for LLM
    
    crawler_content = json.dumps(crawler_final_result, indent=2) if isinstance(crawler_final_result, dict) else str(crawler_final_result)

    input_text = (
        f"{task_generator_prompt}\n\n"
        f"Here's the website structure content, generate the response from it:\n"
        f"{crawler_content}"
    )

    # Generate tasks
    tasks = agent.invoke(input_text)

    # Calculate total_tasks if not provided
    if tasks.total_tasks == 0:
        tasks.total_tasks = len(tasks.tasks)

    tasks.website_url = website_url

    return tasks

async def analyze_website(db: Session, request) -> Dict:
    """
    Run crawler analysis on a website.
    Returns a dictionary with run details and results.
    """
    # Get SystemConfig
    sys_config = db.query(SystemConfig).filter(SystemConfig.id == 1).first()
    if not sys_config:
        raise ValueError("System configuration not found. Please configure settings first at /settings")

    # Create temporary scenario (not saved to database)
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

    with open(f'usefly/prompts/website_crawler_prompt.txt', 'r') as f:
        task = f.read().format(website=scenario.website_url, description=scenario.description)

    history = await run_browser_use_agent(task=task, system_config=sys_config, max_steps=30)

    # Extract data from history object
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

    # Generate tasks from crawler results
    task_list = generate_tasks_from_crawler_result(
        crawler_final_result=final_result,
        website_url=request.website_url,
        model_name=sys_config.model_name,
        api_key=sys_config.api_key
    )

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

def save_scenario(db: Session, request) -> Dict:
    all_tasks = request.all_tasks

    selected_indices = [
        i for i, task in enumerate(all_tasks)
        if task.get("number") in request.selected_task_numbers
    ]

    updated_metadata = {
        **request.tasks_metadata,
        "total_generated": len(all_tasks),
        "total_selected": len(selected_indices),
        "selected_task_numbers": request.selected_task_numbers
    }

    db_scenario = Scenario(
        id=str(uuid.uuid4()),
        name=request.name,
        website_url=request.website_url,
        personas=["crawler"],
        description=request.description,
        metrics=request.metrics,
        email=request.email,
        tasks=all_tasks,
        selected_task_indices=selected_indices,
        tasks_metadata=updated_metadata,
        discovered_urls=request.discovered_urls,
        crawler_final_result=request.crawler_final_result,
        crawler_extracted_content=request.crawler_extracted_content
    )

    db.add(db_scenario)
    db.commit()
    db.refresh(db_scenario)

    return {
        "scenario_id": db_scenario.id,
        "message": f"Scenario '{request.name}' saved successfully with {len(selected_indices)} tasks"
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

    if not selected_indices:
        raise ValueError("No tasks match the provided task numbers")

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
