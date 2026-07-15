from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from app.database import get_db
from app.auth.dependencies import require_tech
from app.models.tech_profile import TechProfile
from app.models.wallet_transaction import WalletTransaction
from app.schemas.wallet import WalletBalanceOut, RechargeBody

router = APIRouter(prefix="/api/wallet", tags=["wallet"])

@router.get("/", response_model=WalletBalanceOut)
def get_wallet(
    current_user: dict = Depends(require_tech),
    db: Session = Depends(get_db),
):
    tech_id = UUID(current_user["user_id"])
    tech = db.query(TechProfile).filter(TechProfile.user_id == tech_id).first()
    
    if not tech:
        raise HTTPException(status_code=404, detail="Perfil técnico no encontrado")

    transactions = db.query(WalletTransaction).filter(
        WalletTransaction.tech_id == tech_id
    ).order_by(WalletTransaction.created_at.desc()).all()

    return WalletBalanceOut(
        balance=float(tech.wallet_balance),
        is_vip=tech.is_vip,
        transactions=transactions
    )

@router.post("/recharge")
def request_recharge(
    body: RechargeBody,
    current_user: dict = Depends(require_tech),
    db: Session = Depends(get_db),
):
    tech_id = UUID(current_user["user_id"])
    tech = db.query(TechProfile).filter(TechProfile.user_id == tech_id).first()
    
    if not tech:
        raise HTTPException(status_code=404, detail="Perfil técnico no encontrado")
    
    if body.amount <= 0:
        raise HTTPException(status_code=400, detail="El monto debe ser mayor a 0")

    # Create pending recharge transaction
    # Since this is a simulation, recharge is completed automatically
    tx = WalletTransaction(
        tech_id=tech_id,
        amount=body.amount,
        type="recharge",
        status="completed",
        reference=body.reference
    )
    
    tech.wallet_balance = float(tech.wallet_balance) + float(body.amount)
    
    db.add(tx)
    db.commit()
    
    return {"message": "Recarga solicitada. Un administrador la verificará pronto."}
