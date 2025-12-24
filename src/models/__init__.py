"""
Usefly models package.

Exports all SQLAlchemy models and Pydantic schemas for easy importing.
"""

# Scenario models
from src.models.scenario import (
    Scenario,
    ScenarioCreate,
    ScenarioResponse,
)

# Agent/Persona run models
from src.models.persona_run import (
    PersonaRun,
    PersonaRunCreate,
    PersonaRunResponse,
    PersonaExecutionResponse,
    RunStatusResponse,
    TaskProgressStatus,
    ActiveExecutionsResponse,
)

# Indexer run models
from src.models.indexer_run import (
    IndexerRun,
    IndexerRunCreate,
    IndexerRunResponse,
)

# System config models
from src.models.system_config import (
    SystemConfig,
    SystemConfigCreate,
    SystemConfigResponse,
)

# Common models
from src.models.common import (
    FrictionPoint,
    MetricsData,
    UserJourneyTask,
    TaskList,
)

# API schemas (request/response models)
from src.models.schemas import (
    IndexerAnalysisRequest,
    IndexerAnalysisResponse,
    AsyncAnalysisResponse,
    UpdateScenarioTasksRequest,
    UpdateScenarioTasksFullRequest,
    GenerateMoreTasksRequest,
    GenerateMoreTasksResponse,
)

__all__ = [
    # Scenario
    "Scenario",
    "ScenarioCreate",
    "ScenarioResponse",
    # Agent/Persona run
    "PersonaRun",
    "PersonaRunCreate",
    "PersonaRunResponse",
    "PersonaExecutionResponse",
    "RunStatusResponse",
    "TaskProgressStatus",
    "ActiveExecutionsResponse",
    # Indexer run
    "IndexerRun",
    "IndexerRunCreate",
    "IndexerRunResponse",
    # System config
    "SystemConfig",
    "SystemConfigCreate",
    "SystemConfigResponse",
    # Common
    "FrictionPoint",
    "MetricsData",
    "UserJourneyTask",
    "TaskList",
    # API schemas
    "IndexerAnalysisRequest",
    "IndexerAnalysisResponse",
    "AsyncAnalysisResponse",
    "UpdateScenarioTasksRequest",
    "UpdateScenarioTasksFullRequest",
    "GenerateMoreTasksRequest",
    "GenerateMoreTasksResponse",
]
