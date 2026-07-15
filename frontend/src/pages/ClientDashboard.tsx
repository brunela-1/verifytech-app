import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Plus, Clock, FileText, ClipboardList, Zap, ChevronRight } from 'lucide-react';
import TopNavBar from '../components/TopNavBar';
import RequestCard from '../components/RequestCard';
import { useAuth } from '../store/AuthContext';
import { getMyRequests } from '../api/requests';
import { getMyServices } from '../api/services';
import type { ServiceRequestData, ServiceData } from '../types';

const serviceStatusConfig: Record<string, { label: string; color: string }> = {
  scheduled:   { label: 'Programado',  color: 'bg-[#004ac6]/10 text-[#004ac6]' },
  in_progress: { label: 'En Progreso', color: 'bg-[#d97706]/10 text-[#d97706]' },
};

export default function ClientDashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [requests, setRequests] = useState<ServiceRequestData[]>([]);
  const [services, setServices] = useState<ServiceData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [reqRes, svcRes] = await Promise.all([
          getMyRequests(),
          getMyServices(),
        ]);
        setRequests(reqRes.data);
        setServices(svcRes.data);
      } catch (err) {
        console.error('Error fetching dashboard data', err);
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, []);

  const displayName = user?.user_metadata?.full_name ?? user?.email?.split('@')[0] ?? 'Cliente';
  const activeServices = services.filter(s => s.status === 'scheduled' || s.status === 'in_progress');
  const activeRequests = requests.filter(r => r.status === 'open');

  return (
    <div className="min-h-screen bg-[#f7f9fb]">
      <TopNavBar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-[#191c1e] tracking-tight">
              Bienvenido, {displayName}!
            </h1>
            <p className="text-[#505f76] mt-1">
              ¿En qué podemos ayudarte hoy?
            </p>
          </div>
          <button
            onClick={() => navigate('/requests/new')}
            className="btn btn-primary btn-lg whitespace-nowrap shadow-md"
          >
            <Plus className="w-5 h-5" />
            Nueva Solicitud
          </button>
        </div>

        {/* Stats Row */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="h-24 bg-white rounded-2xl animate-pulse border border-[#eceef0]"></div>
            <div className="h-24 bg-white rounded-2xl animate-pulse border border-[#eceef0]"></div>
            <div className="h-24 bg-white rounded-2xl animate-pulse border border-[#eceef0]"></div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
            <div className="card p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#004ac6]/10 flex items-center justify-center">
                <FileText className="w-6 h-6 text-[#004ac6]" />
              </div>
              <div>
                <p className="text-2xl font-black text-[#191c1e]">{activeRequests.length}</p>
                <p className="text-xs font-medium text-[#505f76] mt-0.5">Solicitudes Abiertas</p>
              </div>
            </div>

            <div className="card p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#16a34a]/10 flex items-center justify-center">
                <Zap className="w-6 h-6 text-[#16a34a]" />
              </div>
              <div>
                <p className="text-2xl font-black text-[#191c1e]">{activeServices.length}</p>
                <p className="text-xs font-medium text-[#505f76] mt-0.5">Servicios Activos</p>
              </div>
            </div>

            <div className="card p-5 flex items-center gap-4">
              <div className="w-12 h-12 rounded-xl bg-[#d97706]/10 flex items-center justify-center">
                <ClipboardList className="w-6 h-6 text-[#d97706]" />
              </div>
              <div>
                <p className="text-2xl font-black text-[#191c1e]">{requests.length}</p>
                <p className="text-xs font-medium text-[#505f76] mt-0.5">Total Solicitudes</p>
              </div>
            </div>
          </div>
        )}

        {/* Active Services */}
        {!loading && activeServices.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-[#191c1e] flex items-center gap-2">
                <Zap className="w-5 h-5 text-[#16a34a]" />
                Servicios en Curso
              </h2>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {activeServices.map(svc => {
                const cfg = serviceStatusConfig[svc.status] ?? { label: svc.status, color: 'bg-gray-100 text-gray-600' };
                return (
                  <div
                    key={svc.id}
                    className="bg-white rounded-2xl border border-[#eceef0] p-5 shadow-sm hover:shadow-md hover:border-[#004ac6]/30 transition-all cursor-pointer"
                    onClick={() => navigate(`/services/${svc.id}`)}
                  >
                    <div className="flex items-center justify-between mb-3">
                      <span className={`text-xs font-bold px-2.5 py-1 rounded-full ${cfg.color}`}>
                        {cfg.label}
                      </span>
                      <ChevronRight className="w-4 h-4 text-[#94a3b8]" />
                    </div>
                    <p className="font-bold text-[#191c1e]">Servicio #{svc.id.slice(0, 8)}</p>
                    {svc.scheduled_start && (
                      <p className="text-xs text-[#505f76] mt-1 flex items-center gap-1">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(svc.scheduled_start).toLocaleString('es-PE', {
                          weekday: 'short', day: 'numeric', month: 'short',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </p>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold text-[#191c1e] flex items-center gap-2">
            <Clock className="w-5 h-5 text-[#004ac6]" />
            Mis Solicitudes Recientes
          </h2>
          <button
            onClick={() => navigate('/history')}
            className="text-sm font-semibold text-[#004ac6] hover:text-[#003ea8]"
          >
            Ver Historial
          </button>
        </div>

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3].map(i => (
              <div key={i} className="bg-white rounded-2xl h-32 animate-pulse border border-[#eceef0]"></div>
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="empty-state bg-white rounded-2xl border border-[#eceef0] shadow-sm">
            <span className="empty-state-icon">📋</span>
            <h3 className="empty-state-title">No tienes solicitudes</h3>
            <p className="empty-state-desc mb-6">
              Crea tu primera solicitud para encontrar al técnico ideal para tu hogar.
            </p>
            <button
              onClick={() => navigate('/requests/new')}
              className="btn btn-primary"
            >
              <Plus className="w-4 h-4" />
              Crear mi primera solicitud
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {requests.slice(0, 6).map(req => (
              <RequestCard
                key={req.id}
                request={req}
                onClick={() => navigate(`/requests/${req.id}`)}
              />
            ))}
          </div>
        )}

      </main>
    </div>
  );
}
