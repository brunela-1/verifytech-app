from fastapi import APIRouter, Depends
from pydantic import BaseModel
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth.dependencies import get_current_user
from app.models.user import User
from app.models.tech_profile import TechProfile
from app.models.user_log import UserLog
from app.models.metrics import UserSession, ReferralSource

router = APIRouter(prefix="/api/auth", tags=["auth"])


class SyncProfileBody(BaseModel):
    role: str | None = None
    referral_source: str | None = None  # 'friend_family' | 'social_media' | 'hardware_store' | 'google_search'


def registrar_log(db: Session, user_id: str, evento: str, descripcion: str):
    """Registra un evento de auditoría en la tabla user_logs."""
    from uuid import UUID
    log = UserLog(user_id=UUID(user_id), evento=evento, descripcion=descripcion)
    db.add(log)
    db.commit()


@router.post("/sync-profile")
def sync_profile(
    body: SyncProfileBody,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    user_id = current_user["user_id"]
    role = body.role or current_user["role"]
    profile_created = False

    # Ensure user exists in database
    user = db.query(User).filter(User.user_id == user_id).first()
    if not user:
        user = User(user_id=user_id, role=role)
        db.add(user)
        db.flush()
    else:
        # Update role if needed, BUT never downgrade an admin
        if user.role != "admin":
            user.role = role
            db.add(user)
            db.flush()

    if role == "tech":
        from uuid import UUID
        user_id_uuid = UUID(user_id)
        existing = db.query(TechProfile).filter(TechProfile.user_id == user_id_uuid).first()
        if not existing:
            meta = current_user.get("user_metadata", {})
            full_name = meta.get("full_name", "")
            specialty = meta.get("specialty", "")
            exp_str = meta.get("experience_years", "0")
            try:
                experience_years = int(exp_str)
            except (ValueError, TypeError):
                experience_years = 0

            profile = TechProfile(
                user_id=user_id_uuid,
                full_name=full_name,
                specialty=specialty,
                experience_years=experience_years
            )
            db.add(profile)
            db.flush()  # flush to get profile into session before committing

            registrar_log(
                db, user_id,
                "Registro",
                f"Usuario registrado correctamente con rol: tech"
            )
            db.refresh(profile)
            profile_created = True

        else:
            # Técnico existente → es un Login
            registrar_log(
                db, user_id,
                "Login",
                "Inicio de sesión del técnico"
            )

    elif role == "client":
        from uuid import UUID
        user_id_uuid = UUID(user_id)
        prior_registro = db.query(UserLog).filter(
            UserLog.user_id == user_id_uuid,
            UserLog.evento == "Registro"
        ).first()

        if not prior_registro:
            # Primera vez → Registro
            registrar_log(
                db, user_id,
                "Registro",
                "Usuario registrado correctamente con rol: client"
            )
        else:
            # Ya existe → Login
            registrar_log(
                db, user_id,
                "Login",
                "Inicio de sesión"
            )

    db.commit()

    # Grabar session (login) automáticamente en cada sync
    session_record = UserSession(user_id=user_id, role=role)
    db.add(session_record)

    # Grabar fuente de referral si se proporciona y no existe aún
    ref_source = body.referral_source
    if ref_source:
        existing_ref = db.query(ReferralSource).filter(
            ReferralSource.user_id == user_id
        ).first()
        if not existing_ref:
            referral = ReferralSource(user_id=user_id, source=ref_source)
            db.add(referral)
            # Actualizar columna rápida en users
            user.referral_source = ref_source

    db.commit()
    return {"synced": True, "role": role, "profile_created": profile_created}


@router.get("/me")
def get_me(current_user: dict = Depends(get_current_user)):
    return current_user
