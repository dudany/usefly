"""
API routes for scenario management and crawler operations.
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional, List
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


router = APIRouter(prefix="/api/scenario", tags=["Scenario"])


# ==================== Request/Response Models ====================

class CrawlerAnalysisRequest(BaseModel):
    """Request payload for crawler analysis."""
    scenario_id: Optional[str] = None
    website_url: str
    description: str = ""


class CrawlerAnalysisResponse(BaseModel):
    """Response from crawler analysis."""
    run_id: str 
    scenario_id: str 
    status: str
    duration: Optional[float] = None
    steps: Optional[int] = None
    error: Optional[str] = None


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
        name=f"Crawler - {hostname}",
        website_url=request.website_url,
        personas=["crawler"],
        description=request.description
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

    crawler_run = CrawlerRun(
        id=str(uuid.uuid4()),
        scenario_id=None,  # No scenario in DB yet
        status="success" if history.is_successful() else "error",
        timestamp=datetime.now(),
        duration=history.total_duration_seconds(),
        steps_completed=history.number_of_steps(),
        total_steps=30,  # max_steps from agent config
        visited_urls=processed_urls,
        final_result=history.final_result(),
        extracted_content=history.extracted_content(),
        action_history=str(history.action_history()),
        model_actions=str(history.model_actions()),
        model_outputs=str(history.model_outputs()),
        model_thoughts=str(history.model_thoughts()),
        errors=[str(e) for e in history.errors() if e]
    )

    db.add(crawler_run)
    db.commit()
    db.refresh(crawler_run)

    return CrawlerAnalysisResponse(
        run_id=crawler_run.id,
        scenario_id=scenario.id,
        status=crawler_run.status,
        duration=crawler_run.duration,
        steps=crawler_run.steps_completed,
        error=None if history.is_successful() else (str(history.errors()[0]) if history.errors() else None)
    )
