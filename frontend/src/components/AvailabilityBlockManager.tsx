import React, { useEffect, useState } from 'react';
import { Plus, Trash2, Calendar, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { getMyBlocks, createBlock, deleteBlock } from '../api/availability';
import type { AvailabilityBlockData } from '../types';

interface AvailabilityBlockManagerProps {
  /** If provided, show as a compact embedded widget */
  compact?: boolean;
  /** Callback when blocks change (optional) */
  onBlocksChange?: (blocks: AvailabilityBlockData[]) => void;
}

export default function AvailabilityBlockManager({ compact = false, onBlocksChange }: AvailabilityBlockManagerProps) {
  const [blocks, setBlocks] = useState<AvailabilityBlockData[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [dayLabel, setDayLabel] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchBlocks();
  }, []);

  const fetchBlocks = async () => {
    setLoading(true);
    try {
      const res = await getMyBlocks();
      setBlocks(res.data);
      onBlocksChange?.(res.data);
    } catch {
      setError('No se pudieron cargar los horarios.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    e.stopPropagation(); // Prevent event from bubbling to parent forms
    if (!dayLabel || !startTime || !endTime) return;
    setSubmitting(true);
    setError(null);
    try {
      await createBlock({
        day_label: dayLabel,
        start_time: startTime + ':00',
        end_time: endTime + ':00',
      });
      setShowForm(false);
      setDayLabel('');
      setStartTime('');
      setEndTime('');
      await fetchBlocks();
    } catch {
      setError('Error al crear el bloque de disponibilidad.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('¿Eliminar este bloque de disponibilidad?')) return;
    try {
      await deleteBlock(id);
      const updated = blocks.filter(b => b.id !== id);
      setBlocks(updated);
      onBlocksChange?.(updated);
    } catch {
      setError('No se pudo eliminar el bloque.');
    }
  };

  if (compact) {
    return (
      <div className="space-y-3">
        {error && (
          <div className="flex items-center gap-2 bg-red-50 text-red-700 text-xs p-3 rounded-xl border border-red-200">
            <AlertCircle className="w-4 h-4 shrink-0" />
            {error}
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-4">
            <div className="spinner text-[#004ac6] w-5 h-5" />
          </div>
        ) : (
          <>
            {blocks.length === 0 && !showForm && (
              <p className="text-xs text-[#94a3b8] text-center py-3">
                Sin horarios configurados
              </p>
            )}

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {blocks.map(b => (
                <div
                  key={b.id}
                  className={`flex items-center justify-between gap-2 px-3 py-2 rounded-xl border text-xs ${
                    b.status === 'available'
                      ? 'border-[#16a34a]/30 bg-[#16a34a]/5'
                      : 'border-[#eceef0] bg-[#f7f9fb] opacity-60'
                  }`}
                >
                  <span className="font-semibold text-[#191c1e] truncate">{b.day_label}</span>
                  <span className="text-[#505f76] shrink-0">
                    {b.start_time.slice(0, 5)} – {b.end_time.slice(0, 5)}
                  </span>
                  {b.status === 'available' ? (
                    <button
                      onClick={() => handleDelete(b.id)}
                      className="p-1 text-red-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors shrink-0"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  ) : (
                    <CheckCircle className="w-3.5 h-3.5 text-[#94a3b8] shrink-0" />
                  )}
                </div>
              ))}
            </div>

            {showForm ? (
              <form onSubmit={handleSubmit} className="bg-[#f7f9fb] rounded-xl border border-[#eceef0] p-3 space-y-2">
                <input
                  type="text"
                  placeholder="Día (ej. Lunes o 2026-07-01)"
                  className="input text-xs py-1.5"
                  value={dayLabel}
                  onChange={e => setDayLabel(e.target.value)}
                  required
                />
                <div className="grid grid-cols-2 gap-2">
                  <input
                    type="time"
                    className="input text-xs py-1.5"
                    value={startTime}
                    onChange={e => setStartTime(e.target.value)}
                    required
                  />
                  <input
                    type="time"
                    className="input text-xs py-1.5"
                    value={endTime}
                    onChange={e => setEndTime(e.target.value)}
                    required
                  />
                </div>
                <div className="flex gap-2">
                  <button type="submit" disabled={submitting} className="btn btn-primary btn-sm flex-1 py-1.5 text-xs">
                    {submitting ? 'Guardando...' : 'Guardar'}
                  </button>
                  <button type="button" onClick={() => setShowForm(false)} className="btn btn-ghost btn-sm py-1.5 text-xs">
                    Cancelar
                  </button>
                </div>
              </form>
            ) : (
              <button
                onClick={() => setShowForm(true)}
                className="w-full flex items-center justify-center gap-1.5 text-xs font-semibold text-[#004ac6] hover:bg-[#004ac6]/5 py-2 rounded-xl border border-dashed border-[#004ac6]/30 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Agregar horario
              </button>
            )}
          </>
        )}
      </div>
    );
  }

  // Full view
  return (
    <div>
      {error && (
        <div className="mb-4 flex items-center gap-2 bg-red-50 text-red-700 text-sm p-3 rounded-xl border border-red-200">
          <AlertCircle className="w-4 h-4 shrink-0" />
          {error}
        </div>
      )}

      <div className="flex justify-between items-center mb-4">
        <h3 className="font-bold text-[#191c1e] flex items-center gap-2">
          <Calendar className="w-4 h-4 text-[#004ac6]" />
          Mis Horarios Disponibles
        </h3>
        <button onClick={() => setShowForm(!showForm)} className="btn btn-secondary btn-sm">
          {showForm ? 'Cancelar' : <><Plus className="w-3.5 h-3.5" /> Agregar</>}
        </button>
      </div>

      {showForm && (
        <form onSubmit={handleSubmit} className="card p-5 mb-5 border-t-4 border-[#004ac6] animate-slide-in">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="label">Día / Fecha</label>
              <div className="relative">
                <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
                <input
                  type="text"
                  required
                  placeholder="Ej. Lunes o 2026-07-01"
                  className="input pl-9"
                  value={dayLabel}
                  onChange={e => setDayLabel(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="label">Hora de Inicio</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
                <input
                  type="time"
                  required
                  className="input pl-9"
                  value={startTime}
                  onChange={e => setStartTime(e.target.value)}
                />
              </div>
            </div>
            <div>
              <label className="label">Hora de Fin</label>
              <div className="relative">
                <Clock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
                <input
                  type="time"
                  required
                  className="input pl-9"
                  value={endTime}
                  onChange={e => setEndTime(e.target.value)}
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end mt-4">
            <button type="submit" disabled={submitting} className="btn btn-primary">
              {submitting ? 'Guardando...' : 'Guardar Horario'}
            </button>
          </div>
        </form>
      )}

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-white rounded-xl animate-pulse border border-[#eceef0]" />
          ))}
        </div>
      ) : blocks.length === 0 ? (
        <div className="empty-state bg-white rounded-2xl border border-[#eceef0]">
          <span className="empty-state-icon">🗓️</span>
          <p className="font-semibold text-[#191c1e]">Sin horarios configurados</p>
          <p className="text-sm text-[#505f76] mt-1 text-center max-w-xs">
            Agrega tus bloques de disponibilidad para que los clientes puedan agendar contigo.
          </p>
        </div>
      ) : (
        <div className="space-y-2">
          {blocks.map(b => (
            <div
              key={b.id}
              className={`flex items-center justify-between p-4 rounded-xl border-l-4 bg-white border shadow-sm ${
                b.status === 'available'
                  ? 'border-l-[#16a34a] border-[#eceef0]'
                  : 'border-l-[#94a3b8] border-[#eceef0] opacity-75'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-6">
                <div className="flex items-center gap-2 font-bold text-[#191c1e]">
                  <Calendar className="w-4 h-4 text-[#004ac6]" />
                  {b.day_label}
                </div>
                <div className="flex items-center gap-2 text-[#505f76] text-sm">
                  <Clock className="w-4 h-4" />
                  {b.start_time.slice(0, 5)} — {b.end_time.slice(0, 5)}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`badge ${b.status === 'available' ? 'badge-green' : 'badge-gray'}`}>
                  {b.status === 'available' ? 'Disponible' : 'Reservado'}
                </span>
                {b.status === 'available' ? (
                  <button
                    onClick={() => handleDelete(b.id)}
                    className="p-2 text-[#dc2626] hover:bg-red-50 rounded-lg transition-colors"
                    title="Eliminar bloque"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                ) : (
                  <div className="p-2">
                    <Trash2 className="w-4 h-4 text-[#e0e3e5] cursor-not-allowed" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
