import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TopNavBar from '../components/TopNavBar';
import ServiceStatusStepper from '../components/ServiceStatusStepper';
import { getService, updateServiceStatus } from '../api/services';
import { getRequest } from '../api/requests';
import type { ServiceData, ServiceRequestData } from '../types';
import { MapPin, Calendar, Clock, FileText, PlayCircle, CheckCircle2, XCircle } from 'lucide-react';

function InfoRow({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3 p-3 bg-[#f7f9fb] rounded-xl">
      <span className="text-[#004ac6] mt-0.5 shrink-0">{icon}</span>
      <div>
        <p className="text-[#505f76] text-xs font-medium">{label}</p>
        <p className="text-[#191c1e] text-sm font-semibold mt-0.5 break-all">{value}</p>
      </div>
    </div>
  );
}

export default function TechServicePage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [service, setService] = useState<ServiceData | null>(null);
  const [request, setRequest] = useState<ServiceRequestData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);
    getService(id)
      .then(async (res) => {
        const svc = res.data;
        console.log('Service loaded:', svc);
        setService(svc);
        try {
          const reqRes = await getRequest(svc.request_id);
          console.log('Request loaded:', reqRes.data);
          setRequest(reqRes.data);
        } catch (err) {
          console.error('Error loading request:', err);
        }
      })
      .catch((err) => {
        console.error('Error loading service:', err);
        setError(err.response?.data?.detail || 'No pudimos cargar el servicio. Intenta nuevamente.');
      })
      .finally(() => setLoading(false));
  }, [id]);

  const handleUpdateStatus = async (newStatus: string) => {
    if (!id || !service) return;
    if (!confirm(`¿${newStatus === 'in_progress' ? 'Iniciar' : 'Finalizar'} el servicio?`)) return;
    setActionLoading(true);
    try {
      await updateServiceStatus(id, newStatus);
      setService({ ...service, status: newStatus as any });
    } catch {
      alert('Error al actualizar estado del servicio.');
    } finally {
      setActionLoading(false);
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    return new Date(dateStr).toLocaleString('es-PE', {
      weekday: 'short', day: 'numeric', month: 'short',
      year: 'numeric', hour: '2-digit', minute: '2-digit',
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

  if (error) return (
    <div className="min-h-screen bg-[#f7f9fb] flex flex-col">
      <TopNavBar showBack backTo="/tech/dashboard" />
      <div className="flex-1 flex flex-col items-center justify-center gap-4">
        <XCircle className="w-12 h-12 text-red-500" />
        <p className="text-[#191c1e] font-bold text-lg">Error al cargar</p>
        <p className="text-[#505f76] text-center px-4">{error}</p>
        <button
          onClick={() => navigate('/tech/dashboard')}
          className="mt-4 px-6 py-2 bg-[#004ac6] text-white rounded-lg font-semibold hover:bg-[#003ea8] transition-all"
        >
          Volver al Panel
        </button>
      </div>
    </div>
  );

  if (!service) return (
    <div className="min-h-screen bg-[#f7f9fb]">
      <TopNavBar showBack backTo="/tech/dashboard" />
      <div className="text-center py-12 font-bold text-red-500">Servicio no encontrado</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f7f9fb]">
      <TopNavBar showBack backTo="/tech/dashboard" title="Gestión de Servicio" />

      <main className="max-w-2xl mx-auto px-4 py-8 space-y-5">

        {/* Stepper */}
        <div className="card p-6">
          <h2 className="text-center font-bold text-[#191c1e] mb-6">Progreso del Servicio</h2>
          <ServiceStatusStepper status={service.status} />
        </div>

        {/* Action Center */}
        <div className={`card p-6 border-2 ${
          service.status === 'completed' ? 'border-[#16a34a]/20' :
          service.status === 'cancelled' ? 'border-[#dc2626]/20' :
          'border-[#004ac6]/10'
        }`}>
          <h2 className="font-bold text-lg text-[#191c1e] mb-4">Centro de Acción</h2>

          {service.status === 'scheduled' && (
            <div className="space-y-4">
              <div className="flex items-start gap-3 p-4 bg-[#004ac6]/5 border border-[#004ac6]/20 rounded-xl">
                <Calendar className="w-5 h-5 text-[#004ac6] shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-[#004ac6]">Servicio programado</p>
                  <p className="text-sm text-[#505f76]">
                    {service.scheduled_start
                      ? `Inicio: ${formatDate(service.scheduled_start)}`
                      : 'Coordina el horario con el cliente'}
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleUpdateStatus('in_progress')}
                disabled={actionLoading}
                className="w-full py-4 bg-[#004ac6] hover:bg-[#003ea8] text-white font-bold text-lg rounded-xl transition-all hover:shadow-lg flex items-center justify-center gap-3 disabled:opacity-50"
              >
                <PlayCircle className="w-6 h-6" />
                {actionLoading ? 'Procesando...' : 'Iniciar Servicio'}
              </button>
            </div>
          )}

          {service.status === 'in_progress' && (
            <div className="space-y-4">
              <div className="flex items-center gap-3 p-4 bg-[#d97706]/10 border border-[#d97706]/20 rounded-xl">
                <div className="w-8 h-8 border-[3px] border-[#d97706] border-t-transparent rounded-full animate-spin flex-shrink-0" />
                <div>
                  <p className="text-[#d97706] font-semibold">Servicio en progreso</p>
                  <p className="text-sm text-[#505f76]">Finaliza el trabajo cuando concluyas</p>
                </div>
              </div>
              <button
                onClick={() => handleUpdateStatus('completed')}
                disabled={actionLoading}
                className="w-full py-4 bg-[#16a34a] hover:bg-[#15803d] text-white font-bold text-lg rounded-xl transition-all hover:shadow-lg flex items-center justify-center gap-3 disabled:opacity-50"
              >
                <CheckCircle2 className="w-6 h-6" />
                {actionLoading ? 'Finalizando...' : 'Finalizar Servicio'}
              </button>
            </div>
          )}

          {service.status === 'completed' && (
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="w-16 h-16 rounded-full bg-[#16a34a]/10 flex items-center justify-center">
                <CheckCircle2 className="w-8 h-8 text-[#16a34a]" />
              </div>
              <p className="text-xl font-black text-[#191c1e]">Servicio Completado</p>
              <p className="text-[#505f76] text-sm text-center">
                Excelente trabajo. El cliente puede dejarte una reseña ahora.
              </p>
            </div>
          )}

          {service.status === 'cancelled' && (
            <div className="flex flex-col items-center gap-3 py-4">
              <div className="w-16 h-16 rounded-full bg-[#dc2626]/10 flex items-center justify-center">
                <XCircle className="w-8 h-8 text-[#dc2626]" />
              </div>
              <p className="text-xl font-black text-[#191c1e]">Servicio Cancelado</p>
              <p className="text-[#505f76] text-sm text-center">Este servicio fue cancelado</p>
              <button
                onClick={() => navigate('/tech/dashboard')}
                className="btn btn-primary mt-2"
              >
                Ver trabajos disponibles
              </button>
            </div>
          )}
        </div>

        {/* Work Info */}
        <div className="card p-6 space-y-3">
          <h3 className="font-bold text-[#191c1e] flex items-center gap-2">
            <FileText className="w-4 h-4 text-[#004ac6]" />
            Información del Trabajo
          </h3>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <InfoRow
              icon={<Calendar className="w-4 h-4" />}
              label="Inicio agendado"
              value={formatDate(service.scheduled_start)}
            />
            <InfoRow
              icon={<Clock className="w-4 h-4" />}
              label="Fin estimado"
              value={formatDate(service.scheduled_end)}
            />
          </div>

          {request && (
            <div className="pt-3 border-t border-[#eceef0] space-y-3">
              {request.address && (
                <InfoRow
                  icon={<MapPin className="w-4 h-4" />}
                  label="Dirección del cliente"
                  value={request.address}
                />
              )}
              {(request.description || request.title) && (
                <div className="p-3 bg-[#f7f9fb] rounded-xl">
                  <p className="text-[#505f76] text-xs font-medium mb-1">Problema reportado</p>
                  <p className="text-[#191c1e] text-sm font-semibold">{request.title}</p>
                  {request.description && (
                    <p className="text-[#434655] text-xs mt-1 leading-relaxed">{request.description}</p>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
