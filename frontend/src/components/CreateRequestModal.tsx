/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { X, Wrench, Shield, AlertTriangle, Camera, UploadCloud, Check } from 'lucide-react';

interface CreateRequestModalProps {
  onClose: () => void;
  onSubmit: (title: string, category: string, budget: string, description: string, evidenceImage: string) => void;
}

export default function CreateRequestModal({ onClose, onSubmit }: CreateRequestModalProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('Fontanería');
  const [budget, setBudget] = useState('S/. 120');
  const [description, setDescription] = useState('');
  
  // Evidencias state
  const [attachedEvidence, setAttachedEvidence] = useState<string>('');
  const [isSimulatingUpload, setIsSimulatingUpload] = useState(false);

  const simulateEvidenceUpload = (type: 'faucet' | 'panel' | 'leak') => {
    setIsSimulatingUpload(true);
    setTimeout(() => {
      if (type === 'faucet') {
        setAttachedEvidence('https://images.unsplash.com/photo-1584622650111-993a426fbf0a?auto=format&fit=crop&w=600&q=80');
      } else if (type === 'panel') {
        setAttachedEvidence('https://images.unsplash.com/photo-1544725176-7c40e5a71c5e?auto=format&fit=crop&w=400&q=80');
      } else {
        setAttachedEvidence('https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=400&q=80');
      }
      setIsSimulatingUpload(false);
    }, 850);
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) return;
    
    // Choose fallback evidence photo if not manually attached
    const fallbackPhoto = attachedEvidence || 'https://images.unsplash.com/photo-1504307651254-35680f356dfd?auto=format&fit=crop&w=400&q=80';

    onSubmit(
      title.toUpperCase().includes('FUGA') ? title : `Reparación: ${title}`,
      category,
      budget,
      description,
      fallbackPhoto
    );
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-surface-lowest rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl border border-surface-highest animate-scale-up">
        {/* Header decoration */}
        <div className="bg-primary-brand text-white p-5 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Wrench className="w-5 h-5 text-white animate-pulse" />
            <span className="font-extrabold text-base tracking-tight">Crear Nueva Solicitud</span>
          </div>
          <button 
            onClick={onClose} 
            className="text-white/80 hover:text-white p-1 rounded-full hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Input body fields */}
        <form onSubmit={handleFormSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
          <div>
            <label className="block text-xs font-bold text-text-on-surface mb-1">Título del problema</label>
            <input
              type="text"
              required
              placeholder="Ej. Filtración de agua bajo lavabo de cocina"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              className="w-full text-xs font-semibold px-3 py-2.5 border border-surface-highest rounded-lg bg-white text-text-on-surface focus:outline-none focus:border-primary-brand"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-text-on-surface mb-1">Categoría del Oficio</label>
              <select
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  if (e.target.value === 'Electricidad') {
                    setBudget('S/. 180');
                  } else {
                    setBudget('S/. 120');
                  }
                }}
                className="w-full text-xs font-semibold border border-surface-highest rounded-lg px-3 py-2.5 bg-white text-text-on-surface cursor-pointer focus:border-primary-brand focus:outline-none"
              >
                <option value="Fontanería">Fontanería / Gasfitería</option>
                <option value="Electricidad">Electricidad Domiciliaria</option>
                <option value="Gasfitería">Sistemas de Gas / Terma</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-text-on-surface mb-1">Tarifa Estimada (S/.)</label>
              <input
                type="text"
                required
                placeholder="Ej. S/. 150"
                value={budget}
                onChange={(e) => setBudget(e.target.value)}
                className="w-full text-xs font-semibold px-3 py-2.5 border border-surface-highest rounded-lg bg-white text-text-on-surface focus:outline-none focus:border-primary-brand"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-text-on-surface mb-1">Descripción del desperfecto</label>
            <textarea
              required
              rows={3}
              placeholder="Describe el desperfecto. ¿Hay goteo? ¿Cuándo ocurre? Esto ayuda al técnico a estimar mejor sus repuestos..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full text-xs font-medium p-3 border border-surface-highest rounded-lg bg-white text-text-on-surface focus:outline-none focus:border-primary-brand leading-relaxed"
            />
          </div>

          {/* Adjuntar evidencias fotográficas o esquemas */}
          <div className="space-y-1.5 border-t border-surface-high pt-3">
            <span className="block text-xs font-bold text-text-on-surface">Adjuntar Evidencia Fotográfica</span>
            
            {attachedEvidence ? (
              <div className="relative rounded-xl border border-verified-green overflow-hidden h-28">
                <img src={attachedEvidence} alt="Evidencia de falla" className="w-full h-full object-cover" />
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-[11px] font-bold gap-1.5">
                  <Check className="w-4.5 h-4.5 text-verified-green" />
                  Fotografía cargada con éxito para diagnóstico
                  <button 
                    type="button" 
                    onClick={() => setAttachedEvidence('')} 
                    className="absolute top-2 right-2 bg-error-red px-2 py-1 rounded text-[9px] hover:bg-error-red/90 cursor-pointer"
                  >
                    Quitar
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 border border-dashed border-surface-highest bg-surface-low/40 rounded-xl space-y-2 text-center">
                <Camera className="w-6 h-6 text-primary-brand/80 mx-auto" />
                <div>
                  <span className="block text-[11px] font-bold text-text-on-surface">Simular adjunto de fotografía real de la avería</span>
                  <span className="block text-[9px] text-text-on-surface-variant">Selecciona un archivo predefinido para probar:</span>
                </div>

                <div className="flex gap-2 justify-center pt-1">
                  <button
                    type="button"
                    onClick={() => simulateEvidenceUpload('faucet')}
                    disabled={isSimulatingUpload}
                    className="py-1 px-2.5 bg-white border border-surface-highest hover:border-primary-brand rounded text-[10px] font-bold text-text-on-surface transition-colors cursor-pointer"
                  >
                    Filtración Grifo
                  </button>
                  <button
                    type="button"
                    onClick={() => simulateEvidenceUpload('panel')}
                    disabled={isSimulatingUpload}
                    className="py-1 px-2.5 bg-white border border-surface-highest hover:border-primary-brand rounded text-[10px] font-bold text-text-on-surface transition-colors cursor-pointer"
                  >
                    Tablero Eléctrico
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Secure Trust Stamp */}
          <div className="bg-verified-green/5 border border-verified-green/10 rounded-xl p-3 flex gap-2">
            <Shield className="w-5 h-5 text-verified-green flex-shrink-0 mt-0.5" />
            <p className="text-[10px] text-text-on-surface-variant leading-normal font-medium">
              Su solicitud se publicará de inmediato. Todo acuerdo de servicio se realiza de mutuo acuerdo bajo palabra y conformidad de las partes. No pagas al técnico hasta constatar la reparación.
            </p>
          </div>

          {/* Buttons */}
          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-grow py-2.5 bg-surface-low hover:bg-surface-high border border-surface-highest rounded-xl text-xs font-bold text-text-on-surface cursor-pointer text-center"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-grow py-2.5 bg-primary-brand hover:bg-primary-hover text-white rounded-xl text-xs font-bold cursor-pointer transition-all shadow-md text-center"
            >
              {isSimulatingUpload ? 'Cargando evidencia...' : 'Publicar Solicitud'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
