import React from 'react';
import TopNavBar from '../components/TopNavBar';
import AvailabilityBlockManager from '../components/AvailabilityBlockManager';
import { CalendarDays, Info } from 'lucide-react';

export default function AvailabilityPage() {
  return (
    <div className="min-h-screen bg-[#f7f9fb]">
      <TopNavBar showBack backTo="/tech/dashboard" title="Mi Disponibilidad" />

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="flex items-start gap-4 mb-8">
          <div className="w-12 h-12 rounded-2xl bg-[#004ac6]/10 flex items-center justify-center shrink-0">
            <CalendarDays className="w-6 h-6 text-[#004ac6]" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-[#191c1e]">Mi Disponibilidad</h1>
            <p className="text-[#505f76] mt-1 text-sm">
              Configura tus bloques de tiempo disponibles para que los clientes puedan agendarte.
            </p>
          </div>
        </div>

        {/* Info card */}
        <div className="bg-blue-50 border border-blue-100 rounded-2xl p-5 mb-6 flex items-start gap-3">
          <Info className="w-5 h-5 text-[#004ac6] shrink-0 mt-0.5" />
          <div className="text-sm text-[#434655] space-y-1">
            <p className="font-semibold text-[#004ac6]">¿Cómo funciona?</p>
            <p>Los bloques que marques como disponibles serán mostrados a los clientes cuando acepten tu propuesta.</p>
            <p>Un bloque <strong>reservado</strong> ya fue seleccionado por un cliente y no puede ser eliminado.</p>
          </div>
        </div>

        {/* Manager */}
        <div className="card p-6">
          <AvailabilityBlockManager />
        </div>
      </main>
    </div>
  );
}
