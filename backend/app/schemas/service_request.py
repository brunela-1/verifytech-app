from pydantic import BaseModel
from typing import Optional, List
from uuid import UUID
from datetime import datetime

class RequestImageOut(BaseModel):
    id: UUID
    image_url: str
    model_config = {"from_attributes": True}

class ServiceRequestCreate(BaseModel):
    title: str
    category: str
    description: Optional[str] = None
    address: Optional[str] = None

class ServiceRequestUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    address: Optional[str] = None

class ServiceRequestOut(BaseModel):
    id: UUID
    client_id: UUID
    title: str
    category: str
    description: Optional[str] = None
    address: Optional[str] = None
    status: str
    created_at: Optional[datetime] = None
    images: List[RequestImageOut] = []
    proposals_count: int = 0

    model_config = {"from_attributes": True}

class AddImagesBody(BaseModel):
    image_urls: List[str]
