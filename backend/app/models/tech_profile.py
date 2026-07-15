import uuid
from sqlalchemy import Column, String, Integer, Text, Numeric, TIMESTAMP, Boolean
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.database import Base

class TechProfile(Base):
    __tablename__ = "tech_profiles"

    user_id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    full_name = Column(String(255), nullable=False, default="")
    specialty = Column(String(255), nullable=True)
    experience_years = Column(Integer, nullable=True, default=0)
    description = Column(Text, nullable=True)
    photo_url = Column(Text, nullable=True)
    dni_front_url = Column(Text, nullable=True)
    dni_back_url = Column(Text, nullable=True)
    cert_url = Column(Text, nullable=True)
    verification_status = Column(
        String(20), nullable=False, default="pending"
    )
    rating_avg = Column(Numeric(3, 2), nullable=False, default=0)
    reviews_count = Column(Integer, nullable=False, default=0)
    
    # Wallet / Business logic
    wallet_balance = Column(Numeric(10, 2), nullable=False, default=15.00)
    is_vip = Column(Boolean, nullable=False, default=False)
    
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
