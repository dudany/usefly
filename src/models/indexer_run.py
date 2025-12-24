"""
Indexer run models for web indexing operations.
"""

from datetime import datetime
from typing import Optional
from sqlalchemy import Column, String, Integer, Float, DateTime, JSON, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from pydantic import BaseModel
from src.database import Base


class IndexerRun(Base):
    """Indexer agent execution record."""
    __tablename__ = "indexer_runs"

    id = Column(String, primary_key=True)
    scenario_id = Column(String, ForeignKey("scenarios.id"), nullable=True, index=True)
    status = Column(String, nullable=False, index=True)  # success, error, in-progress
    timestamp = Column(DateTime, nullable=False, index=True)
    duration = Column(Float)  # seconds
    extracted_content = Column(String)
    final_result = Column(String)  # Stringified final result from indexer
    # Indexer-specific fields
    steps_completed = Column(Integer, default=0)
    total_steps = Column(Integer, default=0)

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationship
    scenario = relationship("Scenario", backref="indexer_runs")


class IndexerRunCreate(BaseModel):
    """Schema for creating a new indexer run."""
    scenario_id: Optional[str] = None
    status: str
    timestamp: datetime
    duration: Optional[float] = None
    steps_completed: int = 0
    total_steps: int = 0
    final_result: Optional[str] = None
    extracted_content: Optional[str] = None


class IndexerRunResponse(BaseModel):
    """Schema for returning indexer run data."""
    id: str
    scenario_id: Optional[str]
    status: str
    timestamp: datetime
    duration: Optional[float]
    steps_completed: int
    total_steps: int
    final_result: Optional[str]
    extracted_content: Optional[str]
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True
