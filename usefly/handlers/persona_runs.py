from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional
import uuid

from usefly.models import AgentRun, Scenario, PersonaRunCreate

def list_persona_runs(
    db: Session,
    config_id: Optional[str] = None,
    persona_type: Optional[str] = None,
    status: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
) -> List[AgentRun]:
    """List persona runs with optional filters."""
    query = db.query(AgentRun).order_by(AgentRun.timestamp.desc())

    if config_id:
        query = query.filter(AgentRun.config_id == config_id)
    if persona_type:
        query = query.filter(AgentRun.persona_type == persona_type)
    if status:
        query = query.filter(AgentRun.status == status)

    return query.offset(offset).limit(limit).all()

def create_persona_run(db: Session, run: PersonaRunCreate) -> AgentRun:
    """Create a new persona run."""
    # Verify scenario exists
    scenario = db.query(Scenario).filter(Scenario.id == run.config_id).first()
    if not scenario:
        raise ValueError("Scenario not found")

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

def get_persona_run(db: Session, run_id: str) -> Optional[AgentRun]:
    """Get a specific persona run."""
    return db.query(AgentRun).filter(AgentRun.id == run_id).first()
