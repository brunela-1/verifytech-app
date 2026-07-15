from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import time, datetime

class AvailabilityBlockCreate(BaseModel):
    day_label: str
    start_time: time
    end_time: time

class AvailabilityBlockUpdate(BaseModel):
    day_label: Optional[str] = None
    start_time: Optional[time] = None
    end_time: Optional[time] = None

class AvailabilityBlockOut(BaseModel):
    id: UUID
    tech_id: UUID
    day_label: str
    start_time: time
    end_time: time
    status: str
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
