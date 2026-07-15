from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from app.database import get_db
from app.auth.dependencies import get_current_user
from app.models.service import Service
from app.schemas.service import ServiceOut, ServiceStatusUpdate

router = APIRouter(prefix="/api/services", tags=["services"])

VALID_STATUSES = {"scheduled", "in_progress", "completed", "cancelled"}

@router.get("/history", response_model=List[ServiceOut])
def get_history(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from uuid import UUID
    user_id = UUID(current_user["user_id"])
    role = current_user["role"]

    if role == "client":
        return db.query(Service).filter(
            Service.client_id == user_id,
            Service.status.in_(["completed", "cancelled"]),
        ).order_by(Service.created_at.desc()).all()
    else:
        return db.query(Service).filter(
            Service.tech_id == user_id,
            Service.status.in_(["completed", "cancelled"]),
        ).order_by(Service.created_at.desc()).all()

@router.get("/", response_model=List[ServiceOut])
def get_my_services(
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from uuid import UUID
    user_id = UUID(current_user["user_id"])
    role = current_user["role"]

    if role == "client":
        return db.query(Service).filter(
            Service.client_id == user_id,
            Service.status.in_(["scheduled", "in_progress"]),
        ).order_by(Service.created_at.desc()).all()
    else:
        return db.query(Service).filter(
            Service.tech_id == user_id,
            Service.status.in_(["scheduled", "in_progress"]),
        ).order_by(Service.created_at.desc()).all()

@router.get("/{service_id}", response_model=ServiceOut)
def get_service(
    service_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from uuid import UUID
    svc = db.query(Service).filter(Service.id == service_id).first()
    if not svc:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")

    user_id = UUID(current_user["user_id"])
    if svc.client_id != user_id and svc.tech_id != user_id:
        raise HTTPException(status_code=403, detail="No autorizado")

    return svc

@router.put("/{service_id}/status", response_model=ServiceOut)
def update_service_status(
    service_id: UUID,
    body: ServiceStatusUpdate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    from uuid import UUID
    if body.status not in VALID_STATUSES:
        raise HTTPException(status_code=400, detail=f"Estado inválido. Válidos: {VALID_STATUSES}")

    svc = db.query(Service).filter(Service.id == service_id).first()
    if not svc:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")

    user_id = UUID(current_user["user_id"])
    if svc.client_id != user_id and svc.tech_id != user_id:
        raise HTTPException(status_code=403, detail="No autorizado")

    svc.status = body.status
    db.commit()
    db.refresh(svc)
    return svc
