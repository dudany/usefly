import uuid
from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks
from sqlalchemy.orm import Session
from usefly.database import get_db, SessionLocal
from usefly.models import Scenario, RunScenarioResponse, RunStatusResponse
from usefly.handlers import scenario_runner

router = APIRouter(prefix="/api/scenario", tags=["Scenario Execution"])


@router.post("/run/{scenario_id}", response_model=RunScenarioResponse)
async def run_persona(
    persona_id: str,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db)
):
    persona = db.query(Scenario).filter(Scenario.id == persona_id).first()
    if not persona:
        raise HTTPException(status_code=404, detail="Scenario not found")

    is_valid, error_msg = scenario_runner.validate_scenario_for_run(persona)
    if not is_valid:
        raise HTTPException(status_code=400, detail=error_msg)

    run_id = str(uuid.uuid4())
    report_id = str(uuid.uuid4())

    selected_indices = persona.selected_task_indices or []
    task_count = len(selected_indices)

    background_tasks.add_task(
        scenario_runner.run_persona_tasks,
        db_session_factory=SessionLocal,
        persona_id=persona_id,
        report_id=report_id,
        run_id=run_id
    )

    return RunScenarioResponse(
        run_id=run_id,
        scenario_id=persona_id,
        report_id=report_id,
        task_count=task_count,
        status="initiated",
        message=f"Started execution of {task_count} tasks in background"
    )


@router.get("/run/{run_id}/status", response_model=RunStatusResponse)
async def get_run_status(run_id: str):
    status = scenario_runner.get_run_status(run_id)

    if not status:
        raise HTTPException(
            status_code=404,
            detail="Run not found or already completed"
        )

    return RunStatusResponse(**status)


@router.delete("/run/{run_id}")
async def acknowledge_run_completion(run_id: str):
    scenario_runner.cleanup_run_status(run_id)
    return {"message": "Run status cleaned up"}
