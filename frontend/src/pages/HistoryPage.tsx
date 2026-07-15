import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import TopNavBar from '../components/TopNavBar';
import { getServiceHistory } from '../api/services';
import { useAuth } from '../store/AuthContext';
import { ChevronRight, Calendar, CheckCircle, XCircle, Star } from 'lucide-react';
import type { ServiceData } from '../types';

const statusConfig: Record<string, { label: string; icon: React.ReactNode; cls: string; bg: string }> = {
  completed: {
    label: 'Completado',
    icon: <CheckCircle className="w-4 h-4" />,
    cls: 'text-[#16a34a]',
    bg: 'bg-[#16a34a]/10 border-[#16a34a]/30',
  },
  cancelled: {
    label: 'Cancelado',
    icon: <XCircle className="w-4 h-4" />,
    cls: 'text-[#dc2626]',
    bg: 'bg-[#dc2626]/10 border-[#dc2626]/30',
  },
};

export default function HistoryPage() {
  const { role } = useAuth();
  const navigate = useNavigate();
  const [services, setServices] = useState<ServiceData[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'completed' | 'cancelled'>('all');

  useEffect(() => {
    getServiceHistory()
      .then(res => setServices(res.data))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const filtered = filter === 'all' ? services : services.filter(s => s.status === filter);

  const completedCount = services.filter(s => s.status === 'completed').length;
  const cancelledCount = services.filter(s => s.status === 'cancelled').length;

  return (
    <div className="min-h-screen bg-[#f7f9fb]">
      <TopNavBar title="Historial" showBack backTo={role === 'tech' ? '/tech/dashboard' : '/dashboard'} />

      <main className="max-w-4xl mx-auto px-4 py-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-black text-[#191c1e] tracking-tight">Historial</h1>
            <p className="text-[#505f76] mt-1">Todos tus servicios finalizados o cancelados</p>
          </div>
        </div>

        {/* Stats */}
        {!loading && services.length > 0 && (
          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="card p-4 text-center">
              <p className="text-3xl font-black text-[#191c1e]">{services.length}</p>
              <p className="text-xs font-medium text-[#505f76] mt-1">Total</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-3xl font-black text-[#16a34a]">{completedCount}</p>
              <p className="text-xs font-medium text-[#505f76] mt-1">Completados</p>
            </div>
            <div className="card p-4 text-center">
              <p className="text-3xl font-black text-[#dc2626]">{cancelledCount}</p>
              <p className="text-xs font-medium text-[#505f76] mt-1">Cancelados</p>
            </div>
          </div>
        )}

        {/* Filter tabs */}
        {!loading && services.length > 0 && (
          <div className="flex gap-1 p-1 bg-[#eceef0] rounded-xl mb-6 w-fit">
            {(['all', 'completed', 'cancelled'] as const).map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 text-sm font-semibold rounded-lg transition-all ${
                  filter === f
                    ? 'bg-white text-[#004ac6] shadow-sm'
                    : 'text-[#505f76] hover:text-[#191c1e]'
                }`}
              >
                {f === 'all' ? 'Todos' : f === 'completed' ? 'Completados' : 'Cancelados'}
              </button>
            ))}
          </div>
        )}

        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="bg-white rounded-2xl h-24 animate-pulse border border-[#eceef0]" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state bg-white border border-[#eceef0] rounded-2xl py-16">
            <span className="empty-state-icon">📂</span>
            <p className="font-semibold text-[#191c1e]">
              {services.length === 0 ? 'No hay servicios en el historial' : 'Sin resultados para este filtro'}
            </p>
            <p className="text-sm text-[#505f76] mt-1">
              {services.length === 0
                ? 'Los servicios completados o cancelados aparecerán aquí.'
                : 'Prueba seleccionando otro filtro.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map(s => {
              const cfg = statusConfig[s.status];
              return (
                <div
                  key={s.id}
                  className="bg-white rounded-2xl border border-[#eceef0] shadow-sm hover:shadow-md hover:border-[#004ac6]/20 transition-all duration-200"
                >
                  <div className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-start gap-4">
                      <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 border ${cfg.bg}`}>
                        <span className={cfg.cls}>{cfg.icon}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <span className={`text-xs font-bold ${cfg.cls}`}>{cfg.label}</span>
                          {s.status === 'completed' && role === 'client' && (
                            <span className="flex items-center gap-0.5 text-[10px] text-amber-500 font-semibold bg-amber-50 px-1.5 py-0.5 rounded-full border border-amber-200">
                              <Star className="w-3 h-3 fill-amber-400" />
                              Calificar
                            </span>
                          )}
                        </div>
                        <p className="font-bold text-[#191c1e]">Servicio #{s.id.slice(0, 12)}…</p>
                        <p className="text-xs text-[#94a3b8] flex items-center gap-1 mt-0.5">
                          <Calendar className="w-3.5 h-3.5" />
                          {s.created_at ? new Date(s.created_at).toLocaleDateString('es-PE', {
                            day: '2-digit', month: 'long', year: 'numeric'
                          }) : '—'}
                        </p>
                      </div>
                    </div>

                    <div className="flex gap-2 shrink-0">
                      {s.status === 'completed' && role === 'client' && (
                        <button
                          onClick={() => navigate(`/services/${s.id}/review`)}
                          className="flex items-center gap-1.5 bg-amber-50 hover:bg-amber-100 text-amber-700 font-semibold text-sm px-3 py-2 rounded-xl border border-amber-200 transition-colors"
                        >
                          <Star className="w-4 h-4" />
                          Calificar
                        </button>
                      )}
                      <button
                        onClick={() => navigate(role === 'tech' ? `/tech/services/${s.id}` : `/services/${s.id}`)}
                        className="btn btn-secondary btn-sm"
                      >
                        Ver Detalle
                        <ChevronRight className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
