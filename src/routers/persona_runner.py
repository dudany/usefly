import uuid
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from src.database import get_db, SessionLocal
from src.models import Scenario, PersonaExecutionResponse, RunStatusResponse
from src.handlers import persona_runner

router = APIRouter(prefix="/api/persona", tags=["Persona Execution"])


@router.post("/run/{scenario_id}", response_model=PersonaExecutionResponse)
async def run_persona(scenario_id: str,db: Session = Depends(get_db)):
    scenario = db.query(Scenario).filter(Scenario.id == scenario_id).first()
    if not scenario:
        raise HTTPException(status_code=404, detail="Scenario not found")

    is_valid, error_msg = persona_runner.validate_scenario_for_run(scenario)
    if not is_valid:
        raise HTTPException(status_code=400, detail=error_msg)

    run_id = str(uuid.uuid4())
    report_id = str(uuid.uuid4())

    selected_indices = scenario.selected_task_indices or [] #TODO why it selects indices but not runs them?
    task_count = len(selected_indices)
    await persona_runner.run_persona_tasks(db_session_factory=SessionLocal,scenario_id=scenario_id,report_id=report_id,run_id=run_id)
    

    return PersonaExecutionResponse(
        run_id=run_id,
        scenario_id=scenario_id,
        report_id=report_id,
        task_count=task_count,
        status="initiated",
        message=f"Started execution of {task_count} tasks in background"
    )


@router.get("/run/{run_id}/status", response_model=RunStatusResponse)
async def get_run_status(run_id: str):
    status = persona_runner.get_run_status(run_id)

    if not status:
        raise HTTPException(
            status_code=404,
            detail="Run not found or already completed"
        )

    return RunStatusResponse(**status)


@router.delete("/run/{run_id}")
async def acknowledge_run_completion(run_id: str):
    persona_runner.cleanup_run_status(run_id)
    return {"message": "Run status cleaned up"}
