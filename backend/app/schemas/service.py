from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime

class ServiceStatusUpdate(BaseModel):
    status: str

class ServiceOut(BaseModel):
    id: UUID
    proposal_id: UUID
    request_id: UUID
    tech_id: UUID
    client_id: UUID
    status: str
    scheduled_block_id: Optional[UUID] = None
    scheduled_start: Optional[datetime] = None
    scheduled_end: Optional[datetime] = None
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}
