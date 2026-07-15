import uuid
from sqlalchemy import Column, String, Text, TIMESTAMP, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.database import Base

class ServiceRequest(Base):
    __tablename__ = "service_requests"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    client_id = Column(UUID(as_uuid=True), nullable=False)
    title = Column(String(255), nullable=False)
    category = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    address = Column(String(500), nullable=True)
    status = Column(String(20), nullable=False, default="open")
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())

    images = relationship("RequestImage", back_populates="request", cascade="all, delete-orphan")
    proposals = relationship("Proposal", back_populates="request", cascade="all, delete-orphan")


class RequestImage(Base):
    __tablename__ = "request_images"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    request_id = Column(UUID(as_uuid=True), ForeignKey("service_requests.id", ondelete="CASCADE"), nullable=False)
    image_url = Column(Text, nullable=False)

    request = relationship("ServiceRequest", back_populates="images")
