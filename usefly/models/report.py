"""
Report models for aggregated metrics and analysis.
"""

from datetime import datetime
from typing import Optional
from sqlalchemy import Column, String, DateTime, JSON, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from pydantic import BaseModel
from usefly.database import Base


class Report(Base):
    """Aggregated metrics from multiple agent runs."""
    __tablename__ = "reports"

    id = Column(String, primary_key=True)
    config_id = Column(String, ForeignKey("scenarios.id"), nullable=False, index=True)
    name = Column(String, nullable=False, index=True)
    description = Column(String)
    is_baseline = Column(Boolean, default=False, index=True)
    metrics_summary = Column(JSON, default={})  # Aggregated metrics
    journey_sankey = Column(JSON, default={})  # Sankey node/link data
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationships
    config = relationship("Scenario", back_populates="reports")
    agent_runs = relationship("AgentRun", back_populates="report", cascade="all, delete-orphan")


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
