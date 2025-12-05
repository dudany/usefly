from sqlalchemy.orm import Session
from sqlalchemy import desc
from typing import List, Optional
import uuid

from usefly.models import PersonaRun, Scenario, PersonaRunCreate

def list_persona_runs(
    db: Session,
    config_id: Optional[str] = None,
    persona_type: Optional[str] = None,
    limit: int = 50,
    offset: int = 0,
) -> List[PersonaRun]:
    """List persona runs with optional filters."""
    query = db.query(PersonaRun).order_by(PersonaRun.timestamp.desc())

    if config_id:
        query = query.filter(PersonaRun.config_id == config_id)
    if persona_type:
        query = query.filter(PersonaRun.persona_type == persona_type)

    return query.offset(offset).limit(limit).all()

def create_persona_run(db: Session, run: PersonaRunCreate) -> PersonaRun:
    """Create a new persona run."""
    # Verify scenario exists
    scenario = db.query(Scenario).filter(Scenario.id == run.config_id).first()
    if not scenario:
        raise ValueError("Scenario not found")

    db_run = PersonaRun(
        id=str(uuid.uuid4()),
        config_id=run.config_id,
        report_id=run.report_id,
        persona_type=run.persona_type,
        is_done=run.is_done,
        timestamp=run.timestamp,
        duration_seconds=run.duration_seconds,
        platform=run.platform,
        location=run.location,
        error_type=run.error_type,
        steps_completed=run.steps_completed,
        total_steps=run.total_steps,
        final_result=run.final_result,
        judgement_data=run.judgement_data,
        task_description=run.task_description,
        events=run.events,
    )
    db.add(db_run)
    db.commit()
    db.refresh(db_run)
    return db_run

def get_persona_run(db: Session, run_id: str) -> Optional[PersonaRun]:
    """Get a specific persona run."""
    return db.query(PersonaRun).filter(PersonaRun.id == run_id).first()
