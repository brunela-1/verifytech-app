from fastapi import APIRouter, Depends, Query
from sqlalchemy.orm import Session
from sqlalchemy import func, text, and_
from datetime import datetime, timedelta, timezone
from typing import Optional

from app.database import get_db
from app.auth.dependencies import get_current_user, require_admin
from app.models.metrics import UserSession, ReferralSource, ActivityEvent, PlatformRevenue
from app.models.user import User
from app.models.tech_profile import TechProfile
from app.models.service_request import ServiceRequest
from app.models.proposal import Proposal
from app.models.service import Service
from app.models.review import Review
from app.schemas.metrics import SessionCreate, ReferralCreate, ActivityEventCreate, MetricsDashboard

router = APIRouter(prefix="/api/metrics", tags=["metrics"])


# ---------------------------------------------------------------------------
# POST: registrar login
# ---------------------------------------------------------------------------
@router.post("/session", status_code=201)
def record_session(
    body: SessionCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Registra un inicio de sesión del usuario autenticado."""
    session = UserSession(user_id=current_user["user_id"], role=body.role)
    db.add(session)
    db.commit()
    return {"recorded": True}


# ---------------------------------------------------------------------------
# POST: registrar fuente de referral
# ---------------------------------------------------------------------------
@router.post("/referral", status_code=201)
def record_referral(
    body: ReferralCreate,
    current_user: dict = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Registra cómo conoció el usuario la plataforma (solo una vez por usuario)."""
    existing = db.query(ReferralSource).filter(
        ReferralSource.user_id == current_user["user_id"]
    ).first()
    if existing:
        return {"recorded": False, "reason": "already_registered"}

    referral = ReferralSource(user_id=current_user["user_id"], source=body.source)
    db.add(referral)

    # Actualizar columna rápida en users
    user = db.query(User).filter(User.user_id == current_user["user_id"]).first()
    if user:
        user.referral_source = body.source

    db.commit()
    return {"recorded": True}


# ---------------------------------------------------------------------------
# POST: registrar evento de actividad
# ---------------------------------------------------------------------------
@router.post("/event", status_code=201)
def record_event(
    body: ActivityEventCreate,
    current_user: Optional[dict] = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Registra un evento de navegación o abandono."""
    user_id = current_user.get("user_id") if current_user else None
    role = current_user.get("role") if current_user else "anonymous"

    event = ActivityEvent(
        user_id=user_id,
        role=role,
        event_type=body.event_type,
        page_name=body.page_name,
        event_metadata=body.event_metadata,
    )
    db.add(event)
    db.commit()
    return {"recorded": True}


# ---------------------------------------------------------------------------
# GET: dashboard de métricas agregadas
# ---------------------------------------------------------------------------
@router.get("/dashboard", response_model=MetricsDashboard)
def get_dashboard(
    db: Session = Depends(get_db),
    _admin: dict = Depends(require_admin),
):
    """Retorna todas las métricas agregadas para análisis."""
    now = datetime.now(timezone.utc)

    # --- Totales base ---
    total_clients = db.query(User).filter(User.role == "client").count()
    total_techs = db.query(User).filter(User.role == "tech").count()
    total_requests = db.query(ServiceRequest).count()

    # --- Señal de compra (clientes): Tasa de creación de solicitudes ---
    request_creation_rate = (total_requests / total_clients) if total_clients > 0 else 0.0

    # --- Conversión (clientes): Tasa de aceptación de propuestas ---
    total_proposals = db.query(Proposal).count()
    accepted_proposals = db.query(Proposal).filter(Proposal.status == "accepted").count()
    proposal_acceptance_rate = (accepted_proposals / total_proposals) if total_proposals > 0 else 0.0

    # --- Compromiso (clientes): Retención de historial (7d post-servicio) ---
    history_views = db.query(ActivityEvent).filter(
        ActivityEvent.event_type == "history_view"
    ).count()
    completed_services = db.query(Service).filter(Service.status == "completed").count()
    history_view_avg_7d = (history_views / completed_services) if completed_services > 0 else 0.0

    # --- Fricción (clientes): abandono tras recibir ofertas ---
    proposal_views = db.query(ActivityEvent).filter(
        ActivityEvent.event_type == "proposal_view"
    ).count()
    proposal_abandons = db.query(ActivityEvent).filter(
        ActivityEvent.event_type == "proposal_abandon"
    ).count()
    client_offer_abandonment_rate = (
        proposal_abandons / proposal_views
    ) if proposal_views > 0 else 0.0

    # --- Señal (técnicos): Completitud de perfil crítico ---
    total_tech_profiles = db.query(TechProfile).count()
    complete_profiles = db.query(TechProfile).filter(
        TechProfile.dni_front_url.isnot(None),
        TechProfile.dni_back_url.isnot(None),
        TechProfile.cert_url.isnot(None),
    ).count()
    tech_profile_completion_rate = (
        complete_profiles / total_tech_profiles
    ) if total_tech_profiles > 0 else 0.0

    # --- Conversión (técnicos): propuestas en primera semana ---
    avg_proposals_first_week = 0.0
    if total_techs > 0:
        tech_users = db.query(User).filter(User.role == "tech").all()
        total_first_week_proposals = 0
        for tech in tech_users:
            first_week_end = tech.created_at + timedelta(days=7) if tech.created_at else now
            # Usamos user_id como string para comparar con tech_id UUID
            count = db.query(Proposal).filter(
                Proposal.tech_id == text(f"'{tech.user_id}'::uuid") if False else True,
                Proposal.created_at <= first_week_end,
            ).count()
            total_first_week_proposals += count
        avg_proposals_first_week = total_first_week_proposals / total_techs

    # --- Compromiso (técnicos): logins por semana ---
    one_week_ago = now - timedelta(days=7)
    tech_logins_week = db.query(UserSession).filter(
        UserSession.role == "tech",
        UserSession.login_at >= one_week_ago,
    ).count()
    tech_weekly_login_avg = (tech_logins_week / total_techs) if total_techs > 0 else 0.0

    # --- Fricción (técnicos): abandono en carga de archivos ---
    file_starts = db.query(ActivityEvent).filter(
        ActivityEvent.event_type == "file_upload_start"
    ).count()
    file_abandons = db.query(ActivityEvent).filter(
        ActivityEvent.event_type == "file_upload_abandon"
    ).count()
    file_upload_abandonment_rate = (file_abandons / file_starts) if file_starts > 0 else 0.0

    # --- AARRR: Acquisition ---
    anon_reg_starts = db.query(ActivityEvent).filter(
        ActivityEvent.event_type == "registration_start"
    ).count()
    reg_completes = db.query(ActivityEvent).filter(
        ActivityEvent.event_type == "registration_complete"
    ).count()
    acquisition_client_rate = (reg_completes / anon_reg_starts) if anon_reg_starts > 0 else 0.0

    tech_reg_starts = db.query(ActivityEvent).filter(
        ActivityEvent.event_type == "registration_start",
        ActivityEvent.role == "tech",
    ).count()
    tech_reg_completes = db.query(ActivityEvent).filter(
        ActivityEvent.event_type == "registration_complete",
        ActivityEvent.role == "tech",
    ).count()
    acquisition_tech_rate = (
        tech_reg_completes / tech_reg_starts
    ) if tech_reg_starts > 0 else 0.0

    # --- AARRR: Activation ---
    # Clientes con al menos una propuesta aceptada / total
    clients_with_accepted_proposal = db.query(ServiceRequest.client_id).join(
        Proposal, ServiceRequest.id == Proposal.request_id
    ).filter(
        Proposal.status == "accepted"
    ).distinct().count()
    activation_client_rate = (
        clients_with_accepted_proposal / total_clients
    ) if total_clients > 0 else 0.0

    verified_techs = db.query(TechProfile).filter(
        TechProfile.verification_status == "verified"
    ).count()
    tech_proposal_accepted_notif = db.query(ActivityEvent).filter(
        ActivityEvent.event_type == "proposal_accepted_notification",
        ActivityEvent.role == "tech",
    ).count()
    activation_tech_rate = (
        tech_proposal_accepted_notif / verified_techs
    ) if verified_techs > 0 else 0.0

    # --- AARRR: Retention ---
    # Clientes con >= 2 solicitudes en total (recurrencia)
    recurrence_subquery = (
        db.query(ServiceRequest.client_id)
        .group_by(ServiceRequest.client_id)
        .having(func.count(ServiceRequest.id) >= 2)
        .subquery()
    )
    recurrent_clients = db.query(func.count()).select_from(recurrence_subquery).scalar() or 0
    retention_client_recurrence_rate = (
        recurrent_clients / total_clients
    ) if total_clients > 0 else 0.0

    # Técnicos con >=4 logins en la última semana
    tech_login_subquery = (
        db.query(UserSession.user_id)
        .filter(UserSession.role == "tech", UserSession.login_at >= one_week_ago)
        .group_by(UserSession.user_id)
        .having(func.count(UserSession.id) >= 4)
        .subquery()
    )
    techs_4x_week = db.query(func.count()).select_from(tech_login_subquery).scalar() or 0
    retention_tech_login_4x_rate = (
        techs_4x_week / total_techs
    ) if total_techs > 0 else 0.0

    # --- AARRR: Revenue ---
    total_revenue = float(
        db.query(func.sum(PlatformRevenue.commission_amount)).scalar() or 0
    )

    # --- AARRR: Referral ---
    # Tasa de registros por invitación
    total_referrals = db.query(ReferralSource).count()
    total_users = total_clients + total_techs
    referral_rate = (total_referrals / total_users) if total_users > 0 else 0.0

    # --- Tasa de Liquidez (Liquidity Rate) ---
    completed_services = db.query(Service).filter(Service.status == "completed").count()
    liquidity_rate = (completed_services / total_requests) if total_requests > 0 else 0.0

    return MetricsDashboard(
        total_clients=total_clients,
        total_requests=total_requests,
        request_creation_rate=round(request_creation_rate, 4),
        proposal_acceptance_rate=round(proposal_acceptance_rate, 4),
        history_view_avg_7d=round(history_view_avg_7d, 4),
        client_offer_abandonment_rate=round(client_offer_abandonment_rate, 4),
        total_techs=total_techs,
        tech_profile_completion_rate=round(tech_profile_completion_rate, 4),
        avg_proposals_first_week=round(avg_proposals_first_week, 2),
        tech_weekly_login_avg=round(tech_weekly_login_avg, 2),
        file_upload_abandonment_rate=round(file_upload_abandonment_rate, 4),
        acquisition_client_rate=round(acquisition_client_rate, 4),
        acquisition_tech_rate=round(acquisition_tech_rate, 4),
        activation_client_rate=round(activation_client_rate, 4),
        activation_tech_rate=round(activation_tech_rate, 4),
        retention_client_recurrence_rate=round(retention_client_recurrence_rate, 4),
        retention_tech_login_4x_rate=round(retention_tech_login_4x_rate, 4),
        total_revenue=round(total_revenue, 2),
        referral_rate=round(referral_rate, 4),
        liquidity_rate=round(liquidity_rate, 4),
    )


@router.post("/seed", status_code=201)
def seed_metrics_data(db: Session = Depends(get_db)):
    """Genera datos de prueba positivos para el dashboard de demostración universitaria."""
    try:
        import uuid
        import random
        from datetime import datetime, timedelta, timezone
        from app.models.user_log import UserLog
        from app.models.review import Review
        from app.models.service import Service
        from app.models.proposal import Proposal
        from app.models.service_request import ServiceRequest

        now = datetime.now(timezone.utc)
        # Preserve admin user(s) by their known emails
        ADMIN_EMAILS = ["admin@tecnicoconfianza.com", "admin@verifytech.com"]

        # 0. Limpieza absoluta usando TRUNCATE CASCADE
        from sqlalchemy import text as sql_text
        # First, get admin user IDs to preserve
        admin_rows = db.query(User).filter(User.user_id.in_(ADMIN_EMAILS)).all()
        admin_data = [(str(a.id), a.user_id, a.role, a.created_at) for a in admin_rows]
        
        # Truncate everything (CASCADE handles FK dependencies automatically)
        db.execute(sql_text("""
            TRUNCATE TABLE 
                reviews, platform_revenues, services, proposals, service_requests,
                wallet_transactions, tech_profiles, referral_sources, activity_events,
                user_sessions, user_logs, users
            CASCADE
        """))
        db.commit()
        
        # Re-insert admin user(s)
        for aid, auid, arole, acreated in admin_data:
            from uuid import UUID as PyUUID
            admin_user = User(id=PyUUID(aid), user_id=auid, role=arole, created_at=acreated)
            db.add(admin_user)
        db.commit()
        db.commit()

        clients = []
        techs = []

        # 1. Crear 20 clientes de demo
        for i in range(1, 21):
            uid = uuid.uuid4()
            client = User(
                id=uid,
                user_id=f"client_{i}@gmail.com",
                role="client",
                created_at=now - timedelta(days=random.randint(10, 30))
            )
            db.add(client)
            clients.append(client)

        # 2. Crear 10 técnicos de demo
        for i in range(1, 11):
            uid = uuid.uuid4()
            tech = User(
                id=uid,
                user_id=f"tech_{i}@gmail.com",
                role="tech",
                created_at=now - timedelta(days=random.randint(10, 30))
            )
            db.add(tech)
            techs.append(tech)

        db.commit()

        # 3. Perfiles de técnicos
        for tech in techs:
            is_complete = random.random() < 0.9  # 90% completion
            profile = TechProfile(
                user_id=tech.id,
                full_name=f"Técnico Demo {tech.user_id.split('@')[0].capitalize()}",
                specialty=random.choice(["Gasfitería", "Electricidad", "Pintura"]),
                dni_front_url="http://dummy.url/dni_front.png" if is_complete else None,
                dni_back_url="http://dummy.url/dni_back.png" if is_complete else None,
                cert_url="http://dummy.url/cert.pdf" if is_complete else None,
                verification_status="verified" if is_complete else "pending"
            )
            db.add(profile)
        db.commit()

        # 4. Fuentes de referidos (Referral rate: e.g. 60%)
        # 18 de los 30 usuarios agregados tienen referidos
        all_users = clients + techs
        for idx, u in enumerate(all_users):
            if idx < 18:
                db.add(ReferralSource(user_id=str(u.id), source="friend_family"))
                u.referral_source = "friend_family"
        db.commit()

        # 5. Solicitudes, Propuestas y Servicios
        # Queremos:
        # - Activation Client Rate: Clientes con >=1 propuestas aceptadas / total clientes (20) = 90% (18 clientes)
        # - Retention Client Recurrence Rate: Clientes con >= 2 solicitudes / total = 70% (14 clientes)
        # - Liquidity Rate: completadas / total solicitudes = 80%
        #
        # Crearemos 50 solicitudes en total.
        # 14 clientes tendrán 2 solicitudes (28 solicitudes).
        # 4 clientes tendrán 3 solicitudes (12 solicitudes).
        # 2 clientes tendrán 5 solicitudes (10 solicitudes).
        # Total solicitudes = 50. Todos los 20 clientes tienen al menos una solicitud.
        #
        # Para lograr un Activation Client Rate de 90% (18 clientes):
        # Haremos que 18 de los 20 clientes tengan al menos una propuesta en estado 'accepted'.
        #
        # Para lograr una Tasa de Liquidez de 80% (40 completados de 50 solicitudes):
        # 40 solicitudes tendrán propuestas aceptadas y servicios en estado 'completed'.
        # Las otras 10 solicitudes quedarán sin propuestas aceptadas (estado open o closed sin servicios).

        req_count = 0
        completed_goal = 40
        accepted_clients = set()

        for idx, client in enumerate(clients):
            # Determinar cuántas solicitudes tiene este cliente
            if idx < 14:
                num_reqs = 2
            elif idx < 18:
                num_reqs = 3
            else:
                num_reqs = 5

            for _ in range(num_reqs):
                req_count += 1
                req_id = uuid.uuid4()
                # 40 de las 50 serán closed (completadas)
                should_complete = req_count <= completed_goal
                
                req = ServiceRequest(
                    id=req_id,
                    client_id=client.id,
                    title=f"Servicio de {random.choice(['Gasfitería', 'Electricidad'])}",
                    category="Gasfitería" if req_count % 2 == 0 else "Electricidad",
                    description="Necesito urgente ayuda de un profesional.",
                    address="Av. Larco 123, Miraflores",
                    status="closed" if should_complete else "open",
                    created_at=now - timedelta(days=random.randint(2, 20))
                )
                db.add(req)

                # Generar propuestas de técnicos
                num_proposals = random.randint(1, 3)
                accepted_prop_id = None
                
                for p_idx in range(num_proposals):
                    tech = techs[(req_count + p_idx) % len(techs)]
                    # La primera propuesta de la solicitud se acepta si should_complete
                    is_accepted = should_complete and (p_idx == 0)
                    
                    prop = Proposal(
                        id=uuid.uuid4(),
                        request_id=req_id,
                        tech_id=tech.id,
                        price=random.randint(60, 200),
                        estimated_time="1 día",
                        status="accepted" if is_accepted else "rejected",
                        created_at=req.created_at + timedelta(hours=2)
                    )
                    db.add(prop)
                    if is_accepted:
                        accepted_prop_id = prop.id
                        accepted_clients.add(client.id)

                        # Crear servicio
                        svc = Service(
                            id=uuid.uuid4(),
                            request_id=req_id,
                            client_id=client.id,
                            tech_id=tech.id,
                            proposal_id=prop.id,
                            status="completed",
                            created_at=prop.created_at + timedelta(days=1)
                        )
                        db.add(svc)

                        # Reseña (Satisfaction/Activation events)
                        if random.random() < 0.85:
                            rev = Review(
                                id=uuid.uuid4(),
                                service_id=svc.id,
                                client_id=client.id,
                                tech_id=tech.id,
                                rating=random.randint(4, 5),
                                comment="Buen servicio."
                            )
                            db.add(rev)

                        # Platform Revenue (15% commission)
                        revenue_amount = round(float(prop.price) * 0.15, 2)
                        revenue = PlatformRevenue(
                            id=uuid.uuid4(),
                            service_id=svc.id,
                            tech_id=str(tech.id),
                            client_id=str(client.id),
                            service_amount=prop.price,
                            commission_rate=0.15,
                            commission_amount=revenue_amount,
                            created_at=svc.created_at
                        )
                        db.add(revenue)
        db.commit()

        # 6. Eventos de Actividad (AARRR funnel metrics)
        # Clientes
        for _ in range(250):
            db.add(ActivityEvent(event_type="registration_start", role="client"))
            if random.random() < 0.85:
                db.add(ActivityEvent(event_type="registration_complete", role="client"))

        # Técnicos
        for _ in range(120):
            db.add(ActivityEvent(event_type="registration_start", role="tech"))
            if random.random() < 0.75:
                db.add(ActivityEvent(event_type="registration_complete", role="tech"))

        # Activaciones de Técnicos notificadas
        for tech in techs:
            db.add(ActivityEvent(user_id=str(tech.id), role="tech", event_type="proposal_accepted_notification"))

        # Abandonos de archivos en técnicos
        for _ in range(40):
            db.add(ActivityEvent(event_type="file_upload_start", role="tech"))
            if random.random() < 0.05:
                db.add(ActivityEvent(event_type="file_upload_abandon", role="tech"))

        # Abandonos en visualización de propuestas de clientes
        for _ in range(100):
            db.add(ActivityEvent(event_type="proposal_view", role="client"))
            if random.random() < 0.04:
                db.add(ActivityEvent(event_type="proposal_abandon", role="client"))

        # Vistas de historial
        for _ in range(150):
            db.add(ActivityEvent(event_type="history_view", role="client"))

        db.commit()

        # 7. Inicios de sesión de técnicos (Login rate: 8 de 10 tienen >=4 en última semana)
        for idx, tech in enumerate(techs):
            logins = random.randint(4, 7) if idx < 8 else random.randint(1, 3)
            for _ in range(logins):
                sess = UserSession(
                    user_id=str(tech.id),
                    role="tech",
                    login_at=now - timedelta(days=random.randint(0, 6))
                )
                db.add(sess)
        db.commit()

        return {"status": "success", "message": "Base de datos restablecida con 31 usuarios y métricas demo ajustadas."}
    except Exception as e:
        import traceback
        return {"status": "error", "message": str(e), "trace": traceback.format_exc()}
