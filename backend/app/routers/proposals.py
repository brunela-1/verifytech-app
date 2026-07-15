from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from uuid import UUID
from datetime import datetime
from app.database import get_db
from app.auth.dependencies import get_current_user, require_client, require_tech
from app.models.proposal import Proposal
from app.models.service_request import ServiceRequest
from app.models.availability import AvailabilityBlock
from app.models.service import Service
from app.models.tech_profile import TechProfile
from app.models.wallet_transaction import WalletTransaction
from app.schemas.proposal import ProposalCreate, ProposalOut, ProposalAcceptBody, ProposalAcceptResponse

router = APIRouter(prefix="/api/proposals", tags=["proposals"])

@router.post("/", response_model=ProposalOut)
def send_proposal(
    body: ProposalCreate,
    current_user: dict = Depends(require_tech),
    db: Session = Depends(get_db),
):
    req = db.query(ServiceRequest).filter(ServiceRequest.id == body.request_id).first()
    if not req or req.status != "open":
        raise HTTPException(status_code=400, detail="Solicitud no disponible")

    from uuid import UUID
    tech_id = UUID(current_user["user_id"])
    
    # Check Wallet Balance
    tech = db.query(TechProfile).filter(TechProfile.user_id == tech_id).first()
    if not tech or tech.wallet_balance <= 0:
        raise HTTPException(status_code=402, detail="Saldo insuficiente en tu Billetera para enviar propuestas. Recarga para continuar.")

    existing = db.query(Proposal).filter(
        Proposal.request_id == body.request_id,
        Proposal.tech_id == tech_id,
    ).first()
    if existing:
        raise HTTPException(status_code=409, detail="Ya enviaste una propuesta para esta solicitud")

    proposal = Proposal(
        request_id=body.request_id,
        tech_id=tech_id,
        price=body.price,
        estimated_time=body.estimated_time,
        observations=body.observations,
        status="sent",
    )
    db.add(proposal)
    db.commit()
    db.refresh(proposal)
    return proposal

@router.get("/request/{req_id}", response_model=List[ProposalOut])
def get_proposals_for_request(
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

    return db.query(Proposal).filter(Proposal.request_id == req_id).all()

@router.get("/my", response_model=List[ProposalOut])
def get_my_proposals(
    current_user: dict = Depends(require_tech),
    db: Session = Depends(get_db),
):
    tech_id = UUID(current_user["user_id"])
    return db.query(Proposal).filter(
        Proposal.tech_id == tech_id
    ).order_by(Proposal.created_at.desc()).all()

@router.put("/{proposal_id}/accept", response_model=ProposalAcceptResponse)
def accept_proposal(
    proposal_id: UUID,
    body: ProposalAcceptBody,
    current_user: dict = Depends(require_client),
    db: Session = Depends(get_db),
):
    proposal = db.query(Proposal).filter(Proposal.id == proposal_id).first()
    if not proposal or proposal.status != "sent":
        raise HTTPException(status_code=404, detail="Propuesta no disponible")

    client_id = UUID(current_user["user_id"])
    req = db.query(ServiceRequest).filter(
        ServiceRequest.id == proposal.request_id,
        ServiceRequest.client_id == client_id,
    ).first()
    if not req:
        raise HTTPException(status_code=403, detail="No autorizado")

    scheduled_start = None
    scheduled_end = None
    block = None

    if body.selected_block_id:
        block = db.query(AvailabilityBlock).filter(
            AvailabilityBlock.id == body.selected_block_id
        ).with_for_update().first()

        if not block or block.status != "available":
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Este horario ya fue reservado, selecciona otro",
            )

        block.status = "booked"
        scheduled_start = datetime.combine(datetime.today(), block.start_time)
        scheduled_end = datetime.combine(datetime.today(), block.end_time)

    service = Service(
        proposal_id=proposal.id,
        request_id=proposal.request_id,
        tech_id=proposal.tech_id,
        client_id=client_id,
        status="scheduled",
        scheduled_block_id=body.selected_block_id,
        scheduled_start=scheduled_start,
        scheduled_end=scheduled_end,
    )
    db.add(service)

    proposal.status = "accepted"

    db.query(Proposal).filter(
        Proposal.request_id == proposal.request_id,
        Proposal.id != proposal_id,
        Proposal.status == "sent",
    ).update({"status": "rejected"})

    req.status = "closed"

    # COMMISSION LOGIC: Deduct 15% from winning tech
    tech = db.query(TechProfile).filter(TechProfile.user_id == proposal.tech_id).with_for_update().first()
    if tech:
        commission_amount = round(float(proposal.price) * 0.15, 2)
        tech.wallet_balance = float(tech.wallet_balance) - commission_amount
        
        # Log transaction
        tx = WalletTransaction(
            tech_id=tech.user_id,
            amount=-commission_amount,
            type="commission",
            status="completed",
            reference=f"Propuesta {str(proposal.id)[:8]}"
        )
        db.add(tx)

    db.commit()
    db.refresh(service)

    return ProposalAcceptResponse(
        service_id=service.id,
        message="Propuesta aceptada. Servicio creado."
    )

@router.put("/{proposal_id}/reject")
def reject_proposal(
    proposal_id: UUID,
    current_user: dict = Depends(require_client),
    db: Session = Depends(get_db),
):
    proposal = db.query(Proposal).filter(Proposal.id == proposal_id).first()
    if not proposal:
        raise HTTPException(status_code=404, detail="Propuesta no encontrada")

    req = db.query(ServiceRequest).filter(
        ServiceRequest.id == proposal.request_id,
        ServiceRequest.client_id == current_user["user_id"],
    ).first()
    if not req:
        raise HTTPException(status_code=403, detail="No autorizado")

    proposal.status = "rejected"
    db.commit()
    return {"message": "Propuesta rechazada"}
