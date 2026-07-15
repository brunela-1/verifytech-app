import type { ServiceData } from '../types';

type ServiceStatus = ServiceData['status'];

const STEPS: { key: ServiceStatus; label: string; icon: string }[] = [
  { key: 'scheduled', label: 'Agendado', icon: '📅' },
  { key: 'in_progress', label: 'En Progreso', icon: '🔧' },
  { key: 'completed', label: 'Completado', icon: '✅' },
];

const STATUS_ORDER: Record<ServiceStatus, number> = {
  scheduled: 0,
  in_progress: 1,
  completed: 2,
  cancelled: -1,
};

interface ServiceStatusStepperProps {
  status: ServiceStatus;
}

export default function ServiceStatusStepper({ status }: ServiceStatusStepperProps) {
  if (status === 'cancelled') {
    return (
      <div className="flex items-center justify-center gap-3 py-4">
        <div className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[#dc2626]/10 border border-[#dc2626]/20">
          <span className="text-lg">❌</span>
          <span className="text-[#dc2626] font-semibold text-sm">Servicio Cancelado</span>
        </div>
      </div>
    );
  }

  const currentIndex = STATUS_ORDER[status] ?? 0;

  return (
    <div className="flex items-center justify-center gap-0">
      {STEPS.map((step, idx) => {
        const isCompleted = idx < currentIndex;
        const isCurrent = idx === currentIndex;
        const isPending = idx > currentIndex;

        return (
          <div key={step.key} className="flex items-center">
            {/* Step node */}
            <div className="flex flex-col items-center gap-1.5">
              <div
                className={`w-11 h-11 rounded-full flex items-center justify-center text-lg font-bold transition-all shadow-sm ${
                  isCompleted
                    ? 'bg-[#16a34a] shadow-[#16a34a]/20'
                    : isCurrent
                    ? 'bg-[#004ac6] shadow-[#004ac6]/25 ring-4 ring-[#004ac6]/15'
                    : 'bg-[#f2f4f6] border-2 border-[#e6e8ea]'
                }`}
              >
                {isCompleted ? (
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                  </svg>
                ) : (
                  <span className={isPending ? 'grayscale opacity-40' : ''}>{step.icon}</span>
                )}
              </div>
              <span
                className={`text-xs font-medium whitespace-nowrap ${
                  isCurrent ? 'text-[#004ac6]' : isCompleted ? 'text-[#16a34a]' : 'text-[#505f76]'
                }`}
              >
                {step.label}
              </span>
            </div>

            {/* Connector line */}
            {idx < STEPS.length - 1 && (
              <div
                className={`w-16 sm:w-24 h-1 mx-1 rounded-full mb-5 transition-all ${
                  idx < currentIndex ? 'bg-[#16a34a]' : 'bg-[#e6e8ea]'
                }`}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}
