from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from app.database import get_db
from app.auth.dependencies import get_current_user, require_tech
from app.models.tech_profile import TechProfile
from app.models.review import Review
from app.schemas.tech_profile import (
    TechProfileCreate, TechProfileUpdate, TechDocumentsUpdate,
    TechProfileOut, TechPublicOut
)
from app.schemas.review import ReviewOut

router = APIRouter(prefix="/api/techs", tags=["techs"])

@router.get("/", response_model=List[TechPublicOut])
def list_verified_techs(db: Session = Depends(get_db)):
    return db.query(TechProfile).filter(TechProfile.verification_status == "verified").all()

@router.get("/me/profile", response_model=TechProfileOut)
def get_my_profile(
    current_user: dict = Depends(require_tech),
    db: Session = Depends(get_db),
):
    from uuid import UUID
    user_id = UUID(current_user["user_id"])
    profile = db.query(TechProfile).filter(TechProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Perfil no encontrado")
    return profile

@router.put("/me/profile", response_model=TechProfileOut)
def update_my_profile(
    body: TechProfileUpdate,
    current_user: dict = Depends(require_tech),
    db: Session = Depends(get_db),
):
    from uuid import UUID
    user_id = UUID(current_user["user_id"])
    profile = db.query(TechProfile).filter(TechProfile.user_id == user_id).first()
    if not profile:
        profile = TechProfile(user_id=user_id)
        db.add(profile)

    data = body.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(profile, k, v)

    db.commit()
    db.refresh(profile)
    return profile

@router.post("/me/documents", response_model=TechProfileOut)
def upload_documents(
    body: TechDocumentsUpdate,
    current_user: dict = Depends(require_tech),
    db: Session = Depends(get_db),
):
    from uuid import UUID
    user_id = UUID(current_user["user_id"])
    profile = db.query(TechProfile).filter(TechProfile.user_id == user_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Perfil no encontrado")

    data = body.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(profile, k, v)

    if profile.dni_front_url and profile.dni_back_url:
        profile.verification_status = "pending"

    db.commit()
    db.refresh(profile)
    return profile

@router.get("/me/verification-status")
def get_verification_status(
    current_user: dict = Depends(require_tech),
    db: Session = Depends(get_db),
):
    profile = db.query(TechProfile).filter(TechProfile.user_id == current_user["user_id"]).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Perfil no encontrado")
    return {"verification_status": profile.verification_status}

@router.get("/{tech_id}", response_model=TechPublicOut)
def get_tech_public(tech_id: UUID, db: Session = Depends(get_db)):
    profile = db.query(TechProfile).filter(TechProfile.user_id == tech_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Técnico no encontrado")
    return profile
