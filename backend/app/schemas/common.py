from datetime import datetime
from typing import Literal

from pydantic import BaseModel, ConfigDict, Field


LabStatus = Literal["not_started", "in_progress", "completed", "submitted"]
TechnologyStatus = Literal["not_started", "in_progress", "completed"]


class OrmModel(BaseModel):
    model_config = ConfigDict(from_attributes=True)


class Timestamped(OrmModel):
    created_at: datetime
    updated_at: datetime


class ProgressMixin(BaseModel):
    progress: int = Field(default=0, ge=0, le=100)

