from sqlalchemy import Column, String, DateTime, func
from sqlalchemy.dialects.postgresql import UUID
import uuid
from app.database import Base

class UserLog(Base):
    __tablename__ = "user_logs"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), index=True)
    evento = Column(String, nullable=False)
    descripcion = Column(String, nullable=True)
    fecha = Column(DateTime(timezone=True), server_default=func.now())
