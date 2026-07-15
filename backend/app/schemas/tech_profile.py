from pydantic import BaseModel
from typing import Optional
from uuid import UUID
from datetime import datetime
from decimal import Decimal

class TechProfileBase(BaseModel):
    specialty: Optional[str] = None
    experience_years: Optional[int] = None
    description: Optional[str] = None
    photo_url: Optional[str] = None

class TechProfileCreate(TechProfileBase):
    full_name: str

class TechProfileUpdate(TechProfileBase):
    full_name: Optional[str] = None

class TechDocumentsUpdate(BaseModel):
    dni_front_url: Optional[str] = None
    dni_back_url: Optional[str] = None
    cert_url: Optional[str] = None

class TechProfileOut(TechProfileBase):
    user_id: UUID
    full_name: str
    dni_front_url: Optional[str] = None
    dni_back_url: Optional[str] = None
    cert_url: Optional[str] = None
    verification_status: str
    rating_avg: Decimal
    reviews_count: int
    created_at: Optional[datetime] = None

    model_config = {"from_attributes": True}

class TechPublicOut(BaseModel):
    user_id: UUID
    full_name: str
    specialty: Optional[str] = None
    description: Optional[str] = None
    photo_url: Optional[str] = None
    verification_status: str
    rating_avg: Decimal
    reviews_count: int
    experience_years: Optional[int] = None

    model_config = {"from_attributes": True}
