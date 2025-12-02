from sqlalchemy.orm import Session
from typing import List, Optional, Dict
import uuid
from datetime import datetime
from urllib.parse import urlparse, unquote
from browser_use import Agent, ChatOpenAI
from langchain_openai import ChatOpenAI as LangchainChatOpenAI
import json

from usefly.models import (
    Scenario, SystemConfig, ScenarioCreate,
    CrawlerRun, UserJourneyTask, TaskList
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
    
    # Read prompt
    with open(f'usefly/prompts/website_crawler_prompt.txt', 'r') as f:
        task = f.read().format(website=scenario.website_url, description=scenario.description)
    
    llm = ChatOpenAI(model=sys_config.model_name, api_key=sys_config.api_key)
    agent = Agent(
        task=task,
        llm=llm,
        max_steps=30,
        use_vision=True,
        use_thinking=True,
        headless=True
    )

    history = await agent.run()
    raw_urls = history.urls()
    processed_urls = process_urls(raw_urls)
    final_result = history.final_result()
    extracted_content = history.extracted_content()

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

    crawler_run = CrawlerRun(
        id=str(uuid.uuid4()),
        scenario_id=None,  # No scenario in DB yet
        status="success" if history.is_successful() else "error",
        timestamp=datetime.now(),
        duration=history.total_duration_seconds(),
        steps_completed=history.number_of_steps(),
        total_steps=30,  # max_steps from agent config
        final_result=str(history.final_result()),
        extracted_content=str(history.extracted_content()) if isinstance(history.extracted_content(), list) else history.extracted_content()
    )

    db.add(crawler_run)
    db.commit()
    db.refresh(crawler_run)

    extracted_content = history.extracted_content()
    extracted_content_str = ""

    # Convert to string, handling all types
    if isinstance(extracted_content, str):
        extracted_content_str = extracted_content if extracted_content else ""
    elif isinstance(extracted_content, (dict, list)):
        # Only convert non-empty dicts/lists to string
        if extracted_content:
            extracted_content_str = str(extracted_content)
        else:
            extracted_content_str = ""
    elif extracted_content is not None:
        # For any other non-None type, convert to string
        extracted_content_str = str(extracted_content)
    else:
        # None -> empty string
        extracted_content_str = ""

    return {
        "run_id": crawler_run.id,
        "scenario_id": scenario.id,
        "status": crawler_run.status,
        "duration": crawler_run.duration,
        "steps": crawler_run.steps_completed,
        "error": None if history.is_successful() else (str(history.errors()[0]) if history.errors() else None),
        "crawler_summary": history.final_result(),
        "crawler_extracted_content": extracted_content_str,
        "tasks": tasks_list,
        "tasks_metadata": tasks_metadata if tasks_metadata else None
    }

def save_scenario(db: Session, request) -> Dict:
    """Save scenario with selected tasks to database."""
    # Filter tasks to only selected ones
    selected_tasks = [
        task for task in request.all_tasks
        if task.get("number") in request.selected_task_numbers
    ]

    # Update tasks_metadata with selection info
    updated_metadata = {
        **request.tasks_metadata,
        "total_generated": len(request.all_tasks),
        "total_selected": len(selected_tasks),
        "selected_task_numbers": request.selected_task_numbers
    }

    # Create permanent scenario
    db_scenario = Scenario(
        id=str(uuid.uuid4()),  # New permanent ID
        name=request.name,
        website_url=request.website_url,
        personas=["crawler"],
        description=request.description,
        metrics=request.metrics,
        email=request.email,
        tasks=selected_tasks,
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
        "message": f"Scenario '{request.name}' saved successfully with {len(selected_tasks)} tasks"
    }

def update_scenario_tasks(db: Session, scenario_id: str, request) -> Scenario:
    """Update selected tasks for an existing scenario."""
    # Get scenario
    scenario = db.query(Scenario).filter(Scenario.id == scenario_id).first()
    if not scenario:
        raise ValueError("Scenario not found")

    # Get all tasks from scenario
    all_tasks = scenario.tasks or []

    # Filter to selected tasks
    selected_tasks = [
        task for task in all_tasks
        if task.get("number") in request.selected_task_numbers
    ]

    if not selected_tasks:
        raise ValueError("No tasks match the provided task numbers")

    # Update scenario
    scenario.tasks = selected_tasks

    # Update tasks_metadata
    current_metadata = scenario.tasks_metadata or {}
    scenario.tasks_metadata = {
        **current_metadata,
        "total_selected": len(selected_tasks),
        "selected_task_numbers": request.selected_task_numbers,
    }

    db.commit()
    db.refresh(scenario)

    return scenario
