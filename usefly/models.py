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
from pydantic import BaseModel, Field
from usefly.database import Base


# ==================== SQLAlchemy Models ====================

class Scenario(Base):
    """Test scenario configuration for agent runs."""
    __tablename__ = "scenarios"

    id = Column(String, primary_key=True)
    name = Column(String, nullable=False, index=True)
    website_url = Column(String, nullable=False)
    personas = Column(JSON, default=[])  # List of persona types
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())
    description = Column(String, default="")

    # Crawler results fields
    discovered_urls = Column(JSON, default=[])  # List of {url, url_decoded} objects
    crawler_final_result = Column(String, default="")  # String from crawler
    crawler_extracted_content = Column(String, default="")  # String from crawler

    # Scenario metadata fields
    metrics = Column(JSON, default=[])  # List of selected metric strings
    email = Column(String, default="")  # Email for notifications
    tasks = Column(JSON, default=[])  # List of generated UserJourneyTask dicts
    tasks_metadata = Column(JSON, default={})  # Metadata about task generation (total_tasks, persona_distribution, etc.)
    selected_task_indices = Column(JSON, default=[])  # List of selected task indices

    # Relationships
    reports = relationship("Report", back_populates="config", cascade="all, delete-orphan")


class AgentRun(Base):
    """Individual agent execution record."""
    __tablename__ = "agent_runs"

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


class CrawlerRun(Base):
    """Crawler agent execution record."""
    __tablename__ = "crawler_runs"

    id = Column(String, primary_key=True)
    scenario_id = Column(String, ForeignKey("scenarios.id"), nullable=True, index=True)
    status = Column(String, nullable=False, index=True)  # success, error, in-progress
    timestamp = Column(DateTime, nullable=False, index=True)
    duration = Column(Float)  # seconds
    extracted_content = Column(String)
    final_result = Column(String)  # Stringified final result from crawler
    # Crawler-specific fields
    steps_completed = Column(Integer, default=0)
    total_steps = Column(Integer, default=0)

    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())

    # Relationship
    scenario = relationship("Scenario", backref="crawler_runs")


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


class AgentRunResponse(BaseModel):
    """Schema for returning agent run data."""
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


class ScenarioCreate(BaseModel):
    """Schema for creating a new scenario."""
    name: str
    website_url: str
    personas: List[str] = []


class ScenarioResponse(BaseModel):
    """Schema for returning scenario data."""
    id: str
    name: str
    website_url: str
    personas: List[str]
    created_at: datetime
    updated_at: datetime
    description: str = ""
    discovered_urls: List[dict] = []
    crawler_final_result: str = ""
    crawler_extracted_content: str = ""
    metrics: List[str] = []
    email: str = ""
    tasks: List[dict] = []
    tasks_metadata: dict = {}
    selected_task_indices: List[int] = []

    class Config:
        from_attributes = True


class RunScenarioResponse(BaseModel):
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


class CrawlerRunCreate(BaseModel):
    """Schema for creating a new crawler run."""
    scenario_id: Optional[str] = None
    status: str
    timestamp: datetime
    duration: Optional[float] = None
    steps_completed: int = 0
    total_steps: int = 0
    final_result: Optional[str] = None
    extracted_content: Optional[str] = None


class CrawlerRunResponse(BaseModel):
    """Schema for returning crawler run data."""
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


# ==================== System Configuration ====================

class SystemConfig(Base):
    """System configuration (singleton)."""
    __tablename__ = "system_config"

    id = Column(Integer, primary_key=True, default=1)
    model_name = Column(String, nullable=False, default="gpt-4o")
    api_key = Column(String, nullable=False)
    use_thinking = Column(Boolean, nullable=False, default=True)
    created_at = Column(DateTime, server_default=func.now())
    updated_at = Column(DateTime, server_default=func.now(), onupdate=func.now())


class SystemConfigCreate(BaseModel):
    """Schema for creating/updating system config."""
    model_name: str = "gpt-4o"
    api_key: str
    use_thinking: bool = True


class SystemConfigResponse(BaseModel):
    """Schema for returning system config data."""
    id: int
    model_name: str
    api_key: str
    use_thinking: bool
    created_at: datetime
    updated_at: datetime

    class Config:
        from_attributes = True


class UserJourneyTask(BaseModel):
    """Represents a single user journey task."""
    number: int = Field(description="Task number")
    starting_url: str = Field(description="Starting URL where user begins")
    goal: str = Field(description="User's goal/intention (e.g., 'Buy spicy onion jam for dinner party')")
    steps: str = Field(description="Step-by-step actions user takes")
    persona: str = Field(description="User persona category: SHOPPER, RESEARCHER, LOCAL_VISITOR, SUPPORT_SEEKER, or BROWSER")


class TaskList(BaseModel):
    """List of generated user journey tasks."""
    tasks: List[UserJourneyTask] = Field(description="List of user journey tasks")
    total_tasks: int = Field(default=0, description="Total number of tasks")
    website_url: str = Field(default="", description="Website base URL")
