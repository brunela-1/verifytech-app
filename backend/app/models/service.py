import uuid
from sqlalchemy import Column, String, TIMESTAMP, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class Service(Base):
    __tablename__ = "services"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    proposal_id = Column(UUID(as_uuid=True), ForeignKey("proposals.id"), nullable=False)
    request_id = Column(UUID(as_uuid=True), ForeignKey("service_requests.id"), nullable=False)
    tech_id = Column(UUID(as_uuid=True), nullable=False)
    client_id = Column(UUID(as_uuid=True), nullable=False)
    status = Column(String(20), nullable=False, default="scheduled")
    scheduled_block_id = Column(UUID(as_uuid=True), nullable=True)
    scheduled_start = Column(TIMESTAMP(timezone=True), nullable=True)
    scheduled_end = Column(TIMESTAMP(timezone=True), nullable=True)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    proposal = relationship("Proposal", back_populates="service")
    review = relationship("Review", back_populates="service", uselist=False)
