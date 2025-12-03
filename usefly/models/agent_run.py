"""
Agent/Persona run models for execution records.
"""

from datetime import datetime
from typing import Optional, List
from sqlalchemy import Column, String, Integer, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from pydantic import BaseModel
from usefly.database import Base


class AgentRun(Base):
    """Individual agent execution record."""
    __tablename__ = "persona_runs"

    id = Column(String, primary_key=True)
    config_id = Column(String, ForeignKey("scenarios.id"), nullable=False, index=True)
    report_id = Column(String, ForeignKey("reports.id"), nullable=True, index=True)
    persona_type = Column(String, nullable=False, index=True)
    status = Column(String, nullable=False, index=True)  # success, error, anomaly, in-progress
    run_status = Column(String, nullable=True)  # Agent run status: completed, failed, in-progress
    verdict_status = Column(String, nullable=True)  # Verdict from agent: True/False or result reason
    timestamp = Column(DateTime, nullable=False, index=True)
    duration = Column(Integer)  # seconds
    platform = Column(String, default="web")
    location = Column(String)  # Geographic location (US, UK, CA, DE, FR, etc.)
    error_type = Column(String)  # Error type for failed runs
    steps_completed = Column(Integer, default=0)
    total_steps = Column(Integer, default=0)
    journey_path = Column(JSON, default=[])  # List of page names
    goals_achieved = Column(JSON, default=[])  # List of goal strings
    friction_points = Column(JSON, default=[])  # List of friction point objects
    metrics = Column(JSON, default={})  # Nested metrics object
    judgement_data = Column(JSON, default={})  # Full judgement result from agent (reasoning, verdict, failure_reason, etc.)
    initial_prompt = Column(String)
    urls_visited = Column(JSON, default=[])
    events = Column(JSON, default=[])
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    config = relationship("Scenario", backref="agent_runs")
    report = relationship("Report", back_populates="agent_runs")


class PersonaRunCreate(BaseModel):
    """Schema for creating a new persona run."""
    config_id: str
    report_id: Optional[str] = None
    persona_type: str
    status: str
    run_status: Optional[str] = None  # Agent run completion status from history
    verdict_status: Optional[str] = None  # Verdict result (True/False or failure reason)
    timestamp: datetime
    duration: Optional[int] = None
    platform: str = "web"
    location: Optional[str] = None
    error_type: Optional[str] = None
    steps_completed: int = 0
    total_steps: int = 0
    journey_path: List[str] = []
    goals_achieved: List[str] = []
    friction_points: List[dict] = []
    metrics: dict = {}
    judgement_data: dict = {}  # Full judgement object from agent history
    initial_prompt: Optional[str] = None
    urls_visited: List[str] = []
    events: List[dict] = []


class PersonaRunResponse(BaseModel):
    """Schema for returning persona run data."""
    id: str
    config_id: str
    report_id: Optional[str]
    persona_type: str
    status: str
    run_status: Optional[str]
    verdict_status: Optional[str]
    timestamp: datetime
    duration: Optional[int]
    platform: str
    location: Optional[str]
    error_type: Optional[str]
    steps_completed: int
    total_steps: int
    journey_path: List[str]
    goals_achieved: List[str]
    friction_points: list
    metrics: dict
    judgement_data: dict
    initial_prompt: Optional[str]
    urls_visited: List[str]
    events: List[dict]
    created_at: datetime
    updated_at: datetime

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
