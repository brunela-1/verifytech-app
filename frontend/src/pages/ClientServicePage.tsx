import { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import TopNavBar from '../components/TopNavBar';
import ServiceStatusStepper from '../components/ServiceStatusStepper';
import { getService, updateServiceStatus } from '../api/services';
import { getRequest } from '../api/requests';
import { getTechPublic } from '../api/techs';
import type { ServiceData, ServiceRequestData, TechProfileData } from '../types';
import { MapPin, Calendar, Clock, User, Star, XCircle } from 'lucide-react';

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 p-3 bg-[#f7f9fb] rounded-xl">
      <span className="text-[#004ac6] mt-0.5 shrink-0">{icon}</span>
      <div>
        <p className="text-[#505f76] text-xs font-medium">{label}</p>
        <p className="text-[#191c1e] text-sm font-semibold mt-0.5">{value}</p>
      </div>
    </div>
  );
}

export default function ClientServicePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [service, setService] = useState<ServiceData | null>(null);
  const [request, setRequest] = useState<ServiceRequestData | null>(null);
  const [tech, setTech] = useState<TechProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [cancelling, setCancelling] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    getService(id)
      .then(async (res) => {
        const svc: ServiceData = res.data;
        console.log('Service loaded:', svc);
        setService(svc);

        // Load related data in parallel
        try {
          await Promise.allSettled([
            getRequest(svc.request_id).then(r => {
              console.log('Request loaded:', r.data);
              setRequest(r.data);
            }).catch((err) => {
              console.error('Error loading request:', err);
            }),
            getTechPublic(svc.tech_id).then(r => {
              console.log('Tech loaded:', r.data);
              setTech(r.data);
            }).catch((err) => {
              console.error('Error loading tech:', err);
            }),
          ]);
        } catch (err) {
          console.error('Error loading related data:', err);
        }
      })
      .catch((err) => {
        console.error('Error loading service:', err);
        setError(err.response?.data?.detail || 'No pudimos cargar el servicio. Intenta nuevamente.');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleCancel = async () => {
    if (!id || !service) return;
    if (!confirm('¿Estás seguro de que deseas cancelar este servicio?')) return;
    setCancelling(true);
    try {
      await updateServiceStatus(id, 'cancelled');
      setService((prev) => prev ? { ...prev, status: 'cancelled' } : prev);
    } catch {
      alert('No se pudo cancelar el servicio.');
    } finally {
      setCancelling(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('es-PE', {
      weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  if (loading) return (
    <div className="min-h-screen bg-[#f7f9fb] flex flex-col">
      <TopNavBar />
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <div className="w-12 h-12 border-4 border-[#004ac6] border-t-transparent rounded-full animate-spin" />
        <p className="text-[#505f76] font-medium">Cargando servicio...</p>
      </div>
    </div>
  );

  if (error || !service) return (
    <div className="min-h-screen bg-[#f7f9fb]">
      <TopNavBar />
      <div className="max-w-2xl mx-auto py-12 px-4 text-center">
        <XCircle className="w-14 h-14 text-red-400 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-[#191c1e] mb-2">No se pudo cargar</h2>
        <p className="text-[#505f76] mb-6">{error}</p>
        <button onClick={() => navigate('/dashboard')} className="btn btn-primary">
          Volver al inicio
        </button>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f7f9fb]">
      <TopNavBar title="Detalle del Servicio" showBack backTo="/dashboard" />

      <div className="max-w-2xl mx-auto px-4 py-8 space-y-5">

        {/* Stepper */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#e6e8ea] p-6">
          <h2 className="text-[#191c1e] font-bold text-base mb-5 text-center">Estado del servicio</h2>
          <ServiceStatusStepper status={service.status} />
        </div>

        {/* Service info */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#e6e8ea] p-6 space-y-4">
          <h3 className="text-[#191c1e] font-bold text-lg">
            {request?.title ?? 'Servicio'}
          </h3>

          {request?.category && (
            <div className="inline-flex items-center px-3 py-1 rounded-full bg-[#004ac6]/10 text-[#004ac6] text-xs font-semibold">
              {request.category}
            </div>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            {/* Tech info */}
            {tech ? (
              <div className="flex items-start gap-3 p-3 bg-[#004ac6]/5 border border-[#004ac6]/20 rounded-xl col-span-full">
                <div className="w-10 h-10 rounded-full bg-[#004ac6] flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {tech.photo_url
                    ? <img src={tech.photo_url} alt={tech.full_name} className="w-full h-full object-cover rounded-full" />
                    : tech.full_name.charAt(0).toUpperCase()
                  }
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-[#505f76] font-medium">Tu técnico</p>
                  <p className="text-sm font-bold text-[#191c1e]">{tech.full_name}</p>
                  {tech.specialty && (
                    <p className="text-xs text-[#505f76] mt-0.5">{tech.specialty}</p>
                  )}
                </div>
                <Link
                  to={`/techs/${service.tech_id}`}
                  className="text-xs font-semibold text-[#004ac6] hover:text-[#003ea8] whitespace-nowrap"
                >
                  Ver perfil →
                </Link>
              </div>
            ) : (
              <InfoRow icon={<User className="w-4 h-4" />} label="Técnico" value={`ID: ${service.tech_id.slice(0, 8)}…`} />
            )}

            <InfoRow icon={<Calendar className="w-4 h-4" />} label="ID Servicio" value={service.id.slice(0, 16) + '…'} />

            {service.scheduled_start && (
              <InfoRow icon={<Clock className="w-4 h-4" />} label="Inicio programado" value={formatDate(service.scheduled_start)} />
            )}
            {service.scheduled_end && (
              <InfoRow icon={<Clock className="w-4 h-4" />} label="Fin estimado" value={formatDate(service.scheduled_end)} />
            )}
            {request?.address && (
              <InfoRow icon={<MapPin className="w-4 h-4" />} label="Dirección" value={request.address} />
            )}
          </div>
        </div>

        {/* Action panel */}
        <div className="bg-white rounded-2xl shadow-sm border border-[#e6e8ea] p-6">
          {service.status === 'completed' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-[#16a34a]/10 border border-[#16a34a]/20 rounded-xl">
                <span className="text-2xl">🎉</span>
                <div>
                  <p className="text-[#16a34a] font-semibold">¡Servicio completado!</p>
                  <p className="text-[#505f76] text-sm">Ayuda a otros clientes compartiendo tu experiencia</p>
                </div>
              </div>
              <button
                onClick={() => navigate(`/services/${service.id}/review`)}
                className="w-full py-3 bg-[#004ac6] hover:bg-[#003ea8] text-white font-semibold rounded-xl transition-colors flex items-center justify-center gap-2"
              >
                <Star className="w-5 h-5" />
                Calificar Servicio
              </button>
            </div>
          )}

          {service.status === 'in_progress' && (
            <div className="flex items-center gap-3 p-4 bg-[#d97706]/10 border border-[#d97706]/20 rounded-xl">
              <div className="w-8 h-8 border-[3px] border-[#d97706] border-t-transparent rounded-full animate-spin flex-shrink-0" />
              <div>
                <p className="text-[#d97706] font-semibold">El técnico está trabajando...</p>
                <p className="text-[#505f76] text-sm">Te notificaremos cuando finalice</p>
              </div>
            </div>
          )}

          {service.status === 'scheduled' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-[#004ac6]/10 border border-[#004ac6]/20 rounded-xl">
                <span className="text-2xl">📅</span>
                <div>
                  <p className="text-[#004ac6] font-semibold">Servicio agendado</p>
                  {service.scheduled_start
                    ? <p className="text-[#505f76] text-sm">{formatDate(service.scheduled_start)}</p>
                    : <p className="text-[#505f76] text-sm">Coordina el horario con el técnico</p>
                  }
                </div>
              </div>
              <button
                onClick={handleCancel}
                disabled={cancelling}
                className="w-full py-2.5 border-2 border-[#dc2626] text-[#dc2626] hover:bg-[#dc2626] hover:text-white font-semibold rounded-xl transition-colors disabled:opacity-50"
              >
                {cancelling ? 'Cancelando...' : '✕ Cancelar Servicio'}
              </button>
            </div>
          )}

          {service.status === 'cancelled' && (
            <div className="flex items-center gap-3 p-4 bg-[#dc2626]/10 border border-[#dc2626]/20 rounded-xl">
              <XCircle className="w-7 h-7 text-[#dc2626] shrink-0" />
              <div>
                <p className="text-[#dc2626] font-semibold">Servicio Cancelado</p>
                <p className="text-[#505f76] text-sm">Este servicio fue cancelado</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
