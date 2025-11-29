"""
FastAPI routes for Usefly API endpoints.

Provides CRUD operations for:
- Test configurations
- Agent runs
- Reports
"""

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List
from datetime import datetime
import uuid

from usefly.database import get_db
from usefly.models import (
    Config,
    AgentRun,
    Report,
    ConfigCreate,
    ConfigResponse,
    AgentRunCreate,
    AgentRunResponse,
    ReportCreate,
    ReportResponse,
)

router = APIRouter(prefix="/api", tags=["API"])


# ==================== Config Endpoints ====================

@router.get("/configs", response_model=List[ConfigResponse])
def list_configs(db: Session = Depends(get_db)):
    """List all test configurations."""
    configs = db.query(Config).order_by(Config.created_at.desc()).all()
    return configs


@router.post("/configs", response_model=ConfigResponse)
def create_config(config: ConfigCreate, db: Session = Depends(get_db)):
    """Create a new test configuration."""
    db_config = Config(
        id=str(uuid.uuid4()),
        name=config.name,
        website_url=config.website_url,
        personas=config.personas,
    )
    db.add(db_config)
    db.commit()
    db.refresh(db_config)
    return db_config


@router.get("/configs/{config_id}", response_model=ConfigResponse)
def get_config(config_id: str, db: Session = Depends(get_db)):
    """Get a specific test configuration."""
    config = db.query(Config).filter(Config.id == config_id).first()
    if not config:
        raise HTTPException(status_code=404, detail="Config not found")
    return config


# ==================== Agent Run Endpoints ====================

@router.get("/agent-runs", response_model=List[AgentRunResponse])
def list_agent_runs(
    config_id: str = None,
    persona_type: str = None,
    status: str = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
):
    """List agent runs with optional filters."""
    query = db.query(AgentRun).order_by(AgentRun.timestamp.desc())

    if config_id:
        query = query.filter(AgentRun.config_id == config_id)
    if persona_type:
        query = query.filter(AgentRun.persona_type == persona_type)
    if status:
        query = query.filter(AgentRun.status == status)

    runs = query.offset(offset).limit(limit).all()
    return runs


@router.post("/agent-runs", response_model=AgentRunResponse)
def create_agent_run(run: AgentRunCreate, db: Session = Depends(get_db)):
    """Create a new agent run."""
    # Verify config exists
    config = db.query(Config).filter(Config.id == run.config_id).first()
    if not config:
        raise HTTPException(status_code=404, detail="Config not found")

    db_run = AgentRun(
        id=str(uuid.uuid4()),
        config_id=run.config_id,
        report_id=run.report_id,
        persona_type=run.persona_type,
        status=run.status,
        timestamp=run.timestamp,
        duration=run.duration,
        platform=run.platform,
        location=run.location,
        error_type=run.error_type,
        steps_completed=run.steps_completed,
        total_steps=run.total_steps,
        journey_path=run.journey_path,
        goals_achieved=run.goals_achieved,
        friction_points=run.friction_points,
        metrics=run.metrics,
    )
    db.add(db_run)
    db.commit()
    db.refresh(db_run)
    return db_run


@router.get("/agent-runs/{run_id}", response_model=AgentRunResponse)
def get_agent_run(run_id: str, db: Session = Depends(get_db)):
    """Get a specific agent run."""
    run = db.query(AgentRun).filter(AgentRun.id == run_id).first()
    if not run:
        raise HTTPException(status_code=404, detail="Agent run not found")
    return run


# ==================== Report Endpoints ====================

@router.get("/reports", response_model=List[ReportResponse])
def list_reports(
    config_id: str = None,
    is_baseline: bool = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
):
    """List reports with optional filters."""
    query = db.query(Report).order_by(Report.created_at.desc())

    if config_id:
        query = query.filter(Report.config_id == config_id)
    if is_baseline is not None:
        query = query.filter(Report.is_baseline == is_baseline)

    reports = query.offset(offset).limit(limit).all()
    return reports


@router.post("/reports", response_model=ReportResponse)
def create_report(report: ReportCreate, db: Session = Depends(get_db)):
    """Create a new report."""
    # Verify config exists
    config = db.query(Config).filter(Config.id == report.config_id).first()
    if not config:
        raise HTTPException(status_code=404, detail="Config not found")

    # Calculate metrics summary from runs with this config
    config_runs = db.query(AgentRun).filter(AgentRun.config_id == report.config_id).all()

    # Calculate metrics summary
    metrics_summary = _calculate_metrics_summary(config_runs)

    # Generate sankey data
    journey_sankey = _generate_sankey_data(config_runs)

    db_report = Report(
        id=str(uuid.uuid4()),
        config_id=report.config_id,
        name=report.name,
        description=report.description,
        is_baseline=report.is_baseline,
        metrics_summary=metrics_summary,
        journey_sankey=journey_sankey,
    )
    db.add(db_report)
    db.commit()
    db.refresh(db_report)
    return db_report


@router.get("/reports/{report_id}", response_model=ReportResponse)
def get_report(report_id: str, db: Session = Depends(get_db)):
    """Get a specific report."""
    report = db.query(Report).filter(Report.id == report_id).first()
    if not report:
        raise HTTPException(status_code=404, detail="Report not found")
    return report


# ==================== Helper Functions ====================

def _calculate_metrics_summary(agent_runs: List[AgentRun]) -> dict:
    """Calculate aggregated metrics from agent runs."""
    if not agent_runs:
        return {}

    success_count = sum(1 for run in agent_runs if run.status == "success")
    error_count = sum(1 for run in agent_runs if run.status == "error")
    anomaly_count = sum(1 for run in agent_runs if run.status == "anomaly")

    avg_duration = sum(run.duration or 0 for run in agent_runs) / len(agent_runs) if agent_runs else 0
    avg_completion = sum(run.steps_completed for run in agent_runs) / len(agent_runs) if agent_runs else 0

    return {
        "total_runs": len(agent_runs),
        "success_count": success_count,
        "error_count": error_count,
        "anomaly_count": anomaly_count,
        "success_rate": success_count / len(agent_runs) if agent_runs else 0,
        "avg_duration": avg_duration,
        "avg_completion": avg_completion,
    }


def _generate_sankey_data(agent_runs: List[AgentRun]) -> dict:
    """Generate Sankey diagram data from journey paths."""
    if not agent_runs:
        return {"nodes": [], "links": []}

    # Collect all unique pages
    pages = set()
    for run in agent_runs:
        pages.update(run.journey_path)

    pages_list = sorted(list(pages))
    page_to_index = {page: idx for idx, page in enumerate(pages_list)}

    # Count transitions
    transitions = {}
    for run in agent_runs:
        path = run.journey_path
        for i in range(len(path) - 1):
            source = path[i]
            target = path[i + 1]
            key = (source, target)
            transitions[key] = transitions.get(key, 0) + 1

    # Build nodes with stats
    nodes = []
    page_stats = {page: {"visits": 0, "errors": 0} for page in pages_list}

    for run in agent_runs:
        for page in run.journey_path:
            page_stats[page]["visits"] += 1
        # Add errors from friction points
        for friction in run.friction_points:
            if friction.get("step") in page_stats:
                page_stats[friction["step"]]["errors"] += 1

    for page in pages_list:
        nodes.append({
            "name": page,
            "visits": page_stats[page]["visits"],
            "errors": page_stats[page]["errors"],
        })

    # Build links
    links = []
    for (source, target), count in transitions.items():
        links.append({
            "source": page_to_index[source],
            "target": page_to_index[target],
            "value": count,
        })

    return {"nodes": nodes, "links": links}
