from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import Optional, List
from datetime import datetime, timezone
from pydantic import BaseModel
from uuid import UUID

from app.database import get_db
from app.auth.dependencies import require_admin
from app.models.user import User
from app.models.tech_profile import TechProfile
from app.models.service_request import ServiceRequest
from app.models.service import Service
from app.models.wallet_transaction import WalletTransaction
from app.models.proposal import Proposal
from app.models.review import Review

router = APIRouter(prefix="/api/admin", tags=["admin"])


# ─── Schemas ──────────────────────────────────────────────────────────────────

class UserOut(BaseModel):
    user_id: str
    role: str
    referral_source: Optional[str]
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


class PendingTechOut(BaseModel):
    user_id: str
    full_name: str
    specialty: Optional[str]
    photo_url: Optional[str]
    dni_front_url: Optional[str]
    dni_back_url: Optional[str]
    cert_url: Optional[str]
    verification_status: str
    rating_avg: float
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


class ServiceRequestOut(BaseModel):
    id: str
    client_id: str
    title: str
    category: str
    status: str
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


class ServiceOut(BaseModel):
    id: str
    tech_id: str
    client_id: str
    status: str
    scheduled_start: Optional[datetime]
    created_at: Optional[datetime]

    class Config:
        from_attributes = True


class OverviewStats(BaseModel):
    total_clients: int
    total_techs: int
    total_requests: int
    open_requests: int
    total_services: int
    active_services: int
    completed_services: int
    total_proposals: int
    accepted_proposals: int
    pending_verifications: int
    verified_techs: int
    total_reviews: int
    avg_rating: float


class VerifyBody(BaseModel):
    status: str  # "verified" | "rejected"


# ─── Endpoints ────────────────────────────────────────────────────────────────

@router.get("/stats/overview", response_model=OverviewStats)
def get_overview(
    db: Session = Depends(get_db),
    _admin: dict = Depends(require_admin),
):
    """KPI cards rápidas para el admin dashboard."""
    total_clients = db.query(User).filter(User.role == "client").count()
    total_techs = db.query(User).filter(User.role == "tech").count()
    total_requests = db.query(ServiceRequest).count()
    open_requests = db.query(ServiceRequest).filter(ServiceRequest.status == "open").count()
    total_services = db.query(Service).count()
    active_services = db.query(Service).filter(
        Service.status.in_(["scheduled", "in_progress"])
    ).count()
    completed_services = db.query(Service).filter(Service.status == "completed").count()
    total_proposals = db.query(Proposal).count()
    accepted_proposals = db.query(Proposal).filter(Proposal.status == "accepted").count()
    pending_verifications = db.query(TechProfile).filter(
        TechProfile.verification_status == "pending"
    ).count()
    verified_techs = db.query(TechProfile).filter(
        TechProfile.verification_status == "verified"
    ).count()
    total_reviews = db.query(Review).count()
    avg_rating_raw = db.query(func.avg(Review.rating)).scalar()
    avg_rating = float(round(avg_rating_raw, 2)) if avg_rating_raw else 0.0

    return OverviewStats(
        total_clients=total_clients,
        total_techs=total_techs,
        total_requests=total_requests,
        open_requests=open_requests,
        total_services=total_services,
        active_services=active_services,
        completed_services=completed_services,
        total_proposals=total_proposals,
        accepted_proposals=accepted_proposals,
        pending_verifications=pending_verifications,
        verified_techs=verified_techs,
        total_reviews=total_reviews,
        avg_rating=avg_rating,
    )


@router.get("/users", response_model=List[UserOut])
def list_users(
    role: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    _admin: dict = Depends(require_admin),
):
    """Lista todos los usuarios, filtrables por rol."""
    q = db.query(User)
    if role:
        q = q.filter(User.role == role)
    users = q.order_by(User.created_at.desc()).offset(offset).limit(limit).all()
    return [
        UserOut(
            user_id=str(u.user_id),
            role=u.role,
            referral_source=u.referral_source,
            created_at=u.created_at,
        )
        for u in users
    ]


@router.get("/techs/pending", response_model=List[PendingTechOut])
def list_pending_techs(
    status: str = Query("pending"),
    db: Session = Depends(get_db),
    _admin: dict = Depends(require_admin),
):
    """Técnicos con documentos pendientes de revisión."""
    profiles = (
        db.query(TechProfile)
        .filter(TechProfile.verification_status == status)
        .order_by(TechProfile.created_at.asc())
        .all()
    )
    return [
        PendingTechOut(
            user_id=str(p.user_id),
            full_name=p.full_name,
            specialty=p.specialty,
            photo_url=p.photo_url,
            dni_front_url=p.dni_front_url,
            dni_back_url=p.dni_back_url,
            cert_url=p.cert_url,
            verification_status=p.verification_status,
            rating_avg=float(p.rating_avg or 0),
            created_at=p.created_at,
        )
        for p in profiles
    ]


@router.put("/techs/{tech_id}/verify")
def verify_tech(
    tech_id: str,
    body: VerifyBody,
    db: Session = Depends(get_db),
    _admin: dict = Depends(require_admin),
):
    """Aprobar o rechazar la verificación de un técnico."""
    if body.status not in ("verified", "rejected"):
        raise HTTPException(status_code=400, detail="status debe ser 'verified' o 'rejected'")

    profile = db.query(TechProfile).filter(TechProfile.user_id == tech_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Técnico no encontrado")

    profile.verification_status = body.status
    db.commit()
    return {"tech_id": tech_id, "verification_status": body.status}


@router.get("/requests", response_model=List[ServiceRequestOut])
def list_all_requests(
    status: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    _admin: dict = Depends(require_admin),
):
    """Vista global de todas las solicitudes."""
    q = db.query(ServiceRequest)
    if status:
        q = q.filter(ServiceRequest.status == status)
    items = q.order_by(ServiceRequest.created_at.desc()).offset(offset).limit(limit).all()
    return [
        ServiceRequestOut(
            id=str(r.id),
            client_id=str(r.client_id),
            title=r.title,
            category=r.category,
            status=r.status,
            created_at=r.created_at,
        )
        for r in items
    ]


@router.get("/services", response_model=List[ServiceOut])
def list_all_services(
    status: Optional[str] = Query(None),
    limit: int = Query(50, ge=1, le=200),
    offset: int = Query(0, ge=0),
    db: Session = Depends(get_db),
    _admin: dict = Depends(require_admin),
):
    """Vista global de todos los servicios."""
    q = db.query(Service)
    if status:
        q = q.filter(Service.status == status)
    items = q.order_by(Service.created_at.desc()).offset(offset).limit(limit).all()
    return [
        ServiceOut(
            id=str(s.id),
            tech_id=str(s.tech_id),
            client_id=str(s.client_id),
            status=s.status,
            scheduled_start=s.scheduled_start,
            created_at=s.created_at,
        )
        for s in items
    ]


# --- WALLET RECHARGES ---

@router.get("/wallet/recharges")
def get_pending_recharges(db: Session = Depends(get_db)):
    return db.query(WalletTransaction).filter(
        WalletTransaction.type == "recharge",
        WalletTransaction.status == "pending"
    ).order_by(WalletTransaction.created_at.asc()).all()

@router.put("/wallet/recharges/{tx_id}/approve")
def approve_recharge(tx_id: UUID, db: Session = Depends(get_db)):
    tx = db.query(WalletTransaction).filter(WalletTransaction.id == tx_id).with_for_update().first()
    if not tx or tx.type != "recharge" or tx.status != "pending":
        raise HTTPException(status_code=404, detail="Recarga no encontrada o ya procesada")
    
    # Update tech balance
    tech = db.query(TechProfile).filter(TechProfile.user_id == tx.tech_id).first()
    if tech:
        tech.wallet_balance = float(tech.wallet_balance) + float(tx.amount)
        tx.status = "completed"
        db.commit()
        return {"message": "Recarga aprobada exitosamente"}
    
    raise HTTPException(status_code=404, detail="Perfil técnico no encontrado")

@router.put("/wallet/recharges/{tx_id}/reject")
def reject_recharge(tx_id: UUID, db: Session = Depends(get_db)):
    tx = db.query(WalletTransaction).filter(WalletTransaction.id == tx_id).first()
    if not tx or tx.type != "recharge" or tx.status != "pending":
        raise HTTPException(status_code=404, detail="Recarga no encontrada o ya procesada")
    
    tx.status = "rejected"
    db.commit()
    return {"message": "Recarga rechazada"}

