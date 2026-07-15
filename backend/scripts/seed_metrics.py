"""
seed_metrics.py
===============
Inserta datos falsos pero realistas para simular 2 semanas de actividad:
  - 15 clientes
  - 5 técnicos
Distribuidos entre hoy - 14 dias y hoy.

Uso:
    cd backend
    python scripts/seed_metrics.py
"""

import sys, os, uuid, random
from datetime import datetime, timedelta, timezone
from decimal import Decimal

sys.path.insert(0, os.path.dirname(os.path.dirname(__file__)))

from app.database import SessionLocal
from app.models.user import User
from app.models.tech_profile import TechProfile
from app.models.service_request import ServiceRequest
from app.models.proposal import Proposal
from app.models.service import Service
from app.models.review import Review
from app.models.user_log import UserLog
from app.models.metrics import UserSession, ReferralSource, ActivityEvent, PlatformRevenue

# ─── Configuración ───────────────────────────────────────────────────────────
SEED_START = datetime.now(timezone.utc) - timedelta(days=14)
SEED_END   = datetime.now(timezone.utc)
COMMISSION_RATE = Decimal("0.1500")

def rand_dt(start: datetime = SEED_START, end: datetime = SEED_END) -> datetime:
    delta = end - start
    return start + timedelta(seconds=random.randint(0, int(delta.total_seconds())))

def rand_dt_after(base: datetime, max_hours: int = 48) -> datetime:
    return base + timedelta(hours=random.randint(1, max_hours))

# ─── Datos maestros ───────────────────────────────────────────────────────────
CLIENT_NAMES = [
    "Ana García", "Carlos Mendoza", "Lucia Fernández", "José Torres",
    "María Quispe", "Pedro Ramos", "Rosa Vargas", "Miguel Castillo",
    "Elena Flores", "Roberto Sánchez", "Carmen López", "Diego Herrera",
    "Sofía Morales", "Andrés Reyes", "Patricia Vega",
]

TECH_DATA = [
    {"name": "Luis Alvarado",    "specialty": "Electricista",    "exp": 8,  "complete": True},
    {"name": "Marco Paz",        "specialty": "Plomero",         "exp": 5,  "complete": True},
    {"name": "Jorge Gutiérrez",  "specialty": "Gasfitero",       "exp": 3,  "complete": True},
    {"name": "Félix Ríos",       "specialty": "Pintor",          "exp": 6,  "complete": False},  # sin docs
    {"name": "Raúl Contreras",   "specialty": "Carpintero",      "exp": 10, "complete": False},  # sin cert
]

CATEGORIES = ["Electricidad", "Plomería", "Gasfitería", "Pintura", "Carpintería"]
TITLES = [
    "Cortocircuito en sala", "Fuga de agua en baño", "Reparación de puerta",
    "Pintar cuarto principal", "Instalación de tomacorriente",
    "Cambio de tubería", "Revisión de instalaciones eléctricas",
    "Arreglo de persiana", "Instalación de lavabo", "Barnizado de muebles",
    "Fuga en tubería de cocina", "Instalación de ventilador", "Grifo que gotea",
    "Reparación de cerradura", "Mantenimiento eléctrico general",
    "Pintura de fachada", "Desatascar cañería", "Instalar interruptor",
    "Reparar techo de madera", "Cambio de llave de paso",
    "Arreglo de puerta corredera", "Revisión de panel eléctrico",
    "Instalación de ducha", "Reparar mueble de cocina", "Sellado de filtraciones",
    "Instalación de luces LED", "Cambio de válvula", "Arreglo de bisagras",
    "Pintar escalera", "Reparar contacto dañado",
]
ADDRESSES = [
    "Av. España 145, Trujillo", "Jr. Independencia 230, Trujillo",
    "Urb. California Mz. B Lt. 5", "Av. América Norte 1200",
    "Calle Las Rosas 45, El Porvenir", "Av. Huamán 890",
    "Jr. Orbegoso 340, Trujillo", "Av. Mansiche 567",
]
REVIEW_COMMENTS = [
    "Excelente trabajo, muy puntual.",
    "El técnico fue muy profesional y resolvió todo rápido.",
    "Muy buena atención, recomendado.",
    "Trabajo bien hecho, precio justo.",
    "Llegó a tiempo y dejó todo limpio.",
    "Muy amable y eficiente, lo volvería a contratar.",
    "Buen servicio, aunque tardó un poco más de lo previsto.",
    "Resolvió el problema sin inconvenientes.",
    "Excelente, super recomendado en el barrio.",
    "Trabajo correcto, precio razonable.",
]
REFERRAL_DIST = (
    ["friend_family"] * 6 +
    ["social_media"]  * 5 +
    ["google_search"] * 3 +
    ["hardware_store"] * 1
)

# ─── Main ─────────────────────────────────────────────────────────────────────
def main():
    db = SessionLocal()
    try:
        print("[SEED] Iniciando seed de métricas...")

        # ── 1. Crear técnicos ────────────────────────────────────────────────
        tech_users = []
        tech_profiles = []
        for i, td in enumerate(TECH_DATA):
            uid = str(uuid.uuid4())
            reg_dt = rand_dt(SEED_START, SEED_START + timedelta(days=3))
            user = User(user_id=uid, role="tech", created_at=reg_dt, updated_at=reg_dt)
            db.add(user)
            db.flush()
            tech_users.append(user)

            uid_uuid = uuid.UUID(uid)
            photo_base = f"https://cdn.example.com/techs/tech_{i+1}"
            profile = TechProfile(
                user_id=uid_uuid,
                full_name=td["name"],
                specialty=td["specialty"],
                experience_years=td["exp"],
                description=f"Técnico con {td['exp']} años de experiencia en {td['specialty'].lower()}.",
                photo_url=f"{photo_base}_photo.jpg",
                dni_front_url=f"{photo_base}_dni_front.jpg" if td["complete"] else None,
                dni_back_url=f"{photo_base}_dni_back.jpg"  if td["complete"] else None,
                cert_url=f"{photo_base}_cert.pdf"          if td["complete"] else None,
                verification_status="verified" if td["complete"] else "pending",
                rating_avg=Decimal(str(round(random.uniform(3.8, 5.0), 2))),
                reviews_count=0,
                created_at=reg_dt,
            )
            db.add(profile)
            tech_profiles.append(profile)

            # Log de registro
            db.add(UserLog(
                user_id=uid_uuid,
                evento="Registro",
                descripcion=f"Técnico {td['name']} registrado",
                fecha=reg_dt,
            ))
        db.flush()
        print(f"   [OK] {len(tech_users)} técnicos creados")

        # ── 2. Crear clientes ─────────────────────────────────────────────────
        client_users = []
        for i, name in enumerate(CLIENT_NAMES):
            uid = str(uuid.uuid4())
            # Distribuir registros a lo largo de las 2 semanas
            reg_dt = rand_dt(
                SEED_START + timedelta(days=i * 0.9),
                SEED_START + timedelta(days=i * 0.9 + 1),
            )
            source = random.choice(REFERRAL_DIST)
            user = User(
                user_id=uid, role="client",
                referral_source=source,
                created_at=reg_dt, updated_at=reg_dt,
            )
            db.add(user)
            db.flush()
            client_users.append(user)

            # Referral source
            db.add(ReferralSource(user_id=uid, source=source, created_at=reg_dt))

            # Log de registro
            db.add(UserLog(
                user_id=uuid.UUID(uid),
                evento="Registro",
                descripcion=f"Cliente {name} registrado",
                fecha=reg_dt,
            ))

            # Eventos de registro (acquisition)
            db.add(ActivityEvent(
                user_id=None, role="anonymous",
                event_type="registration_start", page_name="auth",
                created_at=reg_dt - timedelta(minutes=random.randint(2, 10)),
            ))
            db.add(ActivityEvent(
                user_id=uid, role="client",
                event_type="registration_complete", page_name="auth",
                created_at=reg_dt,
            ))
        db.flush()
        print(f"   [OK] {len(client_users)} clientes creados")

        # ── 3. Sesiones (logins) ──────────────────────────────────────────────
        session_count = 0
        # Técnicos: 3-6 logins por semana cada uno (distribución realista)
        for tuser in tech_users:
            for day_offset in range(14):
                day_start = SEED_START + timedelta(days=day_offset)
                if random.random() < 0.55:  # 55% de días se conectan
                    login_dt = rand_dt(day_start, day_start + timedelta(hours=23))
                    db.add(UserSession(user_id=tuser.user_id, role="tech", login_at=login_dt))
                    session_count += 1
                    # Double-login en días de alta actividad
                    if random.random() < 0.25:
                        db.add(UserSession(user_id=tuser.user_id, role="tech",
                                          login_at=login_dt + timedelta(hours=random.randint(3, 8))))
                        session_count += 1

        # Clientes: 1-3 logins por semana, menos frecuente
        for cuser in client_users:
            for day_offset in range(14):
                day_start = SEED_START + timedelta(days=day_offset)
                if random.random() < 0.25:
                    login_dt = rand_dt(day_start, day_start + timedelta(hours=23))
                    db.add(UserSession(user_id=cuser.user_id, role="client", login_at=login_dt))
                    session_count += 1
        db.flush()
        print(f"   [OK] {session_count} sesiones registradas")

        # ── 4. Solicitudes de servicio ────────────────────────────────────────
        requests_list = []
        # Cada cliente crea 1-3 solicitudes
        req_count = 0
        for cuser in client_users:
            n_requests = random.randint(1, 3)
            for _ in range(n_requests):
                req_dt = rand_dt_after(cuser.created_at, max_hours=72)
                if req_dt > SEED_END:
                    break
                category = random.choice(CATEGORIES)
                req = ServiceRequest(
                    id=uuid.uuid4(),
                    client_id=uuid.UUID(cuser.user_id),
                    title=random.choice(TITLES),
                    category=category,
                    description=f"Necesito un técnico para {category.lower()}. Urgente.",
                    address=random.choice(ADDRESSES),
                    status="open",
                    created_at=req_dt,
                )
                db.add(req)
                requests_list.append((req, cuser))
                req_count += 1

                # Evento: creación de solicitud (señal de compra cliente)
                db.add(ActivityEvent(
                    user_id=cuser.user_id, role="client",
                    event_type="page_view", page_name="create_request",
                    event_metadata={"request_id": str(req.id)},
                    created_at=req_dt,
                ))
        db.flush()
        print(f"   [OK] {req_count} solicitudes creadas")

        # ── 5. Propuestas ─────────────────────────────────────────────────────
        proposals_list = []
        proposal_count = 0
        accepted_count = 0
        abandoned_proposal_views = 0

        for req, cuser in requests_list:
            # 2-4 técnicos envían propuesta por solicitud
            n_props = random.randint(2, min(4, len(tech_users)))
            sampled_techs = random.sample(tech_users, n_props)
            req_proposals = []

            for tuser in sampled_techs:
                prop_dt = rand_dt_after(req.created_at, max_hours=36)
                if prop_dt > SEED_END:
                    continue
                amount = Decimal(str(random.randint(80, 450)))
                prop = Proposal(
                    id=uuid.uuid4(),
                    request_id=req.id,
                    tech_id=uuid.UUID(tuser.user_id),
                    price=amount,
                    estimated_time=f"{random.randint(1, 4)} hora(s)",
                    observations=f"Puedo atenderte el {random.choice(['lunes','martes','miércoles','jueves','viernes'])}.",
                    status="sent",
                    created_at=prop_dt,
                )
                db.add(prop)
                req_proposals.append((prop, tuser))
                proposal_count += 1

                # Evento: técnico envía propuesta en primera semana (activación)
                days_since_reg = (prop_dt - tuser.created_at).days if tuser.created_at else 0
                if days_since_reg <= 7:
                    db.add(ActivityEvent(
                        user_id=tuser.user_id, role="tech",
                        event_type="page_view", page_name="send_proposal",
                        event_metadata={"proposal_id": str(prop.id), "days_since_reg": days_since_reg},
                        created_at=prop_dt,
                    ))

            # Cliente ve las propuestas
            if req_proposals:
                view_dt = rand_dt_after(req_proposals[0][0].created_at, max_hours=24)
                db.add(ActivityEvent(
                    user_id=cuser.user_id, role="client",
                    event_type="proposal_view", page_name="request_detail",
                    event_metadata={"request_id": str(req.id), "n_proposals": len(req_proposals)},
                    created_at=view_dt,
                ))

                # 30% abandona sin aceptar (fricción)
                if random.random() < 0.30:
                    db.add(ActivityEvent(
                        user_id=cuser.user_id, role="client",
                        event_type="proposal_abandon", page_name="request_detail",
                        event_metadata={"request_id": str(req.id)},
                        created_at=view_dt + timedelta(minutes=random.randint(2, 20)),
                    ))
                    abandoned_proposal_views += 1
                    proposals_list.append((None, None, None))  # no hay servicio
                    continue

                # Compara perfiles (activation AARRR)
                db.add(ActivityEvent(
                    user_id=cuser.user_id, role="client",
                    event_type="profile_comparison", page_name="request_detail",
                    event_metadata={"request_id": str(req.id)},
                    created_at=view_dt + timedelta(minutes=random.randint(5, 30)),
                ))

                # Acepta una propuesta
                chosen_prop, chosen_tech = random.choice(req_proposals)
                chosen_prop.status = "accepted"
                accepted_count += 1
                req.status = "in_progress"
                proposals_list.append((chosen_prop, chosen_tech, cuser))

                # Notificación al técnico de propuesta aceptada (activation tech)
                accept_dt = view_dt + timedelta(minutes=random.randint(30, 120))
                db.add(ActivityEvent(
                    user_id=chosen_tech.user_id, role="tech",
                    event_type="proposal_accepted_notification",
                    page_name="tech_dashboard",
                    event_metadata={"proposal_id": str(chosen_prop.id)},
                    created_at=accept_dt,
                ))
            else:
                proposals_list.append((None, None, None))

        db.flush()
        print(f"   [OK] {proposal_count} propuestas | {accepted_count} aceptadas | {abandoned_proposal_views} abandonos")

        # ── 6. Servicios ──────────────────────────────────────────────────────
        services_list = []
        service_count = 0
        completed_count = 0

        for prop, tech, client in proposals_list:
            if prop is None:
                continue
            svc_dt = rand_dt_after(prop.created_at, max_hours=72)
            if svc_dt > SEED_END:
                svc_dt = SEED_END - timedelta(hours=random.randint(1, 12))

            # 85% de servicios se completan
            status = "completed" if random.random() < 0.85 else "scheduled"
            svc = Service(
                id=uuid.uuid4(),
                proposal_id=prop.id,
                request_id=prop.request_id,
                tech_id=uuid.UUID(tech.user_id),
                client_id=uuid.UUID(client.user_id),
                status=status,
                scheduled_start=svc_dt,
                scheduled_end=svc_dt + timedelta(hours=random.randint(1, 3)),
                created_at=svc_dt,
            )
            db.add(svc)
            services_list.append((svc, prop, tech, client))
            service_count += 1
            if status == "completed":
                completed_count += 1
        db.flush()
        print(f"   [OK] {service_count} servicios | {completed_count} completados")

        # ── 7. Reseñas ────────────────────────────────────────────────────────
        review_count = 0
        history_views_total = 0

        for svc, prop, tech, client in services_list:
            if svc.status != "completed":
                continue
            # 78% de servicios completados tienen reseña
            if random.random() > 0.78:
                continue
            review_dt = rand_dt_after(svc.scheduled_end or svc.created_at, max_hours=48)
            if review_dt > SEED_END:
                continue
            rating = random.choices([3, 4, 5], weights=[10, 35, 55])[0]
            db.add(Review(
                id=uuid.uuid4(),
                service_id=svc.id,
                client_id=uuid.UUID(client.user_id),
                tech_id=uuid.UUID(tech.user_id),
                rating=rating,
                comment=random.choice(REVIEW_COMMENTS),
                created_at=review_dt,
            ))
            review_count += 1

            # Cliente visita el historial en los 7 días post-servicio (retención)
            n_history_visits = random.choices([0, 1, 2, 3], weights=[20, 45, 25, 10])[0]
            for v in range(n_history_visits):
                visit_dt = (svc.scheduled_end or svc.created_at) + timedelta(
                    hours=random.randint(2, 7 * 24)
                )
                if visit_dt <= SEED_END:
                    db.add(ActivityEvent(
                        user_id=client.user_id, role="client",
                        event_type="history_view", page_name="history",
                        event_metadata={"service_id": str(svc.id)},
                        created_at=visit_dt,
                    ))
                    history_views_total += 1

        db.flush()
        print(f"   [OK] {review_count} reseñas | {history_views_total} visitas al historial")

        # ── 8. Ingresos de la plataforma (comisiones) ─────────────────────────
        revenue_count = 0
        for svc, prop, tech, client in services_list:
            if svc.status != "completed":
                continue
            amount = prop.price
            commission = (amount * COMMISSION_RATE).quantize(Decimal("0.01"))
            db.add(PlatformRevenue(
                id=uuid.uuid4(),
                service_id=svc.id,
                tech_id=tech.user_id,
                client_id=client.user_id,
                service_amount=amount,
                commission_rate=COMMISSION_RATE,
                commission_amount=commission,
                created_at=svc.created_at,
            ))
            revenue_count += 1
        db.flush()
        print(f"   [OK] {revenue_count} registros de ingresos")

        # ── 9. Eventos de carga de archivos (técnicos) ────────────────────────
        file_starts = 0
        file_abandons = 0
        for tuser in tech_users:
            reg_dt = tuser.created_at or SEED_START
            upload_dt = rand_dt_after(reg_dt, max_hours=48)
            db.add(ActivityEvent(
                user_id=tuser.user_id, role="tech",
                event_type="file_upload_start", page_name="tech_profile",
                created_at=upload_dt,
            ))
            file_starts += 1
            # Los técnicos sin docs completos probablemente abandonaron
            profile = next((p for p in tech_profiles if p.user_id == uuid.UUID(tuser.user_id)), None)
            if profile and profile.verification_status == "pending":
                db.add(ActivityEvent(
                    user_id=tuser.user_id, role="tech",
                    event_type="file_upload_abandon", page_name="tech_profile",
                    created_at=upload_dt + timedelta(minutes=random.randint(5, 30)),
                ))
                file_abandons += 1

        db.flush()
        print(f"   [OK] Carga archivos: {file_starts} inicios, {file_abandons} abandonos")

        # ── 10. Visits anónimas (acquisition) ─────────────────────────────────
        anon_visits = 0
        for _ in range(25):
            db.add(ActivityEvent(
                user_id=None, role="anonymous",
                event_type="registration_start", page_name="auth",
                created_at=rand_dt(),
            ))
            anon_visits += 1
        # Técnicos que visitaron pero no completaron registro
        for _ in range(8):
            db.add(ActivityEvent(
                user_id=None, role="tech",
                event_type="registration_start", page_name="auth",
                created_at=rand_dt(),
            ))
            anon_visits += 1
        # Técnicos que sí completaron registro
        for tuser in tech_users:
            db.add(ActivityEvent(
                user_id=tuser.user_id, role="tech",
                event_type="registration_complete", page_name="auth",
                created_at=tuser.created_at,
            ))
        db.flush()
        print(f"   [OK] {anon_visits} visitas anónimas + registros anónimos simulados")

        db.commit()
        print("\n[DONE] Seed completado exitosamente!")
        print("   Ejecuta GET /api/metrics/dashboard para ver las métricas agregadas.")

    except Exception as e:
        db.rollback()
        print(f"\n[ERROR] Error durante el seed: {e}")
        import traceback; traceback.print_exc()
    finally:
        db.close()


if __name__ == "__main__":
    main()


