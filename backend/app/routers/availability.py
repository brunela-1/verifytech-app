from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from app.database import get_db
from app.auth.dependencies import get_current_user, require_tech
from app.models.availability import AvailabilityBlock
from app.schemas.availability import (
    AvailabilityBlockCreate, AvailabilityBlockUpdate, AvailabilityBlockOut
)

router = APIRouter(prefix="/api/availability", tags=["availability"])

@router.get("/", response_model=List[AvailabilityBlockOut])
def get_my_blocks(
    current_user: dict = Depends(require_tech),
    db: Session = Depends(get_db),
):
    from uuid import UUID
    tech_id = UUID(current_user["user_id"])
    return db.query(AvailabilityBlock).filter(
        AvailabilityBlock.tech_id == tech_id
    ).order_by(AvailabilityBlock.day_label, AvailabilityBlock.start_time).all()

@router.post("/", response_model=AvailabilityBlockOut)
def create_block(
    body: AvailabilityBlockCreate,
    current_user: dict = Depends(require_tech),
    db: Session = Depends(get_db),
):
    from uuid import UUID
    block = AvailabilityBlock(
        tech_id=UUID(current_user["user_id"]),
        day_label=body.day_label,
        start_time=body.start_time,
        end_time=body.end_time,
        status="available",
    )
    db.add(block)
    db.commit()
    db.refresh(block)
    return block

@router.put("/{block_id}", response_model=AvailabilityBlockOut)
def update_block(
    block_id: UUID,
    body: AvailabilityBlockUpdate,
    current_user: dict = Depends(require_tech),
    db: Session = Depends(get_db),
):
    block = db.query(AvailabilityBlock).filter(
        AvailabilityBlock.id == block_id,
        AvailabilityBlock.tech_id == current_user["user_id"],
    ).first()
    if not block:
        raise HTTPException(status_code=404, detail="Bloque no encontrado")

    data = body.model_dump(exclude_unset=True)
    for k, v in data.items():
        setattr(block, k, v)

    db.commit()
    db.refresh(block)
    return block

@router.delete("/{block_id}")
def delete_block(
    block_id: UUID,
    current_user: dict = Depends(require_tech),
    db: Session = Depends(get_db),
):
    block = db.query(AvailabilityBlock).filter(
        AvailabilityBlock.id == block_id,
        AvailabilityBlock.tech_id == current_user["user_id"],
    ).first()
    if not block:
        raise HTTPException(status_code=404, detail="Bloque no encontrado")
    if block.status == "booked":
        raise HTTPException(status_code=400, detail="No se puede eliminar un bloque reservado")

    db.delete(block)
    db.commit()
    return {"message": "Bloque eliminado"}

@router.get("/tech/{tech_id}", response_model=List[AvailabilityBlockOut])
def get_tech_available_blocks(
    tech_id: UUID,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    return db.query(AvailabilityBlock).filter(
        AvailabilityBlock.tech_id == tech_id,
        AvailabilityBlock.status == "available",
    ).order_by(AvailabilityBlock.day_label, AvailabilityBlock.start_time).all()
