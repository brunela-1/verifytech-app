import uuid
from sqlalchemy import Column, String, Text, Numeric, TIMESTAMP, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Proposal(Base):
    __tablename__ = "proposals"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    request_id = Column(UUID(as_uuid=True), ForeignKey("service_requests.id", ondelete="CASCADE"), nullable=False)
    tech_id = Column(UUID(as_uuid=True), nullable=False)
    price = Column(Numeric(10, 2), nullable=False)
    estimated_time = Column(String(100), nullable=True)
    observations = Column(Text, nullable=True)
    status = Column(String(20), nullable=False, default="sent")
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    request = relationship("ServiceRequest", back_populates="proposals")
    service = relationship("Service", back_populates="proposal", uselist=False)
