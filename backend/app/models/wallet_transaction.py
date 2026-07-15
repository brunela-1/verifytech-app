import uuid
from sqlalchemy import Column, String, Numeric, TIMESTAMP, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
from app.database import Base

class WalletTransaction(Base):
    __tablename__ = "wallet_transactions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    tech_id = Column(UUID(as_uuid=True), ForeignKey("tech_profiles.user_id"), nullable=False)
    amount = Column(Numeric(10, 2), nullable=False)
    type = Column(String(50), nullable=False)  # 'recharge', 'commission', 'subscription', 'bonus'
    status = Column(String(50), nullable=False, default="pending")  # 'pending', 'completed', 'rejected'
    reference = Column(String(255), nullable=True)  # e.g., 'YAPE-12345'
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
