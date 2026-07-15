from pydantic import BaseModel, ConfigDict
from typing import List, Optional
from datetime import datetime
from uuid import UUID

class WalletTransactionOut(BaseModel):
    id: UUID
    amount: float
    type: str
    status: str
    reference: Optional[str] = None
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)

class WalletBalanceOut(BaseModel):
    balance: float
    is_vip: bool
    transactions: List[WalletTransactionOut]

class RechargeBody(BaseModel):
    amount: float
    reference: str  # Yape/Plin Operation Number
