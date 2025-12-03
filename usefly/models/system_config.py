"""
System configuration models.
"""

from datetime import datetime
from sqlalchemy import Column, Integer, String, Boolean, DateTime
from sqlalchemy.sql import func
from pydantic import BaseModel
from usefly.database import Base


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
