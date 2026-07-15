import uuid
from sqlalchemy import Column, String, TIMESTAMP, Numeric
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.sql import func
from app.database import Base


class UserSession(Base):
    """Registra cada inicio de sesión. Cubre Login Rate y Retention técnicos."""
    __tablename__ = "user_sessions"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(String(255), nullable=False, index=True)
    role = Column(String(20), nullable=False)  # 'client' | 'tech'
    login_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), nullable=False)


class ReferralSource(Base):
    """Cómo conoció el usuario la plataforma. Cubre Referral AARRR."""
    __tablename__ = "referral_sources"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(String(255), nullable=False, unique=True, index=True)
    # 'friend_family' | 'social_media' | 'hardware_store' | 'google_search'
    source = Column(String(50), nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())


class ActivityEvent(Base):
    """
    Eventos de navegación y abandono. Cubre:
    - Visitas al módulo de historial (Retention clientes, 7 días post-servicio)
    - Abandono en pantalla de propuestas (Friction clientes)
    - Abandono en carga de archivos (Friction técnicos)
    - Acquisition y Activation AARRR
    """
    __tablename__ = "activity_events"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(String(255), nullable=True, index=True)  # nullable = anónimo
    role = Column(String(20), nullable=True)  # 'client' | 'tech' | 'anonymous'
    # event_type values:
    # page_view | page_abandon | history_view | file_upload_start |
    # file_upload_abandon | profile_comparison | registration_start |
    # registration_complete | proposal_view | proposal_abandon
    event_type = Column(String(50), nullable=False, index=True)
    page_name = Column(String(100), nullable=True)
    event_metadata = Column(JSONB, nullable=True)   # datos extra (request_id, etc.)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now(), index=True)


class PlatformRevenue(Base):
    """Comisiones de la plataforma por servicio cerrado. Cubre Revenue AARRR."""
    __tablename__ = "platform_revenues"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    service_id = Column(UUID(as_uuid=True), nullable=False, unique=True)
    tech_id = Column(String(255), nullable=False, index=True)
    client_id = Column(String(255), nullable=False, index=True)
    service_amount = Column(Numeric(10, 2), nullable=False)
    commission_rate = Column(Numeric(5, 4), nullable=False, default=0.15)  # 15%
    commission_amount = Column(Numeric(10, 2), nullable=False)
    created_at = Column(TIMESTAMP(timezone=True), server_default=func.now())
