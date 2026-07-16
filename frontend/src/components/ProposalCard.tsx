import React, { useState } from 'react';
import { Clock, DollarSign, Calendar, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import type { ProposalData, AvailabilityBlockData } from '../types';
import { Link } from 'react-router-dom';

interface ProposalCardProps {
  proposal: ProposalData;
  requestStatus: 'open' | 'closed' | 'cancelled';
  availableBlocks: AvailabilityBlockData[];
  loadingBlocks: boolean;
  onAccept: (proposalId: string, selectedBlockId: string | null) => void;
  onReject: (proposalId: string) => void;
  actionLoading?: boolean;
  blockError?: string | null;
}

const statusConfig = {
  sent:     { label: 'Pendiente',  cls: 'bg-amber-50 text-amber-700 border-amber-200' },
  accepted: { label: 'Aceptada',  cls: 'bg-green-50 text-green-700 border-green-200' },
  rejected: { label: 'Rechazada', cls: 'bg-red-50 text-red-700 border-red-200' },
};

export default function ProposalCard({
  proposal,
  requestStatus,
  availableBlocks,
  loadingBlocks,
  onAccept,
  onReject,
  actionLoading = false,
  blockError = null,
}: ProposalCardProps) {
  const [expanded, setExpanded] = useState(false);
  const [selectedBlockId, setSelectedBlockId] = useState<string | null>(null);

  const cfg = statusConfig[proposal.status] ?? statusConfig.sent;
  const canAct = proposal.status === 'sent' && requestStatus === 'open';

  return (
    <div className={`bg-white rounded-2xl border shadow-sm transition-all duration-200 overflow-hidden ${
      proposal.status === 'accepted'
        ? 'border-[#16a34a]/30 shadow-[#16a34a]/10'
        : 'border-[#eceef0] hover:shadow-md hover:border-[#004ac6]/20'
    }`}>
      {/* Header */}
      <div className="p-5">
        <div className="flex items-start justify-between gap-3 mb-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-full bg-gradient-to-br from-[#004ac6] to-[#003ea8] flex items-center justify-center font-bold text-white text-sm shadow-sm">
              {proposal.tech_id.slice(0, 1).toUpperCase()}
            </div>
            <div>
              <Link to={`/techs/${proposal.tech_id}`} className="font-bold text-[#004ac6] hover:underline text-sm flex items-center gap-1">
                Técnico #{proposal.tech_id.slice(0, 8)}
              </Link>
              {proposal.created_at && (
                <p className="text-xs text-[#94a3b8] mt-0.5">
                  {new Date(proposal.created_at).toLocaleString('es-PE', {
                    day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              )}
            </div>
          </div>

          <div className="text-right">
            <p className="text-2xl font-black text-[#004ac6]">
              S/ {Number(proposal.price).toFixed(2)}
            </p>
            <span className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full border mt-1 ${cfg.cls}`}>
              {cfg.label}
            </span>
          </div>
        </div>

        {/* Quick info row */}
        <div className="grid grid-cols-2 gap-3 mb-3">
          <div className="flex items-center gap-2 bg-[#f7f9fb] rounded-xl p-3">
            <Clock className="w-4 h-4 text-[#004ac6] shrink-0" />
            <div>
              <p className="text-[10px] text-[#94a3b8] font-medium">Tiempo est.</p>
              <p className="text-xs font-semibold text-[#191c1e]">
                {proposal.estimated_time || 'No especificado'}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-[#f7f9fb] rounded-xl p-3">
            <DollarSign className="w-4 h-4 text-[#004ac6] shrink-0" />
            <div>
              <p className="text-[10px] text-[#94a3b8] font-medium">Precio</p>
              <p className="text-xs font-semibold text-[#191c1e]">
                S/ {Number(proposal.price).toFixed(2)}
              </p>
            </div>
          </div>
        </div>

        {proposal.observations && (
          <div className="bg-blue-50/60 border border-blue-100 rounded-xl p-3 mb-3">
            <p className="text-xs text-[#434655] italic leading-relaxed">
              "{proposal.observations}"
            </p>
          </div>
        )}
      </div>

      {/* Expandable block selector & actions */}
      {canAct && (
        <div className="border-t border-[#f2f4f6] bg-[#f7f9fb]">
          {blockError && (
            <div className="mx-4 mt-4 flex items-start gap-2 bg-red-50 border border-red-200 text-red-700 text-xs p-3 rounded-xl">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{blockError}</span>
            </div>
          )}

          {/* Block selector */}
          {loadingBlocks ? (
            <div className="p-4 flex justify-center">
              <div className="spinner text-[#004ac6] w-5 h-5" />
            </div>
          ) : availableBlocks.length > 0 ? (
            <div className="p-4">
              <p className="text-xs font-bold text-[#191c1e] flex items-center gap-1.5 mb-3">
                <Calendar className="w-3.5 h-3.5 text-[#004ac6]" />
                Selecciona un horario (opcional):
              </p>
              <div className="grid grid-cols-2 gap-2 mb-4 max-h-40 overflow-y-auto pr-1">
                {availableBlocks.map(b => (
                  <button
                    key={b.id}
                    onClick={() => setSelectedBlockId(prev => prev === b.id ? null : b.id)}
                    className={`text-left text-xs px-3 py-2.5 rounded-xl border-2 transition-all ${
                      selectedBlockId === b.id
                        ? 'border-[#004ac6] bg-[#004ac6]/5 text-[#004ac6]'
                        : 'border-[#eceef0] hover:border-[#004ac6]/40 bg-white'
                    }`}
                  >
                    <p className="font-bold">{b.day_label}</p>
                    <p className="text-[#505f76] mt-0.5">
                      {b.start_time.slice(0, 5)} – {b.end_time.slice(0, 5)}
                    </p>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div className="p-4 pb-0">
              <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 mb-4 text-xs text-amber-700">
                El técnico no tiene horarios disponibles. Si aceptas, coordinarán directamente.
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3 px-4 pb-4">
            <button
              onClick={() => onAccept(proposal.id, selectedBlockId)}
              disabled={actionLoading}
              className="flex-1 flex items-center justify-center gap-2 bg-[#004ac6] hover:bg-[#003ea8] text-white font-semibold text-sm py-2.5 rounded-xl transition-all active:scale-95 disabled:opacity-50"
            >
              <CheckCircle className="w-4 h-4" />
              Aceptar
            </button>
            <button
              onClick={() => onReject(proposal.id)}
              disabled={actionLoading}
              className="flex items-center justify-center gap-2 bg-red-50 hover:bg-red-100 text-red-600 font-semibold text-sm px-4 py-2.5 rounded-xl transition-all active:scale-95 disabled:opacity-50"
            >
              <XCircle className="w-4 h-4" />
              Rechazar
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
