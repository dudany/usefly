"""
Agent/Persona run models for execution records.
"""

from datetime import datetime
from typing import Optional, List
from sqlalchemy import Column, String, Integer, DateTime, JSON, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from pydantic import BaseModel
from usefly.database import Base


class PersonaRun(Base):
    """Individual persona execution record."""
    __tablename__ = "persona_runs"

    id = Column(String, primary_key=True)
    config_id = Column(String, ForeignKey("scenarios.id"), nullable=False, index=True)
    report_id = Column(String, nullable=True, index=True)
    persona_type = Column(String, nullable=False, index=True)
    is_done = Column(Boolean, default=False, nullable=False)
    timestamp = Column(DateTime, nullable=False, index=True)
    duration_seconds = Column(Integer)  # seconds
    platform = Column(String, default="web")
    error_type = Column(String)  # Error type for failed runs
    steps_completed = Column(Integer, default=0)
    total_steps = Column(Integer, default=0)
    final_result = Column(String, nullable=False)  # Final result from agent execution
    judgement_data = Column(JSON, default={})  # Full judgement result from agent (reasoning, verdict, failure_reason, etc.)
    task_description = Column(String, nullable=False)  # Description of the task
    task_goal = Column(String, nullable=False)  # Goal of the task
    task_steps = Column(String, nullable=False)  # Steps to complete the task
    task_url = Column(String, nullable=False)  # Starting URL for the task
    events = Column(JSON, default=[])

    # Relationships
    config = relationship("Scenario", backref="persona_runs")


class PersonaRunCreate(BaseModel):
    """Schema for creating a new persona run."""
    config_id: str
    task_description: str
    task_goal: str
    task_steps: str
    task_url: str
    final_result: str
    persona_type: str
    report_id: Optional[str] = None
    is_done: bool = False
    timestamp: datetime
    duration_seconds: Optional[float] = None
    platform: str = "web"
    error_type: Optional[str] = None
    steps_completed: int = 0
    total_steps: int = 0
    
    judgement_data: dict = {}
  
    events: List[dict] = []


class PersonaRunResponse(BaseModel):
    """Schema for returning persona run data."""
    id: str
    config_id: str
    report_id: Optional[str]
    persona_type: str
    is_done: bool
    timestamp: datetime
    duration_seconds: Optional[float]
    platform: str
    error_type: Optional[str]
    steps_completed: int
    total_steps: int
    final_result: Optional[str]
    judgement_data: dict
    task_description: Optional[str]
    task_goal: Optional[str]
    task_steps: Optional[str]
    task_url: Optional[str]
    events: List[dict]

    class Config:
        from_attributes = True


class PersonaExecutionResponse(BaseModel):
    run_id: str
    scenario_id: str
    report_id: str
    task_count: int
    status: str
    message: str


class RunStatusResponse(BaseModel):
    run_id: str
    status: str
    total_tasks: int
    completed_tasks: int
    failed_tasks: int
    agent_run_ids: List[str]
