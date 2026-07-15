from pydantic import BaseModel
from typing import Optional, Any, Dict
from datetime import datetime


class SessionCreate(BaseModel):
    """Cuerpo para registrar un login."""
    role: str  # 'client' | 'tech'


class ReferralCreate(BaseModel):
    """Cuerpo para registrar la fuente de referral en el registro."""
    # 'friend_family' | 'social_media' | 'hardware_store' | 'google_search'
    source: str


class ActivityEventCreate(BaseModel):
    """Cuerpo para registrar un evento de navegación."""
    event_type: str
    page_name: Optional[str] = None
    event_metadata: Optional[Dict[str, Any]] = None


class MetricsDashboard(BaseModel):
    """Respuesta del dashboard de métricas agregadas."""
    # --- CLIENTES ---
    total_clients: int
    total_requests: int
    request_creation_rate: float          # solicitudes / clientes registrados
    proposal_acceptance_rate: float       # propuestas aceptadas / total propuestas
    history_view_avg_7d: float            # promedio de visitas al historial en 7d post-servicio
    client_offer_abandonment_rate: float  # abandonos en pantalla de propuestas / vistas

    # --- TÉCNICOS ---
    total_techs: int
    tech_profile_completion_rate: float   # techs con docs completos / total techs
    avg_proposals_first_week: float       # propuestas promedio en 1a semana
    tech_weekly_login_avg: float          # logins promedio por semana por técnico
    file_upload_abandonment_rate: float   # abandonos en carga de archivos / inicios

    # --- AARRR ---
    acquisition_client_rate: float        # registros / visitas anónimas
    acquisition_tech_rate: float          # registros techs / visitas anónimas techs
    activation_client_rate: float         # Clientes con al menos una propuesta aceptada / total
    activation_tech_rate: float           # propuesta aceptada recibida / techs verificados
    retention_client_recurrence_rate: float # tasa de recurrencia de clientes (>= 2 solicitudes) / total
    retention_tech_login_4x_rate: float   # techs con >=4 logins/semana / total techs
    total_revenue: float                  # suma de commission_amount
    referral_rate: float                  # registros por invitación / total
    liquidity_rate: float                 # solicitudes completadas con éxito / total solicitudes
