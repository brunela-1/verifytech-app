import uuid
from sqlalchemy import Column, String, Time, TIMESTAMP
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.database import Base

class AvailabilityBlock(Base):
    __tablename__ = "availability_blocks"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tech_id = Column(UUID(as_uuid=True), nullable=False)
    day_label = Column(String(50), nullable=False)
    start_time = Column(Time, nullable=False)
    end_time = Column(Time, nullable=False)
    status = Column(String(20), nullable=False, default="available")
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
