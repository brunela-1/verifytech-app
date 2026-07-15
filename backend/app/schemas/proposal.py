from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime
from decimal import Decimal

class ProposalCreate(BaseModel):
    request_id: UUID
    price: Decimal
    estimated_time: Optional[str] = None
    observations: Optional[str] = None

class ProposalUpdate(BaseModel):
    price: Optional[Decimal] = None
    estimated_time: Optional[str] = None
    observations: Optional[str] = None

class ProposalAcceptBody(BaseModel):
    selected_block_id: Optional[UUID] = None

class ProposalOut(BaseModel):
    id: UUID
    request_id: UUID
    tech_id: UUID
    price: Decimal
    estimated_time: Optional[str] = None
    observations: Optional[str] = None
    status: str
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}

class ProposalAcceptResponse(BaseModel):
    service_id: UUID
    message: str
