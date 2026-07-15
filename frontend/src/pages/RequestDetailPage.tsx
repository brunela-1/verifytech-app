import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MapPin, XCircle } from 'lucide-react';
import TopNavBar from '../components/TopNavBar';
import ProposalCard from '../components/ProposalCard';
import { getRequest, cancelRequest } from '../api/requests';
import { getProposalsForRequest, acceptProposal, rejectProposal } from '../api/proposals';
import { getTechBlocks } from '../api/availability';
import type { ServiceRequestData, ProposalData, AvailabilityBlockData } from '../types';
import { CATEGORIES } from '../types';

export default function RequestDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [request, setRequest] = useState<ServiceRequestData | null>(null);
  const [proposals, setProposals] = useState<ProposalData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  // Per-proposal block state
  const [proposalBlocks, setProposalBlocks] = useState<Record<string, AvailabilityBlockData[]>>({});
  const [loadingBlocks, setLoadingBlocks] = useState<Record<string, boolean>>({});
  const [blockErrors, setBlockErrors] = useState<Record<string, string | null>>({});

  useEffect(() => {
    if (!id) return;
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [reqRes, propRes] = await Promise.all([
          getRequest(id),
          getProposalsForRequest(id),
        ]);
        setRequest(reqRes.data);
        const propsData: ProposalData[] = propRes.data;
        setProposals(propsData);

        // Pre-load blocks for all sent proposals
        for (const prop of propsData) {
          if (prop.status === 'sent') {
            loadBlocksForProposal(prop.id, prop.tech_id);
          }
        }
      } catch {
        setError('Error al cargar la solicitud');
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [id]);

  const loadBlocksForProposal = async (proposalId: string, techId: string) => {
    setLoadingBlocks(prev => ({ ...prev, [proposalId]: true }));
    try {
      const res = await getTechBlocks(techId);
      const available = res.data.filter((b: AvailabilityBlockData) => b.status === 'available');
      setProposalBlocks(prev => ({ ...prev, [proposalId]: available }));
    } catch {
      setBlockErrors(prev => ({ ...prev, [proposalId]: 'No se pudo cargar la disponibilidad.' }));
    } finally {
      setLoadingBlocks(prev => ({ ...prev, [proposalId]: false }));
    }
  };

  const handleAccept = async (proposalId: string, selectedBlockId: string | null) => {
    setActionLoading(true);
    setBlockErrors(prev => ({ ...prev, [proposalId]: null }));
    try {
      const res = await acceptProposal(proposalId, { selected_block_id: selectedBlockId });
      const serviceId = res.data.service_id;
      if (!serviceId) {
        throw new Error('No service ID returned from server');
      }
      navigate(`/services/${serviceId}`);
    } catch (err: any) {
      console.error('Error accepting proposal:', err);
      if (err.response?.status === 409) {
        setBlockErrors(prev => ({
          ...prev,
          [proposalId]: 'Este horario ya fue reservado. Por favor, selecciona otro.',
        }));
        // Refresh blocks for this proposal
        const prop = proposals.find(p => p.id === proposalId);
        if (prop) {
          await loadBlocksForProposal(proposalId, prop.tech_id);
        }
      } else {
        const errorMsg = err.response?.data?.detail || err.message || 'Error al aceptar la propuesta.';
        console.error('Error details:', errorMsg);
        setBlockErrors(prev => ({ ...prev, [proposalId]: errorMsg }));
      }
    } finally {
      setActionLoading(false);
    }
  };

  const handleReject = async (proposalId: string) => {
    if (!confirm('¿Rechazar esta propuesta?')) return;
    setActionLoading(true);
    try {
      await rejectProposal(proposalId);
      setProposals(prev => prev.map(p => p.id === proposalId ? { ...p, status: 'rejected' as const } : p));
    } catch {
      alert('Error al rechazar la propuesta.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCancel = async () => {
    if (!id || !confirm('¿Cancelar esta solicitud?')) return;
    setCancelling(true);
    try {
      await cancelRequest(id);
      setRequest(prev => prev ? { ...prev, status: 'cancelled' as const } : prev);
    } catch {
      alert('No se pudo cancelar la solicitud.');
    } finally {
      setCancelling(false);
    }
  };

  const categoryData = CATEGORIES.find(c => c.key === request?.category);

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
        <XCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
        <p className="text-red-500 font-bold">{error || 'Solicitud no encontrada'}</p>
      </div>
    </div>
  );

  const sentProposals = proposals.filter(p => p.status === 'sent');
  const otherProposals = proposals.filter(p => p.status !== 'sent');

  return (
    <div className="min-h-screen bg-[#f7f9fb]">
      <TopNavBar showBack backTo="/dashboard" title="Detalle de Solicitud" />

      <main className="max-w-5xl mx-auto px-4 py-8 grid md:grid-cols-5 gap-6">

        {/* Left Col: Request Info */}
        <div className="md:col-span-2 space-y-4">
          <div className="card p-6">
            {categoryData && (
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-[#004ac6]/10 text-[#004ac6] text-xs font-bold mb-4">
                🛠️ {categoryData.label}
              </div>
            )}

            <h1 className="text-xl font-black text-[#191c1e] mb-2 leading-tight">
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
              {request.description || 'Sin descripción adicional.'}
            </p>

            <div className="mt-5 pt-4 border-t border-[#eceef0] flex items-center justify-between">
              <span className={`badge text-xs font-bold ${
                request.status === 'open' ? 'badge-green' :
                request.status === 'closed' ? 'badge-blue' : 'badge-red'
              }`}>
                {request.status === 'open' ? 'Abierta' : request.status === 'closed' ? 'Cerrada' : 'Cancelada'}
              </span>
              <span className="text-xs text-[#94a3b8]">
                {request.created_at ? new Date(request.created_at).toLocaleDateString('es-PE') : ''}
              </span>
            </div>
          </div>

          {/* Cancel request */}
          {request.status === 'open' && (
            <button
              onClick={handleCancel}
              disabled={cancelling}
              className="w-full py-2.5 border-2 border-[#dc2626] text-[#dc2626] hover:bg-[#dc2626] hover:text-white font-semibold text-sm rounded-xl transition-colors disabled:opacity-50"
            >
              {cancelling ? 'Cancelando...' : '✕ Cancelar Solicitud'}
            </button>
          )}

          {/* Stats */}
          <div className="card p-4 grid grid-cols-2 gap-3 text-center">
            <div>
              <p className="text-2xl font-black text-[#004ac6]">{proposals.length}</p>
              <p className="text-xs text-[#505f76] font-medium mt-0.5">Total propuestas</p>
            </div>
            <div>
              <p className="text-2xl font-black text-[#16a34a]">{sentProposals.length}</p>
              <p className="text-xs text-[#505f76] font-medium mt-0.5">Pendientes</p>
            </div>
          </div>
        </div>

        {/* Right Col: Proposals */}
        <div className="md:col-span-3 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-bold text-[#191c1e]">
              Propuestas <span className="text-[#004ac6]">({proposals.length})</span>
            </h2>
          </div>

          {request.status === 'closed' && (
            <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 text-blue-700 p-4 rounded-xl text-sm">
              <span className="text-lg">✅</span>
              <p>Esta solicitud fue cerrada. Se aceptó una propuesta y se creó un servicio.</p>
            </div>
          )}

          {proposals.length === 0 ? (
            <div className="empty-state bg-white rounded-2xl border border-[#eceef0] py-12">
              <span className="empty-state-icon">📬</span>
              <p className="font-semibold text-[#191c1e]">Aún no hay propuestas</p>
              <p className="text-sm text-[#505f76] mt-1">Los técnicos están revisando tu solicitud.</p>
            </div>
          ) : (
            <>
              {/* Pending proposals first */}
              {sentProposals.length > 0 && (
                <div className="space-y-4">
                  <p className="text-xs font-bold text-[#505f76] uppercase tracking-wider">Pendientes de respuesta</p>
                  {sentProposals.map(prop => (
                    <ProposalCard
                      key={prop.id}
                      proposal={prop}
                      requestStatus={request.status}
                      availableBlocks={proposalBlocks[prop.id] ?? []}
                      loadingBlocks={loadingBlocks[prop.id] ?? false}
                      onAccept={handleAccept}
                      onReject={handleReject}
                      actionLoading={actionLoading}
                      blockError={blockErrors[prop.id]}
                    />
                  ))}
                </div>
              )}

              {/* Other proposals */}
              {otherProposals.length > 0 && (
                <div className="space-y-3 mt-6">
                  <p className="text-xs font-bold text-[#505f76] uppercase tracking-wider">Otras propuestas</p>
                  {otherProposals.map(prop => (
                    <ProposalCard
                      key={prop.id}
                      proposal={prop}
                      requestStatus={request.status}
                      availableBlocks={[]}
                      loadingBlocks={false}
                      onAccept={handleAccept}
                      onReject={handleReject}
                      actionLoading={actionLoading}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </div>
      </main>
    </div>
  );
}
