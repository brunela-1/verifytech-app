interface TechVerificationBadgeProps {
  status: 'pending' | 'verified' | 'rejected';
  size?: 'sm' | 'md' | 'lg';
}

const CONFIG = {
  verified: {
    icon: '✓',
    label: 'Verificado',
    description: 'Identidad y credenciales confirmadas',
    bg: 'bg-[#16a34a]/10',
    border: 'border-[#16a34a]/25',
    text: 'text-[#16a34a]',
    iconBg: 'bg-[#16a34a]',
  },
  pending: {
    icon: '⏳',
    label: 'Verificación Pendiente',
    description: 'Documentos en revisión',
    bg: 'bg-[#d97706]/10',
    border: 'border-[#d97706]/25',
    text: 'text-[#d97706]',
    iconBg: 'bg-[#d97706]',
  },
  rejected: {
    icon: '✕',
    label: 'Verificación Rechazada',
    description: 'Los documentos no pudieron ser validados',
    bg: 'bg-[#dc2626]/10',
    border: 'border-[#dc2626]/25',
    text: 'text-[#dc2626]',
    iconBg: 'bg-[#dc2626]',
  },
};

export default function TechVerificationBadge({ status, size = 'md' }: TechVerificationBadgeProps) {
  const cfg = CONFIG[status];

  if (size === 'sm') {
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold border ${cfg.bg} ${cfg.border} ${cfg.text}`}>
        <span>{cfg.icon}</span>
        {cfg.label}
      </span>
    );
  }

  return (
    <div className={`flex items-center gap-3 p-4 rounded-xl border ${cfg.bg} ${cfg.border}`}>
      <div className={`w-10 h-10 rounded-full ${cfg.iconBg} flex items-center justify-center flex-shrink-0`}>
        <span className="text-white font-bold text-base">{cfg.icon}</span>
      </div>
      <div>
        <p className={`font-semibold text-sm ${cfg.text}`}>{cfg.label}</p>
        <p className="text-[#505f76] text-xs mt-0.5">{cfg.description}</p>
      </div>
    </div>
  );
}
