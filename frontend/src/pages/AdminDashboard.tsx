import React, { useCallback, useEffect, useState } from 'react';
import { useAuth } from '../store/AuthContext';
import {
  fetchOverviewStats, fetchMetricsDashboard, fetchPendingTechs,
  fetchAllRequests, fetchAllServices, fetchPendingRecharges, approveRecharge, rejectRecharge,
  verifyTech,
  type OverviewStats, type MetricsDashboard, type PendingTech,
  type AdminRequest, type AdminService, type AdminRecharge
} from '../api/admin';

// ─── Icons (inline SVG) ────────────────────────────────────────────────────
const Icon = ({ d, size = 20, color = 'currentColor' }: { d: string; size?: number; color?: string }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />
  </svg>
);
const ICONS = {
  overview:  'M3 3h7v7H3zm11 0h7v7h-7zM3 14h7v7H3zm11 3a4 4 0 1 0 8 0 4 4 0 0 0-8 0',
  users:     'M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8zm8 0a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm4 10v-2a3 3 0 0 0-3-3',
  verify:    'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0 1 12 2.944a11.955 11.955 0 0 1-8.618 3.04A12.02 12.02 0 0 0 3 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016',
  requests:  'M9 5H7a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2h-2M9 5a2 2 0 0 0 2 2h2a2 2 0 0 0 2-2M9 5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2',
  services:  'M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76',
  metrics:   'M18 20V10M12 20V4M6 20v-6',
  logout:    'M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V7a3 3 0 0 1 3-3h4a3 3 0 0 1 3 3v1',
  check:     'M5 13l4 4L19 7',
  x:         'M6 18L18 6M6 6l12 12',
  alert:     'M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0',
  star:      'M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2',
  shield:    'M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10',
  wallet:    'M3 5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5zm12 5h4v4h-4v-4z',
};

// ─── Sidebar nav items ─────────────────────────────────────────────────────
type Section = 'overview' | 'metrics' | 'verify' | 'requests' | 'services' | 'recharges';

const NAV_ITEMS: { id: Section; label: string; icon: keyof typeof ICONS }[] = [
  { id: 'overview',  label: 'Overview',          icon: 'overview'  },
  { id: 'metrics',   label: 'Métricas AARRR',     icon: 'metrics'   },
  { id: 'verify',    label: 'Verificaciones',      icon: 'verify'    },
  { id: 'requests',  label: 'Solicitudes',         icon: 'requests'  },
  { id: 'services',  label: 'Servicios',           icon: 'services'  },
  { id: 'recharges', label: 'Recargas Wallet',     icon: 'wallet'    },
];

// ─── Helpers ───────────────────────────────────────────────────────────────
const pct = (v: number) => `${(v * 100).toFixed(1)}%`;
const fmt = (v: number) => v.toLocaleString('es-PE');
const ago = (dateStr: string | null) => {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const diff = (Date.now() - d.getTime()) / 1000;
  if (diff < 3600)  return `${Math.floor(diff / 60)}m`;
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
  return `${Math.floor(diff / 86400)}d`;
};

const STATUS_LABEL: Record<string, { label: string; cls: string }> = {
  open:        { label: 'Abierta',    cls: 'badge-blue'  },
  closed:      { label: 'Cerrada',    cls: 'badge-gray'  },
  cancelled:   { label: 'Cancelada',  cls: 'badge-red'   },
  scheduled:   { label: 'Prog.',      cls: 'badge-blue'  },
  in_progress: { label: 'En curso',   cls: 'badge-amber' },
  completed:   { label: 'Completado', cls: 'badge-green' },
  pending:     { label: 'Pendiente',  cls: 'badge-amber' },
  verified:    { label: 'Verificado', cls: 'badge-green' },
  rejected:    { label: 'Rechazado',  cls: 'badge-red'   },
};

// ─── KPI Card ──────────────────────────────────────────────────────────────
interface KpiCardProps {
  label: string;
  value: string | number;
  sub?: string;
  accent?: string;
  icon?: string;
}
function KpiCard({ label, value, sub, accent = '#004ac6', icon }: KpiCardProps) {
  return (
    <div className="card animate-fade-in" style={{ padding: '1.25rem 1.5rem', position: 'relative', overflow: 'hidden' }}>
      <div style={{
        position: 'absolute', top: 0, left: 0, width: '4px', height: '100%',
        background: accent, borderRadius: '4px 0 0 4px'
      }} />
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '0.5rem' }}>
        <div>
          <p style={{ fontSize: '0.78rem', fontWeight: 500, color: '#505f76', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '0.4rem' }}>
            {label}
          </p>
          <p style={{ fontSize: '2rem', fontWeight: 800, color: '#191c1e', lineHeight: 1 }}>
            {value}
          </p>
          {sub && <p style={{ fontSize: '0.78rem', color: '#94a3b8', marginTop: '0.3rem' }}>{sub}</p>}
        </div>
        {icon && (
          <div style={{
            width: 44, height: 44, borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: `${accent}18`, flexShrink: 0
          }}>
            <Icon d={ICONS[icon as keyof typeof ICONS] || ''} color={accent} size={22} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Progress Bar ─────────────────────────────────────────────────────────
function ProgressBar({ label, value, color = '#004ac6', max = 1 }: { label: string; value: number; color?: string; max?: number }) {
  const pctVal = Math.min((value / max) * 100, 100);
  return (
    <div style={{ marginBottom: '0.75rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.3rem' }}>
        <span style={{ fontSize: '0.85rem', color: '#434655', fontWeight: 500 }}>{label}</span>
        <span style={{ fontSize: '0.85rem', color: color, fontWeight: 700 }}>
          {max === 1 ? pct(value) : value.toFixed(2)}
        </span>
      </div>
      <div style={{ height: 8, background: '#eceef0', borderRadius: 999, overflow: 'hidden' }}>
        <div style={{
          height: '100%', width: `${pctVal}%`, background: color,
          borderRadius: 999, transition: 'width 0.8s ease'
        }} />
      </div>
    </div>
  );
}

// ─── Section wrapper ──────────────────────────────────────────────────────
function SectionHeader({ title, sub }: { title: string; sub?: string }) {
  return (
    <div style={{ marginBottom: '1.5rem' }}>
      <h2 style={{ fontSize: '1.4rem', fontWeight: 800, color: '#191c1e', margin: 0 }}>{title}</h2>
      {sub && <p style={{ fontSize: '0.9rem', color: '#94a3b8', marginTop: '0.25rem' }}>{sub}</p>}
    </div>
  );
}

// ─── Skeleton ─────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="card" style={{ padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
      <div className="skeleton" style={{ height: 14, width: '60%' }} />
      <div className="skeleton" style={{ height: 32, width: '40%' }} />
      <div className="skeleton" style={{ height: 12, width: '80%' }} />
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION: OVERVIEW
// ══════════════════════════════════════════════════════════════════════════════
function OverviewSection() {
  const [stats, setStats] = useState<OverviewStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchOverviewStats()
      .then(setStats)
      .catch(() => setError('No se pudo cargar el overview'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem' }}>
      {Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)}
    </div>
  );
  if (error) return <div className="alert alert-error">{error}</div>;
  if (!stats) return null;

  const propRate = stats.total_proposals > 0
    ? stats.accepted_proposals / stats.total_proposals : 0;

  return (
    <div>
      <SectionHeader title="Overview General" sub="Estado actual de la plataforma" />

      {/* KPI Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <KpiCard label="Clientes" value={fmt(stats.total_clients)} icon="users" accent="#004ac6" />
        <KpiCard label="Técnicos" value={fmt(stats.total_techs)} sub={`${stats.verified_techs} verificados`} icon="shield" accent="#7c3aed" />
        <KpiCard label="Solicitudes" value={fmt(stats.total_requests)} sub={`${stats.open_requests} abiertas`} icon="requests" accent="#0284c7" />
        <KpiCard label="Servicios totales" value={fmt(stats.total_services)} sub={`${stats.active_services} activos`} icon="services" accent="#d97706" />
        <KpiCard label="Completados" value={fmt(stats.completed_services)} icon="check" accent="#16a34a" />
        <KpiCard label="Propuestas" value={fmt(stats.total_proposals)} sub={`${stats.accepted_proposals} aceptadas`} icon="requests" accent="#0284c7" />
        <KpiCard label="Verificaciones pend." value={stats.pending_verifications} icon="alert" accent="#dc2626" />
        <KpiCard label="Rating promedio" value={`${stats.avg_rating} ⭐`} sub={`${stats.total_reviews} reseñas`} icon="star" accent="#d97706" />
      </div>

      {/* Progress bars */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', color: '#191c1e' }}>Conversión de Propuestas</h3>
          <ProgressBar label="Tasa de aceptación" value={propRate} color="#004ac6" />
          <ProgressBar label="Técnicos verificados" value={stats.total_techs > 0 ? stats.verified_techs / stats.total_techs : 0} color="#7c3aed" />
          <ProgressBar label="Servicios completados" value={stats.total_services > 0 ? stats.completed_services / stats.total_services : 0} color="#16a34a" />
        </div>
        <div className="card" style={{ padding: '1.5rem' }}>
          <h3 style={{ fontSize: '1rem', fontWeight: 700, marginBottom: '1.25rem', color: '#191c1e' }}>Actividad de la Plataforma</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            {[
              { label: 'Solicitudes abiertas', value: stats.open_requests, total: stats.total_requests, color: '#0284c7' },
              { label: 'Servicios activos',    value: stats.active_services, total: stats.total_services, color: '#d97706' },
            ].map(({ label, value, total, color }) => (
              <div key={label} style={{ textAlign: 'center', padding: '1rem', background: '#f7f9fb', borderRadius: '0.75rem' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 800, color }}>{value}</div>
                <div style={{ fontSize: '0.8rem', color: '#505f76', marginTop: '0.25rem' }}>{label}</div>
                <div style={{ fontSize: '0.75rem', color: '#94a3b8' }}>de {total} total</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION: MÉTRICAS AARRR
// ══════════════════════════════════════════════════════════════════════════════
function MetricsSection() {
  const [metrics, setMetrics] = useState<MetricsDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchMetricsDashboard()
      .then(setMetrics)
      .catch(() => setError('No se pudo cargar las métricas'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
      {Array.from({ length: 4 }).map((_, i) => <SkeletonCard key={i} />)}
    </div>
  );
  if (error) return <div className="alert alert-error">{error}</div>;
  if (!metrics) return null;

  const metricGroups = [
    {
      title: '📥 Acquisition — Adquisición',
      color: '#004ac6',
      items: [
        { label: 'Conversión registro clientes', value: metrics.acquisition_client_rate },
        { label: 'Conversión registro técnicos', value: metrics.acquisition_tech_rate },
      ],
    },
    {
      title: '⚡ Activation — Activación',
      color: '#7c3aed',
      items: [
        { label: 'Clientes con al menos 1 propuesta aceptada', value: metrics.activation_client_rate },
        { label: 'Técnicos con 1ª propuesta aceptada', value: metrics.activation_tech_rate },
      ],
    },
    {
      title: '🔄 Retention — Retención',
      color: '#0284c7',
      items: [
        { label: 'Recurrencia de clientes (≥2 servicios)', value: metrics.retention_client_recurrence_rate },
        { label: 'Técnicos activos 4x/semana', value: metrics.retention_tech_login_4x_rate },
      ],
    },
    {
      title: '👤 Clientes — Comportamiento',
      color: '#d97706',
      items: [
        { label: 'Solicitudes por cliente (promedio)', value: metrics.request_creation_rate, max: 3, unit: '' },
        { label: 'Aceptación de propuestas',           value: metrics.proposal_acceptance_rate },
        { label: 'Abandono al ver ofertas',            value: metrics.client_offer_abandonment_rate },
        { label: 'Revisita historial post-servicio',   value: metrics.history_view_avg_7d, max: 5, unit: '' },
      ],
    },
    {
      title: '🔧 Técnicos — Comportamiento',
      color: '#dc2626',
      items: [
        { label: 'Completitud de perfil (docs)',        value: metrics.tech_profile_completion_rate },
        { label: 'Propuestas en 1ª semana (promedio)',  value: metrics.avg_proposals_first_week, max: 5, unit: '' },
        { label: 'Logins por semana (promedio)',        value: metrics.tech_weekly_login_avg, max: 7, unit: '' },
        { label: 'Abandono en carga de archivos',       value: metrics.file_upload_abandonment_rate },
      ],
    },
  ];

  return (
    <div>
      <SectionHeader title="Métricas AARRR" sub="Indicadores clave de crecimiento y comportamiento" />

      {/* Revenue hero */}
      <div className="card animate-fade-in" style={{
        padding: '2rem', marginBottom: '2rem',
        background: 'linear-gradient(135deg, #004ac6 0%, #7c3aed 100%)',
        color: 'white', borderRadius: '1rem'
      }}>
        <p style={{ fontSize: '0.85rem', fontWeight: 500, opacity: 0.8, textTransform: 'uppercase', letterSpacing: '0.06em' }}>
          💰 Revenue — Ingresos Totales
        </p>
        <p style={{ fontSize: '3rem', fontWeight: 900, margin: '0.5rem 0' }}>
          S/ {metrics.total_revenue.toLocaleString('es-PE', { minimumFractionDigits: 2 })}
        </p>
        <p style={{ opacity: 0.7, fontSize: '0.875rem' }}>Comisiones acumuladas en la plataforma</p>
      </div>

      {/* Metric groups grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: '1.5rem' }}>
        {metricGroups.map(({ title, color, items }) => (
          <div key={title} className="card" style={{ padding: '1.5rem' }}>
            <h3 style={{ fontSize: '0.95rem', fontWeight: 700, color, marginBottom: '1.25rem' }}>{title}</h3>
            {items.map(item => (
              <ProgressBar
                key={item.label}
                label={item.label}
                value={item.value}
                color={color}
                max={(item as any).max ?? 1}
              />
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION: VERIFICACIONES
// ══════════════════════════════════════════════════════════════════════════════
function VerifySection() {
  const [techs, setTechs] = useState<PendingTech[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<'pending' | 'verified' | 'rejected'>('pending');
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  const load = useCallback((status: 'pending' | 'verified' | 'rejected') => {
    setLoading(true);
    fetchPendingTechs(status).then(setTechs).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(filterStatus); }, [filterStatus, load]);

  const handleVerify = async (techId: string, status: 'verified' | 'rejected') => {
    setActionLoading(techId + status);
    try {
      await verifyTech(techId, status);
      setToast(status === 'verified' ? '✅ Técnico aprobado' : '❌ Técnico rechazado');
      setTechs(prev => prev.filter(t => t.user_id !== techId));
      setTimeout(() => setToast(''), 3000);
    } catch {
      setToast('Error al actualizar. Intenta de nuevo.');
      setTimeout(() => setToast(''), 3000);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div>
      <SectionHeader title="Verificación de Técnicos" sub="Revisar y aprobar documentos de identidad y certificados" />

      {/* Filter tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem' }}>
        {(['pending', 'verified', 'rejected'] as const).map(s => (
          <button
            key={s}
            onClick={() => setFilterStatus(s)}
            className={`btn btn-sm ${filterStatus === s ? 'btn-primary' : 'btn-ghost'}`}
          >
            {STATUS_LABEL[s]?.label ?? s}
          </button>
        ))}
      </div>

      {/* Toast */}
      {toast && (
        <div className="alert alert-success animate-fade-in" style={{ marginBottom: '1rem' }}>{toast}</div>
      )}

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : techs.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">🎉</div>
          <div className="empty-state-title">No hay técnicos en este estado</div>
          <div className="empty-state-desc">Todos los técnicos con estado "{filterStatus}" han sido procesados.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {techs.map(tech => {
            const badge = STATUS_LABEL[tech.verification_status];
            return (
              <div key={tech.user_id} className="card animate-fade-in" style={{ padding: '1.5rem' }}>
                {/* Header */}
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center', marginBottom: '1rem' }}>
                  <div style={{
                    width: 48, height: 48, borderRadius: '50%',
                    background: '#e8effe', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '1.25rem', fontWeight: 700, color: '#004ac6', flexShrink: 0,
                    overflow: 'hidden'
                  }}>
                    {tech.photo_url
                      ? <img src={tech.photo_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      : tech.full_name?.[0]?.toUpperCase() ?? '?'}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontWeight: 700, color: '#191c1e', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {tech.full_name || 'Sin nombre'}
                    </p>
                    <p style={{ fontSize: '0.8rem', color: '#505f76', margin: 0 }}>{tech.specialty ?? 'Sin especialidad'}</p>
                  </div>
                  <span className={`badge ${badge?.cls ?? 'badge-gray'}`}>{badge?.label}</span>
                </div>

                {/* Docs */}
                <div style={{ marginBottom: '1rem' }}>
                  <p style={{ fontSize: '0.78rem', fontWeight: 600, color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.5rem' }}>
                    Documentos
                  </p>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                    {[
                      { label: 'DNI (frente)', url: tech.dni_front_url },
                      { label: 'DNI (dorso)',  url: tech.dni_back_url  },
                      { label: 'Certificado', url: tech.cert_url       },
                    ].map(({ label, url }) => (
                      <div key={label} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '0.85rem', color: '#434655' }}>{label}</span>
                        {url
                          ? <a href={url} target="_blank" rel="noopener noreferrer"
                              className="btn btn-sm btn-secondary" style={{ fontSize: '0.75rem', padding: '0.2rem 0.6rem' }}>
                              Ver
                            </a>
                          : <span style={{ fontSize: '0.8rem', color: '#dc2626' }}>Sin subir</span>
                        }
                      </div>
                    ))}
                  </div>
                </div>

                {/* Actions */}
                {filterStatus === 'pending' && (
                  <div style={{ display: 'flex', gap: '0.5rem' }}>
                    <button
                      onClick={() => handleVerify(tech.user_id, 'verified')}
                      className="btn btn-sm btn-primary"
                      disabled={!!actionLoading}
                      style={{ flex: 1 }}
                    >
                      {actionLoading === tech.user_id + 'verified'
                        ? <span className="spinner" />
                        : <><Icon d={ICONS.check} size={14} /> Aprobar</>}
                    </button>
                    <button
                      onClick={() => handleVerify(tech.user_id, 'rejected')}
                      className="btn btn-sm btn-danger"
                      disabled={!!actionLoading}
                      style={{ flex: 1 }}
                    >
                      {actionLoading === tech.user_id + 'rejected'
                        ? <span className="spinner" />
                        : <><Icon d={ICONS.x} size={14} /> Rechazar</>}
                    </button>
                  </div>
                )}

                <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.75rem', textAlign: 'right' }}>
                  Registrado hace {ago(tech.created_at)}
                </p>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION: SOLICITUDES
// ══════════════════════════════════════════════════════════════════════════════
function RequestsSection() {
  const [requests, setRequests] = useState<AdminRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchAllRequests(filter || undefined).then(setRequests).finally(() => setLoading(false));
  }, [filter]);

  const CATEGORIES: Record<string, string> = {
    plomeria: 'Plomería', electricidad: 'Electricidad',
    aire_acondicionado: 'Aire Acond.', gas: 'Gas',
    electrodomesticos: 'Electrodomésticos', pintura: 'Pintura',
    carpinteria: 'Carpintería', cerrajeria: 'Cerrajería',
    jardineria: 'Jardinería', limpieza: 'Limpieza',
  };

  return (
    <div>
      <SectionHeader title="Solicitudes de Servicio" sub="Vista global de todas las solicitudes en la plataforma" />

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {['', 'open', 'closed', 'cancelled'].map(s => (
          <button key={s} onClick={() => { setLoading(true); setFilter(s); }}
            className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-ghost'}`}>
            {s === '' ? 'Todas' : STATUS_LABEL[s]?.label ?? s}
          </button>
        ))}
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 44, borderRadius: '0.5rem' }} />
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">📋</div>
            <div className="empty-state-title">Sin solicitudes</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f7f9fb', borderBottom: '1px solid #e6e8ea' }}>
                  {['Título', 'Categoría', 'Estado', 'Hace'].map(h => (
                    <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.78rem', fontWeight: 600, color: '#505f76', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {requests.map((r, i) => {
                  const s = STATUS_LABEL[r.status];
                  return (
                    <tr key={r.id} style={{ borderBottom: '1px solid #f2f4f6', background: i % 2 === 0 ? 'white' : '#fafbfc', transition: 'background 0.15s' }}>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.9rem', color: '#191c1e', fontWeight: 500, maxWidth: 220, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {r.title}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', color: '#434655' }}>
                        {CATEGORIES[r.category] ?? r.category}
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span className={`badge ${s?.cls ?? 'badge-gray'}`}>{s?.label ?? r.status}</span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#94a3b8' }}>
                        {ago(r.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION: SERVICIOS
// ══════════════════════════════════════════════════════════════════════════════
function ServicesSection() {
  const [services, setServices] = useState<AdminService[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('');

  useEffect(() => {
    fetchAllServices(filter || undefined).then(setServices).finally(() => setLoading(false));
  }, [filter]);

  return (
    <div>
      <SectionHeader title="Servicios" sub="Estado de todos los servicios contratados en la plataforma" />

      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {['', 'scheduled', 'in_progress', 'completed', 'cancelled'].map(s => (
          <button key={s} onClick={() => { setLoading(true); setFilter(s); }}
            className={`btn btn-sm ${filter === s ? 'btn-primary' : 'btn-ghost'}`}>
            {s === '' ? 'Todos' : STATUS_LABEL[s]?.label ?? s}
          </button>
        ))}
      </div>

      <div className="card" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton" style={{ height: 44, borderRadius: '0.5rem' }} />
            ))}
          </div>
        ) : services.length === 0 ? (
          <div className="empty-state">
            <div className="empty-state-icon">🔧</div>
            <div className="empty-state-title">Sin servicios</div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: '#f7f9fb', borderBottom: '1px solid #e6e8ea' }}>
                  {['ID', 'Estado', 'Inicio prog.', 'Creado hace'].map(h => (
                    <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.78rem', fontWeight: 600, color: '#505f76', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {services.map((s, i) => {
                  const st = STATUS_LABEL[s.status];
                  return (
                    <tr key={s.id} style={{ borderBottom: '1px solid #f2f4f6', background: i % 2 === 0 ? 'white' : '#fafbfc' }}>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#94a3b8', fontFamily: 'monospace' }}>
                        {s.id.slice(0, 8)}…
                      </td>
                      <td style={{ padding: '0.75rem 1rem' }}>
                        <span className={`badge ${st?.cls ?? 'badge-gray'}`}>{st?.label ?? s.status}</span>
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.85rem', color: '#434655' }}>
                        {s.scheduled_start ? new Date(s.scheduled_start).toLocaleDateString('es-PE') : '—'}
                      </td>
                      <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem', color: '#94a3b8' }}>
                        {ago(s.created_at)}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// SECTION: RECARGAS WALLET
// ══════════════════════════════════════════════════════════════════════════════
function RechargesSection() {
  const [recharges, setRecharges] = useState<AdminRecharge[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [toast, setToast] = useState('');

  const load = useCallback(() => {
    setLoading(true);
    fetchPendingRecharges().then(setRecharges).finally(() => setLoading(false));
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleAction = async (txId: string, action: 'approve' | 'reject') => {
    setActionLoading(txId + action);
    try {
      if (action === 'approve') await approveRecharge(txId);
      else await rejectRecharge(txId);
      
      setToast(action === 'approve' ? '✅ Recarga aprobada' : '❌ Recarga rechazada');
      setRecharges(prev => prev.filter(r => r.id !== txId));
      setTimeout(() => setToast(''), 3000);
    } catch {
      setToast('Error al procesar la recarga.');
      setTimeout(() => setToast(''), 3000);
    } finally {
      setActionLoading(null);
    }
  };

  return (
    <div>
      <SectionHeader title="Recargas Pendientes" sub="Verifica los pagos de Yape/Plin reportados por los técnicos" />

      {toast && (
        <div className="alert alert-success animate-fade-in" style={{ marginBottom: '1rem' }}>{toast}</div>
      )}

      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {Array.from({ length: 3 }).map((_, i) => <SkeletonCard key={i} />)}
        </div>
      ) : recharges.length === 0 ? (
        <div className="empty-state">
          <div className="empty-state-icon">💰</div>
          <div className="empty-state-title">No hay recargas pendientes</div>
          <div className="empty-state-desc">Todas las recargas han sido procesadas.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.25rem' }}>
          {recharges.map(r => (
            <div key={r.id} className="card animate-fade-in" style={{ padding: '1.5rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                <div>
                  <p style={{ fontWeight: 800, fontSize: '1.5rem', color: '#16a34a', margin: 0 }}>
                    S/ {r.amount.toFixed(2)}
                  </p>
                  <p style={{ fontSize: '0.85rem', color: '#505f76', margin: 0, marginTop: '0.2rem' }}>
                    <span style={{ fontWeight: 600 }}>Técnico ID:</span> {r.tech_id.slice(0, 8)}...
                  </p>
                </div>
                <span className="badge badge-amber">Pendiente</span>
              </div>

              <div style={{ background: '#f7f9fb', padding: '1rem', borderRadius: '0.5rem', marginBottom: '1rem' }}>
                <p style={{ fontSize: '0.8rem', color: '#434655', marginBottom: '0.25rem' }}>N° Operación Yape/Plin:</p>
                <p style={{ fontFamily: 'monospace', fontSize: '1.1rem', fontWeight: 600, color: '#191c1e', letterSpacing: '1px' }}>
                  {r.reference || 'N/A'}
                </p>
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <button
                  onClick={() => handleAction(r.id, 'approve')}
                  className="btn btn-sm btn-primary"
                  disabled={!!actionLoading}
                  style={{ flex: 1, background: '#16a34a' }}
                >
                  {actionLoading === r.id + 'approve' ? <span className="spinner" /> : 'Aprobar'}
                </button>
                <button
                  onClick={() => handleAction(r.id, 'reject')}
                  className="btn btn-sm btn-danger"
                  disabled={!!actionLoading}
                  style={{ flex: 1 }}
                >
                  {actionLoading === r.id + 'reject' ? <span className="spinner" /> : 'Rechazar'}
                </button>
              </div>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8', marginTop: '0.75rem', textAlign: 'center' }}>
                Reportada hace {ago(r.created_at)}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// MAIN: AdminDashboard
// ══════════════════════════════════════════════════════════════════════════════
export default function AdminDashboard() {
  const { user, signOut } = useAuth();
  const [activeSection, setActiveSection] = useState<Section>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const SECTION_MAP: Record<Section, React.ReactNode> = {
    overview: <OverviewSection />,
    metrics:  <MetricsSection />,
    verify:   <VerifySection />,
    requests: <RequestsSection />,
    services: <ServicesSection />,
    recharges:<RechargesSection />,
  };

  const SIDEBAR_W = sidebarOpen ? 240 : 64;

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f7f9fb', fontFamily: 'Inter, sans-serif' }}>

      {/* ── Sidebar ────────────────────────────────────────────────── */}
      <aside style={{
        width: SIDEBAR_W, minHeight: '100vh',
        background: '#0f172a',
        display: 'flex', flexDirection: 'column',
        transition: 'width 0.25s ease',
        position: 'fixed', top: 0, left: 0, bottom: 0,
        zIndex: 100, flexShrink: 0,
        boxShadow: '4px 0 24px rgba(0,0,0,0.15)',
      }}>
        {/* Logo */}
        <div style={{
          padding: sidebarOpen ? '1.25rem 1.25rem' : '1.25rem 0',
          borderBottom: '1px solid rgba(255,255,255,0.07)',
          display: 'flex', alignItems: 'center', justifyContent: sidebarOpen ? 'space-between' : 'center',
          gap: '0.75rem',
        }}>
          {sidebarOpen && (
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div style={{ width: 28, height: 28, borderRadius: '8px', background: 'linear-gradient(135deg, #004ac6, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <Icon d={ICONS.shield} color="white" size={14} />
                </div>
                <span style={{ fontSize: '0.95rem', fontWeight: 800, color: 'white' }}>TécnicoAdmin</span>
              </div>
              <span style={{ fontSize: '0.7rem', color: '#64748b', marginTop: '0.1rem', display: 'block' }}>Panel de Control</span>
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(o => !o)}
            style={{ background: 'rgba(255,255,255,0.07)', border: 'none', borderRadius: '8px', width: 32, height: 32, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', flexShrink: 0 }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d={sidebarOpen ? 'M15 18l-6-6 6-6' : 'M9 18l6-6-6-6'} />
            </svg>
          </button>
        </div>

        {/* Nav */}
        <nav style={{ flex: 1, padding: '0.75rem 0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
          {NAV_ITEMS.map(({ id, label, icon }) => {
            const active = activeSection === id;
            return (
              <button
                key={id}
                onClick={() => setActiveSection(id)}
                title={!sidebarOpen ? label : undefined}
                style={{
                  display: 'flex', alignItems: 'center', gap: '0.75rem',
                  padding: sidebarOpen ? '0.625rem 0.875rem' : '0.625rem',
                  justifyContent: sidebarOpen ? 'flex-start' : 'center',
                  borderRadius: '0.625rem', border: 'none', cursor: 'pointer', width: '100%',
                  background: active ? 'rgba(0,74,198,0.35)' : 'transparent',
                  color: active ? 'white' : 'rgba(255,255,255,0.5)',
                  fontWeight: active ? 600 : 400,
                  fontSize: '0.9rem',
                  transition: 'all 0.15s',
                  position: 'relative',
                }}
                onMouseEnter={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.06)'; }}
                onMouseLeave={e => { if (!active) (e.currentTarget as HTMLElement).style.background = 'transparent'; }}
              >
                {active && (
                  <div style={{ position: 'absolute', left: 0, top: '20%', bottom: '20%', width: 3, background: '#004ac6', borderRadius: '0 4px 4px 0' }} />
                )}
                <Icon d={ICONS[icon]} size={18} color={active ? 'white' : 'rgba(255,255,255,0.5)'} />
                {sidebarOpen && <span>{label}</span>}
              </button>
            );
          })}
        </nav>

        {/* User + logout */}
        <div style={{ padding: '1rem 0.75rem', borderTop: '1px solid rgba(255,255,255,0.07)' }}>
          {sidebarOpen && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.75rem' }}>
              <div style={{ width: 36, height: 36, borderRadius: '50%', background: 'linear-gradient(135deg, #004ac6, #7c3aed)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.9rem', fontWeight: 700, color: 'white', flexShrink: 0 }}>
                {user?.email?.[0]?.toUpperCase() ?? 'A'}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'white', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {user?.email ?? 'Admin'}
                </p>
                <p style={{ fontSize: '0.7rem', color: '#64748b', margin: 0 }}>Administrador</p>
              </div>
            </div>
          )}
          <button
            onClick={signOut}
            title="Cerrar sesión"
            style={{
              width: '100%', display: 'flex', alignItems: 'center', justifyContent: sidebarOpen ? 'flex-start' : 'center',
              gap: '0.5rem', padding: '0.5rem 0.75rem', background: 'rgba(220,38,38,0.12)',
              border: '1px solid rgba(220,38,38,0.2)', borderRadius: '0.5rem', cursor: 'pointer', color: '#f87171', fontSize: '0.85rem', fontWeight: 500,
            }}
          >
            <Icon d={ICONS.logout} size={16} color="#f87171" />
            {sidebarOpen && 'Cerrar sesión'}
          </button>
        </div>
      </aside>

      {/* ── Main Content ───────────────────────────────────────────── */}
      <main style={{ flex: 1, marginLeft: SIDEBAR_W, transition: 'margin-left 0.25s ease', minWidth: 0 }}>
        {/* Top bar */}
        <div style={{
          background: 'white', borderBottom: '1px solid #e6e8ea',
          padding: '1rem 2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          position: 'sticky', top: 0, zIndex: 50, boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
        }}>
          <div>
            <h1 style={{ fontSize: '1.1rem', fontWeight: 700, color: '#191c1e', margin: 0 }}>
              {NAV_ITEMS.find(n => n.id === activeSection)?.label ?? 'Panel Admin'}
            </h1>
            <p style={{ fontSize: '0.78rem', color: '#94a3b8', margin: 0 }}>
              {new Date().toLocaleDateString('es-PE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <span className="badge badge-blue">Admin</span>
          </div>
        </div>

        {/* Page body */}
        <div style={{ padding: '2rem', maxWidth: 1280, margin: '0 auto' }}>
          {SECTION_MAP[activeSection]}
        </div>
      </main>
    </div>
  );
}
