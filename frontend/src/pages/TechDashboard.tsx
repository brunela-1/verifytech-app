import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import {
  Briefcase, Send, Zap, MapPin, Tag, ChevronRight,
  Clock, CheckCircle, XCircle, Loader2, CalendarDays, User
} from 'lucide-react';
import TopNavBar from '../components/TopNavBar';
import { useAuth } from '../store/AuthContext';
import { getAvailableRequests } from '../api/requests';
import { getMyProposals } from '../api/proposals';
import { getMyServices } from '../api/services';
import type { ServiceRequestData, ProposalData, ServiceData } from '../types/index';
import { CATEGORIES } from '../types/index';

// ─── Helpers ────────────────────────────────────────────────────────────────

const categoryLabel = (key: string) =>
  CATEGORIES.find(c => c.key === key)?.label ?? key;

const categoryEmoji: Record<string, string> = {
  plomeria: '🔧', electricidad: '⚡', aire_acondicionado: '❄️',
  gas: '🔥', electrodomesticos: '🍳', pintura: '🎨',
  carpinteria: '🪵', cerrajeria: '🔐', jardineria: '🌿', limpieza: '🧹',
};

const proposalStatusConfig = {
  sent:     { label: 'Enviada',  color: 'bg-[#004ac6]/10 text-[#004ac6]' },
  accepted: { label: 'Aceptada', color: 'bg-[#16a34a]/10 text-[#16a34a]' },
  rejected: { label: 'Rechazada', color: 'bg-[#dc2626]/10 text-[#dc2626]' },
};

const serviceStatusConfig = {
  scheduled:   { label: 'Programado',  color: 'bg-[#d97706]/10 text-[#d97706]' },
  in_progress: { label: 'En Progreso', color: 'bg-[#004ac6]/10 text-[#004ac6]' },
  completed:   { label: 'Completado',  color: 'bg-[#16a34a]/10 text-[#16a34a]' },
  cancelled:   { label: 'Cancelado',   color: 'bg-[#dc2626]/10 text-[#dc2626]' },
};

// ─── Stat Card ───────────────────────────────────────────────────────────────

interface StatCardProps {
  icon: React.ReactNode;
  label: string;
  value: number | string;
  color: string;
}
function StatCard({ icon, label, value, color }: StatCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-[#eceef0] p-5 flex items-center gap-4 hover:shadow-md transition-shadow">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        {icon}
      </div>
      <div>
        <p className="text-2xl font-black text-[#191c1e]">{value}</p>
        <p className="text-xs font-medium text-[#505f76] mt-0.5">{label}</p>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────────────

export default function TechDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [jobs, setJobs] = useState<ServiceRequestData[]>([]);
  const [proposals, setProposals] = useState<ProposalData[]>([]);
  const [services, setServices] = useState<ServiceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const displayName =
    user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? 'Técnico';

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      setError(null);
      try {
        const [jobsRes, proposalsRes, servicesRes] = await Promise.all([
          getAvailableRequests(),
          getMyProposals(),
          getMyServices(),
        ]);
        // Defensive: always ensure we have arrays, even if backend returns unexpected data
        const jobsData = Array.isArray(jobsRes.data) ? jobsRes.data : [];
        const proposalsData = Array.isArray(proposalsRes.data) ? proposalsRes.data : [];
        const servicesData = Array.isArray(servicesRes.data) ? servicesRes.data : [];
        console.log('Jobs:', jobsData);
        console.log('Proposals:', proposalsData);
        console.log('Services:', servicesData);
        setJobs(jobsData as ServiceRequestData[]);
        setProposals(proposalsData as ProposalData[]);
        setServices(servicesData as ServiceData[]);
      } catch (err) {
        console.error('Error loading dashboard data:', err);
        setError('No se pudo cargar la información. Intenta de nuevo.');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);


  const activeServices = services.filter(
    s => s.status === 'scheduled' || s.status === 'in_progress'
  );

  return (
    <div className="min-h-screen bg-[#f7f9fb]">
      <TopNavBar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* ── Header greeting ─────────────────────────────────────────── */}
        <div className="mb-8">
          <h1 className="text-3xl font-black text-[#191c1e] tracking-tight">
            Panel del Técnico
          </h1>
          <p className="text-[#505f76] mt-1">
            Bienvenido de vuelta,{' '}
            <span className="font-semibold text-[#004ac6]">{displayName}</span>
          </p>
        </div>

        {/* ── Error banner ────────────────────────────────────────────── */}
        {error && (
          <div className="mb-6 p-4 bg-[#dc2626]/5 border border-[#dc2626]/20 rounded-xl text-[#dc2626] text-sm font-medium flex items-center gap-2">
            <XCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* ── Quick stats ─────────────────────────────────────────────── */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            {[1,2,3].map(i => (
              <div key={i} className="bg-white rounded-2xl h-24 animate-pulse border border-[#eceef0]" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <StatCard
              icon={<Briefcase className="w-6 h-6 text-[#004ac6]" />}
              label="Trabajos Disponibles"
              value={jobs.length}
              color="bg-[#004ac6]/10"
            />
            <StatCard
              icon={<Send className="w-6 h-6 text-[#d97706]" />}
              label="Propuestas Enviadas"
              value={proposals.length}
              color="bg-[#d97706]/10"
            />
            <StatCard
              icon={<Zap className="w-6 h-6 text-[#16a34a]" />}
              label="Servicios Activos"
              value={activeServices.length}
              color="bg-[#16a34a]/10"
            />
          </div>
        )}

        {/* ── Two-column layout ───────────────────────────────────────── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

          {/* ── Left: Available Jobs ──────────────────────────────────── */}
          <section className="lg:col-span-2">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[#191c1e] flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-[#004ac6]" />
                Trabajos Disponibles
              </h2>
              <span className="text-xs font-semibold text-[#505f76] bg-[#eceef0] px-2.5 py-1 rounded-full">
                {jobs.length} abiertos
              </span>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1,2,3].map(i => (
                  <div key={i} className="bg-white rounded-2xl h-32 animate-pulse border border-[#eceef0]" />
                ))}
              </div>
            ) : jobs.length === 0 ? (
              <div className="bg-white rounded-2xl border border-[#eceef0] p-10 text-center shadow-sm">
                <span className="text-5xl">📭</span>
                <p className="mt-4 font-semibold text-[#191c1e]">Sin trabajos disponibles</p>
                <p className="text-sm text-[#505f76] mt-1">
                  No hay solicitudes abiertas en este momento. ¡Vuelve pronto!
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {jobs.map(job => (
                  <div
                    key={job.id}
                    className="bg-white rounded-2xl border border-[#eceef0] p-5 shadow-sm hover:shadow-md hover:border-[#004ac6]/30 transition-all group"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex-1 min-w-0">
                        {/* Category badge */}
                        <span className="inline-flex items-center gap-1 text-xs font-bold px-2.5 py-1 rounded-full bg-[#004ac6]/8 text-[#004ac6] mb-2">
                          <span>{categoryEmoji[job.category] ?? '🛠️'}</span>
                          {categoryLabel(job.category)}
                        </span>

                        {/* Title */}
                        <h3 className="font-bold text-[#191c1e] text-base leading-snug truncate">
                          {job.title}
                        </h3>

                        {/* Address */}
                        {job.address && (
                          <p className="flex items-center gap-1 text-xs text-[#505f76] mt-1.5">
                            <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                            <span className="truncate">{job.address}</span>
                          </p>
                        )}

                        {/* Description preview */}
                        {job.description && (
                          <p className="text-sm text-[#434655] mt-2 line-clamp-2 leading-relaxed">
                            {job.description}
                          </p>
                        )}

                        {/* Proposals count */}
                        <p className="text-xs text-[#505f76] mt-2">
                          <span className="font-semibold text-[#191c1e]">{job.proposals_count}</span>{' '}
                          propuesta{job.proposals_count !== 1 ? 's' : ''} recibida{job.proposals_count !== 1 ? 's' : ''}
                        </p>
                      </div>

                      {/* CTA */}
                      <button
                        onClick={() => navigate(`/tech/jobs/${job.id}`)}
                        className="flex-shrink-0 flex items-center gap-1.5 bg-[#004ac6] text-white text-sm font-semibold px-4 py-2 rounded-xl hover:bg-[#003ea8] active:scale-95 transition-all"
                      >
                        Ver Detalles
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* ── Right: Sidebar ────────────────────────────────────────── */}
          <aside className="space-y-6">

            {/* My proposals */}
            <div>
              <h2 className="text-xl font-bold text-[#191c1e] flex items-center gap-2 mb-4">
                <Send className="w-5 h-5 text-[#d97706]" />
                Mis Propuestas
              </h2>

              {loading ? (
                <div className="space-y-2">
                  {[1,2,3].map(i => (
                    <div key={i} className="bg-white rounded-xl h-14 animate-pulse border border-[#eceef0]" />
                  ))}
                </div>
              ) : proposals.length === 0 ? (
                <div className="bg-white rounded-2xl border border-[#eceef0] p-6 text-center shadow-sm">
                  <span className="text-3xl">📋</span>
                  <p className="mt-2 text-sm font-semibold text-[#191c1e]">Sin propuestas aún</p>
                  <p className="text-xs text-[#505f76] mt-1">
                    Explora los trabajos disponibles y envía tu primera propuesta.
                  </p>
                </div>
              ) : (
                <div className="space-y-2">
                  {proposals.slice(0, 6).map(proposal => {
                    const cfg = proposalStatusConfig[proposal.status];
                    return (
                      <div
                        key={proposal.id}
                        className="bg-white rounded-xl border border-[#eceef0] px-4 py-3 flex items-center justify-between gap-3 shadow-sm hover:shadow-md transition-shadow"
                      >
                        <div className="min-w-0">
                          <p className="text-xs font-semibold text-[#191c1e] truncate">
                            Solicitud #{proposal.request_id.slice(0, 8)}
                          </p>
                          <p className="text-xs text-[#505f76] mt-0.5">
                            S/ {Number(proposal.price).toFixed(2)}
                          </p>
                        </div>
                        <span className={`flex-shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full ${cfg.color}`}>
                          {cfg.label}
                        </span>
                      </div>
                    );
                  })}
                  {proposals.length > 6 && (
                    <p className="text-xs text-center text-[#505f76] pt-1">
                      +{proposals.length - 6} más
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* My active services */}
            {!loading && activeServices.length > 0 && (
              <div>
                <h2 className="text-xl font-bold text-[#191c1e] flex items-center gap-2 mb-4">
                  <Zap className="w-5 h-5 text-[#16a34a]" />
                  Servicios Activos
                </h2>
                <div className="space-y-2">
                  {activeServices.map(svc => {
                    const cfg = serviceStatusConfig[svc.status];
                    return (
                      <div
                        key={svc.id}
                        className="bg-white rounded-xl border border-[#eceef0] px-4 py-3 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
                        onClick={() => navigate(`/tech/services/${svc.id}`)}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <p className="text-xs font-semibold text-[#191c1e] truncate">
                            Servicio #{svc.id.slice(0, 8)}
                          </p>
                          <span className={`flex-shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full ${cfg.color}`}>
                            {cfg.label}
                          </span>
                        </div>
                        {svc.scheduled_start && (
                          <p className="text-xs text-[#505f76] mt-1 flex items-center gap-1">
                            <CalendarDays className="w-3 h-3" />
                            {new Date(svc.scheduled_start).toLocaleString('es-PE', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Quick links */}
            <div>
              <h2 className="text-base font-bold text-[#191c1e] mb-3">Acceso Rápido</h2>
              <div className="space-y-2">
                <Link
                  to="/history"
                  className="flex items-center gap-3 bg-white rounded-xl border border-[#eceef0] px-4 py-3.5 shadow-sm hover:shadow-md hover:border-[#004ac6]/30 hover:text-[#004ac6] transition-all group"
                >
                  <CheckCircle className="w-5 h-5 text-[#004ac6] flex-shrink-0" />
                  <span className="text-sm font-semibold text-[#191c1e] group-hover:text-[#004ac6]">Historial</span>
                  <ChevronRight className="w-4 h-4 ml-auto text-[#505f76] group-hover:text-[#004ac6]" />
                </Link>
              </div>
            </div>

          </aside>
        </div>
      </main>
    </div>
  );
}
