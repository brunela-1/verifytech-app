from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from decimal import Decimal
from app.database import get_db
from app.auth.dependencies import get_current_user, require_client
from app.models.review import Review
from app.models.service import Service
from app.models.tech_profile import TechProfile
from app.schemas.review import ReviewCreate, ReviewOut

router = APIRouter(prefix="/api/reviews", tags=["reviews"])

@router.post("/", response_model=ReviewOut)
def create_review(
    body: ReviewCreate,
    current_user: dict = Depends(require_client),
    db: Session = Depends(get_db),
):
    from uuid import UUID
    client_id = UUID(current_user["user_id"])
    svc = db.query(Service).filter(Service.id == body.service_id).first()
    if not svc:
        raise HTTPException(status_code=404, detail="Servicio no encontrado")
    if svc.client_id != client_id:
        raise HTTPException(status_code=403, detail="No autorizado")
    if svc.status != "completed":
        raise HTTPException(status_code=400, detail="Solo puedes calificar servicios completados")

    existing = db.query(Review).filter(Review.service_id == body.service_id).first()
    if existing:
        raise HTTPException(status_code=409, detail="Ya calificaste este servicio")

    review = Review(
        service_id=body.service_id,
        client_id=client_id,
        tech_id=svc.tech_id,
        rating=body.rating,
        comment=body.comment,
    )
    db.add(review)

    tech_profile = db.query(TechProfile).filter(TechProfile.user_id == svc.tech_id).first()
    if tech_profile:
        total = Decimal(str(tech_profile.rating_avg)) * tech_profile.reviews_count + Decimal(str(body.rating))
        tech_profile.reviews_count += 1
        tech_profile.rating_avg = round(total / tech_profile.reviews_count, 2)

    db.commit()
    db.refresh(review)
    return review

@router.get("/tech/{tech_id}", response_model=List[ReviewOut])
def get_tech_reviews(tech_id: UUID, db: Session = Depends(get_db)):
    return db.query(Review).filter(
        Review.tech_id == tech_id
    ).order_by(Review.created_at.desc()).all()
