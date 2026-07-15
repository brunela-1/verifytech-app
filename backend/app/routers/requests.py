from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from app.database import get_db
from app.auth.dependencies import get_current_user, require_client, require_tech
from app.models.service_request import ServiceRequest, RequestImage
from app.schemas.service_request import (
    ServiceRequestCreate, ServiceRequestOut, AddImagesBody
)

router = APIRouter(prefix="/api/requests", tags=["requests"])

@router.post("/", response_model=ServiceRequestOut)
def create_request(
    body: ServiceRequestCreate,
    current_user: dict = Depends(require_client),
    db: Session = Depends(get_db),
):
    from uuid import UUID
    req = ServiceRequest(
        client_id=UUID(current_user["user_id"]),
        title=body.title,
        category=body.category,
        description=body.description,
        address=body.address,
        status="open",
    )
    db.add(req)
    db.commit()
    db.refresh(req)
    result = ServiceRequestOut.model_validate(req)
    result.proposals_count = 0
    return result

@router.get("/", response_model=List[ServiceRequestOut])
def get_my_requests(
    current_user: dict = Depends(require_client),
    db: Session = Depends(get_db),
):
    reqs = db.query(ServiceRequest).filter(
        ServiceRequest.client_id == current_user["user_id"]
    ).order_by(ServiceRequest.created_at.desc()).all()
    results = []
    for r in reqs:
        out = ServiceRequestOut.model_validate(r)
        out.proposals_count = len(r.proposals)
        results.append(out)
    return results

@router.get("/available", response_model=List[ServiceRequestOut])
def get_available_requests(
    current_user: dict = Depends(require_tech),
    db: Session = Depends(get_db),
):
    reqs = db.query(ServiceRequest).filter(
        ServiceRequest.status == "open"
    ).order_by(ServiceRequest.created_at.desc()).all()

    results = []
    for r in reqs:
        out = ServiceRequestOut.model_validate(r)
        out.proposals_count = len(r.proposals)
        results.append(out)
    return results

@router.get("/{req_id}", response_model=ServiceRequestOut)
def get_request(
    req_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    req = db.query(ServiceRequest).filter(ServiceRequest.id == req_id).first()
    if not req:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")
    out = ServiceRequestOut.model_validate(req)
    out.proposals_count = len(req.proposals)
    return out

@router.put("/{req_id}/cancel")
def cancel_request(
    req_id: UUID,
    current_user: dict = Depends(require_client),
    db: Session = Depends(get_db),
):
    req = db.query(ServiceRequest).filter(
        ServiceRequest.id == req_id,
        ServiceRequest.client_id == current_user["user_id"],
    ).first()
    if not req:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")
    req.status = "cancelled"
    db.commit()
    return {"message": "Solicitud cancelada"}

@router.post("/{req_id}/images")
def add_images(
    req_id: UUID,
    body: AddImagesBody,
    current_user: dict = Depends(require_client),
    db: Session = Depends(get_db),
):
    req = db.query(ServiceRequest).filter(
        ServiceRequest.id == req_id,
        ServiceRequest.client_id == current_user["user_id"],
    ).first()
    if not req:
        raise HTTPException(status_code=404, detail="Solicitud no encontrada")

    for url in body.image_urls:
        img = RequestImage(request_id=req_id, image_url=url)
        db.add(img)

    db.commit()
    return {"added": len(body.image_urls)}
