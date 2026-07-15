import React from 'react';
import { MapPin, Clock, MessageSquare, Tag } from 'lucide-react';
import type { ServiceRequestData } from '../types';
import { CATEGORIES } from '../types';

interface RequestCardProps {
  request: ServiceRequestData;
  onClick: () => void;
}

const statusConfig = {
  open: { label: 'Abierta', className: 'bg-[#16a34a]/10 text-[#16a34a]' },
  closed: { label: 'Cerrada', className: 'bg-[#505f76]/10 text-[#505f76]' },
  cancelled: { label: 'Cancelada', className: 'bg-[#dc2626]/10 text-[#dc2626]' },
};

export default function RequestCard({ request, onClick }: RequestCardProps) {
  const category = CATEGORIES.find(c => c.key === request.category);
  const status = statusConfig[request.status] ?? statusConfig.open;

  const formattedDate = request.created_at
    ? new Date(request.created_at).toLocaleDateString('es-PE', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      })
    : null;

  return (
    <button
      onClick={onClick}
      className="w-full text-left bg-white rounded-2xl border border-[#eceef0] shadow-sm hover:shadow-md hover:border-[#004ac6]/30 transition-all duration-200 group active:scale-[0.99] p-5"
    >
      {/* Top row: title + status badge */}
      <div className="flex items-start justify-between gap-3 mb-3">
        <h3 className="text-base font-bold text-[#191c1e] group-hover:text-[#004ac6] transition-colors leading-snug line-clamp-2">
          {request.title}
        </h3>
        <span className={`shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full ${status.className}`}>
          {status.label}
        </span>
      </div>

      {/* Category pill */}
      {category && (
        <div className="flex items-center gap-1.5 mb-3">
          <Tag className="w-3.5 h-3.5 text-[#004ac6]" />
          <span className="text-xs font-semibold text-[#004ac6] bg-[#004ac6]/8 px-2 py-0.5 rounded-full">
            {category.label}
          </span>
        </div>
      )}

      {/* Description preview */}
      {request.description && (
        <p className="text-sm text-[#505f76] line-clamp-2 mb-3 leading-relaxed">
          {request.description}
        </p>
      )}

      {/* Footer: address + proposals + date */}
      <div className="flex items-center gap-4 flex-wrap mt-auto pt-3 border-t border-[#f2f4f6]">
        {request.address && (
          <span className="flex items-center gap-1 text-xs text-[#505f76]">
            <MapPin className="w-3.5 h-3.5 shrink-0" />
            <span className="truncate max-w-[160px]">{request.address}</span>
          </span>
        )}
        <span className="flex items-center gap-1 text-xs text-[#505f76]">
          <MessageSquare className="w-3.5 h-3.5" />
          {request.proposals_count} {request.proposals_count === 1 ? 'propuesta' : 'propuestas'}
        </span>
        {formattedDate && (
          <span className="flex items-center gap-1 text-xs text-[#505f76] ml-auto">
            <Clock className="w-3.5 h-3.5" />
            {formattedDate}
          </span>
        )}
      </div>
    </button>
  );
}
