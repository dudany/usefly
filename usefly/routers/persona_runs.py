from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List

from usefly.database import get_db
from usefly.models import AgentRunResponse, AgentRunCreate
from usefly.handlers import agent_runs as agent_runs_handler

router = APIRouter(prefix="/api/agent-runs", tags=["Agent Runs"])

@router.get("", response_model=List[AgentRunResponse])
def list_agent_runs(
    config_id: str = None,
    persona_type: str = None,
    status: str = None,
    limit: int = 50,
    offset: int = 0,
    db: Session = Depends(get_db),
):
    """List agent runs with optional filters."""
    return agent_runs_handler.list_agent_runs(
        db, config_id, persona_type, status, limit, offset
    )

@router.post("", response_model=AgentRunResponse)
def create_agent_run(run: AgentRunCreate, db: Session = Depends(get_db)):
    """Create a new agent run."""
    try:
        return agent_runs_handler.create_agent_run(db, run)
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.get("/{run_id}", response_model=AgentRunResponse)
def get_agent_run(run_id: str, db: Session = Depends(get_db)):
    """Get a specific agent run."""
    run = agent_runs_handler.get_agent_run(db, run_id)
    if not run:
        raise HTTPException(status_code=404, detail="Agent run not found")
    return run
