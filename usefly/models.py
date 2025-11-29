"""
SQLAlchemy models for Usefly database.

Defines the schema for:
- Config: Configuration for agent test runs
- AgentRun: Individual agent execution record
- Report: Aggregated metrics from multiple agent runs
"""

from datetime import datetime
from typing import Optional, List
from sqlalchemy import Column, String, Integer, Float, DateTime, JSON, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from pydantic import BaseModel
from usefly.database import Base


# ==================== SQLAlchemy Models ====================

class Config(Base):
    """Test configuration for agent runs."""
    __tablename__ = "configs"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False, index=True)
    website_url = Column(String, nullable=False)
    personas = Column(JSON, default=[])  # List of persona types
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    reports = relationship("Report", back_populates="config", cascade="all, delete-orphan")


class AgentRun(Base):
    """Individual agent execution record."""
    __tablename__ = "agent_runs"

    id = Column(String, primary_key=True)
    config_id = Column(String, ForeignKey("configs.id"), nullable=False, index=True)
    report_id = Column(String, ForeignKey("reports.id"), nullable=True, index=True)
    persona_type = Column(String, nullable=False, index=True)
    status = Column(String, nullable=False, index=True)  # success, error, anomaly, in-progress
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
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    config = relationship("Config", backref="agent_runs")
    report = relationship("Report", back_populates="agent_runs")


class Report(Base):
    """Aggregated metrics from multiple agent runs."""
    __tablename__ = "reports"

    id = Column(String, primary_key=True)
    config_id = Column(String, ForeignKey("configs.id"), nullable=False, index=True)
    name = Column(String, nullable=False, index=True)
    description = Column(String)
    is_baseline = Column(Boolean, default=False, index=True)
    metrics_summary = Column(JSON, default={})  # Aggregated metrics
    journey_sankey = Column(JSON, default={})  # Sankey node/link data
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    config = relationship("Config", back_populates="reports")
    agent_runs = relationship("AgentRun", back_populates="report", cascade="all, delete-orphan")


# ==================== Pydantic Schemas (for API) ====================

class FrictionPoint(BaseModel):
    step: str
    type: str
    duration: float


class MetricsData(BaseModel):
    time_to_value: Optional[dict] = None
    onboarding: Optional[dict] = None
    feature_adoption: Optional[dict] = None


class AgentRunCreate(BaseModel):
    """Schema for creating a new agent run."""
    config_id: str
    report_id: Optional[str] = None
    persona_type: str
    status: str
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


class AgentRunResponse(BaseModel):
    """Schema for returning agent run data."""
    id: str
    config_id: str
    report_id: Optional[str]
    persona_type: str
    status: str
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
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ConfigCreate(BaseModel):
    """Schema for creating a new config."""
    name: str
    website_url: str
    personas: List[str] = []


class ConfigResponse(BaseModel):
    """Schema for returning config data."""
    id: str
    name: str
    website_url: str
    personas: List[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class ReportCreate(BaseModel):
    """Schema for creating a new report."""
    config_id: str
    name: str
    description: Optional[str] = None
    is_baseline: bool = False


class ReportResponse(BaseModel):
    """Schema for returning report data."""
    id: str
    config_id: str
    name: str
    description: Optional[str]
    is_baseline: bool
    metrics_summary: dict
    journey_sankey: dict
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
