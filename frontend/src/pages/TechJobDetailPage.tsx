import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, DollarSign, Clock, CalendarDays, AlertCircle } from 'lucide-react';
import TopNavBar from '../components/TopNavBar';
import AvailabilityBlockManager from '../components/AvailabilityBlockManager';
import { getRequest } from '../api/requests';
import { sendProposal } from '../api/proposals';
import { getWalletBalance } from '../api/wallet';
import type { ServiceRequestData, AvailabilityBlockData } from '../types';
import { CATEGORIES } from '../types';

export default function TechJobDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [request, setRequest] = useState<ServiceRequestData | null>(null);
  const [blocks, setBlocks] = useState<AvailabilityBlockData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Form state
  const [price, setPrice] = useState('');
  const [estimatedTime, setEstimatedTime] = useState('');
  const [observations, setObservations] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  
  const [walletBalance, setWalletBalance] = useState<number | null>(null);

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    Promise.all([
      getRequest(id),
      getWalletBalance()
    ])
      .then(([reqRes, walletRes]) => {
        setRequest(reqRes.data);
        setWalletBalance(walletRes.data.balance);
      })
      .catch(() => setError('Error al cargar los detalles del trabajo o tu saldo'))
      .finally(() => setLoading(false));
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSubmitting(true);
    setSubmitError(null);
    try {
      await sendProposal({
        request_id: id,
        price: parseFloat(price),
        estimated_time: estimatedTime,
        observations,
      });
      navigate('/tech/dashboard');
    } catch (err: any) {
      setSubmitError(err.response?.data?.detail || 'Error al enviar la propuesta. Intenta de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  const availableCount = blocks.filter(b => b.status === 'available').length;
  const category = CATEGORIES.find(c => c.key === request?.category);

  if (loading) return (
    <div className="min-h-screen bg-[#f7f9fb] flex flex-col">
      <TopNavBar />
      <div className="flex-1 flex justify-center items-center">
        <div className="w-12 h-12 border-4 border-[#004ac6] border-t-transparent rounded-full animate-spin" />
      </div>
    </div>
  );

  if (error || !request) return (
    <div className="min-h-screen bg-[#f7f9fb]">
      <TopNavBar />
      <div className="max-w-3xl mx-auto py-12 px-4 text-center">
        <p className="text-red-500 font-bold">{error || 'Trabajo no encontrado'}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f7f9fb]">
      <TopNavBar showBack backTo="/tech/dashboard" title="Detalle del Trabajo" />

      <main className="max-w-5xl mx-auto px-4 py-8 grid md:grid-cols-5 gap-6">

        {/* Left Col: Request Info */}
        <div className="md:col-span-3 space-y-4">
          <div className="card p-6">
            {category && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#004ac6]/10 text-[#004ac6] text-xs font-bold mb-4">
                🛠️ {category.label}
              </div>
            )}

            <h1 className="text-2xl font-black text-[#191c1e] mb-3 leading-tight">
              {request.title}
            </h1>

            {request.address && (
              <p className="flex items-center gap-2 text-sm text-[#505f76] mb-4">
                <MapPin className="w-4 h-4 shrink-0" />
                {request.address}
              </p>
            )}

            <div className="h-px bg-[#eceef0] my-4" />

            <p className="text-sm text-[#434655] whitespace-pre-wrap leading-relaxed">
              {request.description || 'El cliente no proporcionó detalles adicionales.'}
            </p>

            {request.images && request.images.length > 0 && (
              <div className="mt-5 pt-4 border-t border-[#eceef0]">
                <p className="text-xs font-bold text-[#505f76] mb-3">Fotos del problema</p>
                <div className="flex gap-2 flex-wrap">
                  {request.images.map(img => (
                    <a
                      key={img.id}
                      href={img.image_url}
                      target="_blank"
                      rel="noreferrer"
                      className="block w-20 h-20 rounded-xl overflow-hidden border border-[#eceef0] hover:border-[#004ac6]/40 transition-colors"
                    >
                      <img src={img.image_url} alt="Foto" className="w-full h-full object-cover" />
                    </a>
                  ))}
                </div>
              </div>
            )}

            <p className="text-xs text-[#94a3b8] mt-4">
              Publicado el{' '}
              {request.created_at
                ? new Date(request.created_at).toLocaleDateString('es-PE', { day: '2-digit', month: 'long', year: 'numeric' })
                : '—'}
            </p>
          </div>
        </div>

        {/* Right Col: Proposal form + availability */}
        <div className="md:col-span-2 space-y-4">
          {/* Proposal form */}
          <div className="card p-6">
            <h2 className="text-lg font-bold text-[#191c1e] mb-5 flex items-center gap-2">
              📝 Enviar Propuesta
            </h2>

            {submitError && (
              <div className="flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-sm p-3 rounded-xl mb-4">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                {submitError}
              </div>
            )}

            {walletBalance !== null && walletBalance <= 0 && (
              <div className="flex flex-col gap-2 bg-orange-50 border border-orange-200 text-orange-800 text-sm p-4 rounded-xl mb-6">
                <div className="flex items-start gap-2">
                  <AlertCircle className="w-5 h-5 shrink-0 text-orange-500" />
                  <p className="font-bold">Saldo Insuficiente</p>
                </div>
                <p className="pl-7">
                  No tienes saldo en tu Billetera Virtual para ofertar. Recuerda que se cobra una comisión del 15% del precio de tu propuesta al ser aceptada.
                </p>
                <button
                  onClick={() => navigate('/tech/wallet')}
                  className="ml-7 mt-2 self-start btn bg-orange-100 hover:bg-orange-200 text-orange-800 py-1.5 px-4 text-xs"
                >
                  Recargar Saldo
                </button>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="label">Precio Estimado (S/)</label>
                <div className="input-icon-wrap">
                  <DollarSign className="input-icon" />
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    required
                    className="input"
                    placeholder="0.00"
                    value={price}
                    onChange={e => setPrice(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="label">Tiempo Estimado</label>
                <div className="input-icon-wrap">
                  <Clock className="input-icon" />
                  <input
                    type="text"
                    className="input"
                    placeholder="Ej. 2 a 3 horas"
                    value={estimatedTime}
                    onChange={e => setEstimatedTime(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="label flex justify-between">
                  Observaciones
                  <span className="text-[#94a3b8] text-xs font-normal">Opcional</span>
                </label>
                <textarea
                  className="input"
                  placeholder="Detalla lo que incluye tu propuesta, materiales, etc."
                  value={observations}
                  onChange={e => setObservations(e.target.value)}
                  rows={3}
                />
              </div>

              <button
                type="submit"
                disabled={submitting || !price || (walletBalance !== null && walletBalance <= 0)}
                className="btn btn-primary btn-full py-3.5 shadow-sm hover:shadow-md"
              >
                {submitting ? <div className="spinner mr-2" /> : null}
                {submitting ? 'Enviando...' : 'Enviar Propuesta'}
              </button>
            </form>
          </div>

          {/* Availability widget */}
          <div className="card p-5">
            <div className="flex items-center gap-2 mb-4">
              <CalendarDays className="w-5 h-5 text-[#004ac6]" />
              <h3 className="font-bold text-[#191c1e]">Tu Disponibilidad</h3>
              {availableCount > 0 && (
                <span className="ml-auto text-xs font-semibold text-[#16a34a] bg-[#16a34a]/10 px-2 py-0.5 rounded-full">
                  {availableCount} disponible{availableCount !== 1 ? 's' : ''}
                </span>
              )}
            </div>
            <p className="text-xs text-[#505f76] mb-4">
              Los clientes verán estos horarios al aceptar tu propuesta.
            </p>
            <AvailabilityBlockManager compact onBlocksChange={setBlocks} />
          </div>
        </div>
      </main>
    </div>
  );
}
