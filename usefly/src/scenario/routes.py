"""
API routes for scenario management and crawler operations.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel, field_validator
from typing import Optional, List, Dict
from urllib.parse import urlparse
import uuid
from pathlib import Path
from datetime import datetime
from browser_use import Agent, ChatOpenAI
from usefly.database import get_db
from usefly.models import (
    Scenario, SystemConfig, ScenarioCreate, ScenarioResponse,
    CrawlerRun, CrawlerRunResponse
)
from usefly.src.scenario.crawler_agent import save_session
from usefly.src.scenario.utils import process_urls
from usefly.src.scenario.task_generator import generate_tasks_from_crawler_result


router = APIRouter(prefix="/api/scenario", tags=["Scenario"])


# ==================== Request/Response Models ====================

class CrawlerAnalysisRequest(BaseModel):
    """Request payload for crawler analysis."""
    scenario_id: Optional[str] = None
    website_url: str
    description: str = ""
    name: str = ""  # Scenario name
    metrics: List[str] = []  # Selected metrics
    email: str = ""  # User email


class CrawlerAnalysisResponse(BaseModel):
    """Response from crawler analysis."""
    run_id: str
    scenario_id: str
    status: str
    duration: Optional[float] = None
    steps: Optional[int] = None
    error: Optional[str] = None
    crawler_summary: Optional[str] = None  # Crawler final_result
    crawler_extracted_content: str = ""  # Crawler extracted_content (always a string)
    tasks: List[Dict] = []  # Generated UserJourneyTask objects
    tasks_metadata: Optional[Dict] = None  # Task generation metadata

    @field_validator('crawler_extracted_content', mode='before')
    @classmethod
    def ensure_string(cls, v):
        """Ensure crawler_extracted_content is always a string, never a dict"""
        if isinstance(v, str):
            return v
        elif isinstance(v, (dict, list)):
            return str(v) if v else ""
        elif v is None:
            return ""
        else:
            return str(v)


# ==================== Endpoints ====================

# ==================== Scenario CRUD Endpoints ====================

@router.get("s", response_model=List[ScenarioResponse])
def list_scenarios(db: Session = Depends(get_db)):
    """List all test scenarios."""
    scenarios = db.query(Scenario).order_by(Scenario.created_at.desc()).all()
    return scenarios


@router.post("s", response_model=ScenarioResponse)
def create_scenario(scenario: ScenarioCreate, db: Session = Depends(get_db)):
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


@router.get("s/{scenario_id}", response_model=ScenarioResponse)
def get_scenario(scenario_id: str, db: Session = Depends(get_db)):
    """Get a specific test scenario."""
    scenario = db.query(Scenario).filter(Scenario.id == scenario_id).first()
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")
    return scenario


@router.delete("s/{scenario_id}")
def delete_scenario(scenario_id: str, db: Session = Depends(get_db)):
    """Delete a test scenario."""
    scenario = db.query(Scenario).filter(Scenario.id == scenario_id).first()
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")

    db.delete(scenario)
    db.commit()
    return {"message": "Scenario deleted successfully"}


# ==================== Crawler Analysis Endpoints ====================

@router.post("/analyze", response_model=CrawlerAnalysisResponse)
async def analyze_website(
    request: CrawlerAnalysisRequest,
    db: Session = Depends(get_db)
):
    """
    Run crawler analysis on a website.

    This endpoint:
    1. Validates system configuration exists
    2. Creates a temporary scenario (not saved to database)
    3. Runs the browser-based crawler
    4. Saves results to file system and database
    5. Creates CrawlerRun record
    6. Returns run metadata

    Args:
        request: Analysis request with website URL and optional description
        db: Database session

    Returns:
        CrawlerAnalysisResponse with run details

    Raises:
        HTTPException: If system config is missing or crawler fails
    """
    # Get SystemConfig
    sys_config = db.query(SystemConfig).filter(SystemConfig.id == 1).first()
    if not sys_config:
        raise HTTPException(
            status_code=400,
            detail="System configuration not found. Please configure settings first at /settings"
        )

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
    tasks_list = []
    tasks_metadata = {}
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

    return CrawlerAnalysisResponse(
        run_id=crawler_run.id,
        scenario_id=scenario.id,
        status=crawler_run.status,
        duration=crawler_run.duration,
        steps=crawler_run.steps_completed,
        error=None if history.is_successful() else (str(history.errors()[0]) if history.errors() else None),
        crawler_summary=history.final_result(),
        crawler_extracted_content=extracted_content_str,
        tasks=tasks_list,
        tasks_metadata=tasks_metadata if tasks_metadata else None
    )


# ==================== Save Scenario Endpoint ====================

class SaveScenarioRequest(BaseModel):
    """Request to save a scenario with selected tasks."""
    scenario_id: str  # Temporary ID from analyze response
    name: str
    website_url: str
    description: str = ""
    metrics: List[str] = []
    email: str = ""
    selected_task_numbers: List[int] = []  # Task numbers user selected
    all_tasks: List[Dict] = []  # All generated tasks
    tasks_metadata: Dict = {}
    crawler_final_result: Optional[str] = ""  # String from crawler
    crawler_extracted_content: Optional[str] = ""  # String from crawler
    discovered_urls: List[Dict] = []

    @field_validator('crawler_extracted_content', mode='before')
    @classmethod
    def ensure_extracted_content_string(cls, v):
        """Ensure crawler_extracted_content is always a string, never a dict"""
        if isinstance(v, str):
            return v
        elif isinstance(v, (dict, list)):
            return str(v) if v else ""
        elif v is None:
            return ""
        else:
            return str(v)

    @field_validator('crawler_final_result', mode='before')
    @classmethod
    def ensure_final_result_string(cls, v):
        """Ensure crawler_final_result is always a string, never a dict"""
        if isinstance(v, str):
            return v
        elif isinstance(v, (dict, list)):
            return str(v) if v else ""
        elif v is None:
            return ""
        else:
            return str(v)


class SaveScenarioResponse(BaseModel):
    """Response from saving scenario."""
    scenario_id: str
    message: str


@router.post("/save", response_model=SaveScenarioResponse)
def save_scenario(
    request: SaveScenarioRequest,
    db: Session = Depends(get_db)
):
    """
    Save scenario with selected tasks to database.

    This creates a permanent Scenario record with:
    - User-provided metadata (name, email, metrics)
    - Selected tasks only (filtered by selected_task_numbers)
    - Crawler results

    Args:
        request: Save scenario request with all wizard data
        db: Database session

    Returns:
        SaveScenarioResponse with new scenario_id
    """
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

    return SaveScenarioResponse(
        scenario_id=db_scenario.id,
        message=f"Scenario '{request.name}' saved successfully with {len(selected_tasks)} tasks"
    )


class UpdateScenarioTasksRequest(BaseModel):
    """Request to update scenario task selection."""
    selected_task_numbers: List[int] = []

    @field_validator('selected_task_numbers')
    @classmethod
    def validate_task_numbers(cls, v):
        if not v:
            raise ValueError("At least one task must be selected")
        return v


@router.patch("/{scenario_id}/tasks")
def update_scenario_tasks(
    scenario_id: str,
    request: UpdateScenarioTasksRequest,
    db: Session = Depends(get_db)
):
    """
    Update selected tasks for an existing scenario.

    This endpoint allows users to modify which tasks are selected
    for a scenario after it has been created.

    Args:
        scenario_id: ID of the scenario to update
        request: Update request with selected task numbers
        db: Database session

    Returns:
        Updated Scenario object

    Raises:
        HTTPException: If scenario not found or validation fails
    """
    # Get scenario
    scenario = db.query(Scenario).filter(Scenario.id == scenario_id).first()
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")

    # Get all tasks from scenario
    all_tasks = scenario.tasks or []

    # Filter to selected tasks
    selected_tasks = [
        task for task in all_tasks
        if task.get("number") in request.selected_task_numbers
    ]

    if not selected_tasks:
        raise HTTPException(
            status_code=400,
            detail="No tasks match the provided task numbers"
        )

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
