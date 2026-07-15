import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, ChevronLeft, MapPin, CheckCircle } from 'lucide-react';
import TopNavBar from '../components/TopNavBar';
import CategoryGrid from '../components/CategoryGrid';
import { createRequest } from '../api/requests';
import { CATEGORIES } from '../types';
import { FileUploadZone } from '../components/FileUploadZone';
import { uploadRequestImage } from '../lib/storage';
import apiClient from '../api/client';

export default function CreateRequestPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form state
  const [category, setCategory] = useState('');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [address, setAddress] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [uploadingText, setUploadingText] = useState('');

  const handleNext = () => setStep(s => Math.min(s + 1, 4));
  const handleBack = () => setStep(s => Math.max(s - 1, 1));

  const handleSubmit = async () => {
    setLoading(true);
    setUploadingText('Creando solicitud...');
    try {
      const res = await createRequest({
        category,
        title,
        description,
        address,
      });
      
      const newRequestId = res.data.id;

      if (images.length > 0) {
        setUploadingText('Subiendo imágenes...');
        const uploadedUrls: string[] = [];
        for (const file of images) {
          const url = await uploadRequestImage(newRequestId, file);
          if (url) uploadedUrls.push(url);
        }
        
        if (uploadedUrls.length > 0) {
          setUploadingText('Guardando imágenes...');
          await apiClient.post(`/api/requests/${newRequestId}/images`, { image_urls: uploadedUrls });
        }
      }

      navigate('/dashboard');
    } catch (err: any) {
      const errorMessage = err.response?.data?.detail || err.message || 'Error al crear la solicitud';
      console.error('Error creating request:', err);
      alert(errorMessage);
      setLoading(false);
      setUploadingText('');
    }
  };

  const steps = ['Categoría', 'Detalles', 'Fotos', 'Confirmación'];

  return (
    <div className="min-h-screen bg-[#f7f9fb]">
      <TopNavBar showBack backTo="/dashboard" title="Nueva Solicitud" />

      <main className="max-w-3xl mx-auto px-4 py-8">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between items-center relative">
            <div className="absolute left-0 right-0 top-1/2 h-1 bg-[#eceef0] -z-10 -translate-y-1/2 rounded-full"></div>
            <div 
              className="absolute left-0 top-1/2 h-1 bg-[#004ac6] -z-10 -translate-y-1/2 rounded-full transition-all duration-300"
              style={{ width: `${((step - 1) / 3) * 100}%` }}
            ></div>
            
            {steps.map((s, idx) => {
              const num = idx + 1;
              const isActive = step >= num;
              return (
                <div key={num} className="flex flex-col items-center gap-2 bg-[#f7f9fb] px-2">
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm border-2 transition-colors duration-300 ${isActive ? 'bg-[#004ac6] border-[#004ac6] text-white' : 'bg-white border-[#eceef0] text-[#94a3b8]'}`}>
                    {step > num ? <CheckCircle className="w-5 h-5 text-white" /> : num}
                  </div>
                  <span className={`text-xs font-semibold ${isActive ? 'text-[#191c1e]' : 'text-[#94a3b8]'}`}>{s}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Wizard Content */}
        <div className="card p-6 md:p-8 animate-fade-in">
          {step === 1 && (
            <div>
              <h2 className="text-xl font-bold text-[#191c1e] mb-6 text-center">¿Qué tipo de servicio necesitas?</h2>
              <CategoryGrid value={category} onChange={setCategory} />
            </div>
          )}

          {step === 2 && (
            <div className="space-y-5 animate-slide-in">
              <h2 className="text-xl font-bold text-[#191c1e] mb-6">Detalles del problema</h2>
              
              <div>
                <label className="label">Título breve</label>
                <input
                  type="text"
                  className="input"
                  placeholder="Ej. Fuga de agua en el baño"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                />
              </div>

              <div>
                <label className="label">Dirección del servicio</label>
                <div className="input-icon-wrap">
                  <MapPin className="input-icon" />
                  <input
                    type="text"
                    className="input"
                    placeholder="Ej. Av. Primavera 123, Surco"
                    value={address}
                    onChange={e => setAddress(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label className="label">Descripción (Opcional)</label>
                <textarea
                  className="input"
                  placeholder="Da más detalles para que los técnicos puedan darte una mejor propuesta..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                />
              </div>
            </div>
          )}

          {step === 3 && (
            <div className="py-4 animate-slide-in">
              <h2 className="text-xl font-bold text-[#191c1e] mb-2 text-center">Adjuntar Fotos</h2>
              <p className="text-[#505f76] text-center max-w-sm mx-auto mb-6 text-sm">
                Selecciona las imágenes que ayuden a describir mejor el problema (opcional).
              </p>
              
              <div className="space-y-4">
                <FileUploadZone
                  label="Añadir Imagen"
                  onUpload={async (file) => {
                    setImages(prev => [...prev, file]);
                    return URL.createObjectURL(file); // Temporary mock URL just to show success checkmark
                  }}
                  onChange={() => {}}
                />
                
                {images.length > 0 && (
                  <div className="mt-4">
                    <p className="text-sm font-semibold text-[#191c1e] mb-2">Imágenes a subir:</p>
                    <ul className="space-y-2">
                      {images.map((f, i) => (
                        <li key={i} className="flex items-center justify-between bg-[#eceef0] p-2 rounded-lg text-sm">
                          <span className="truncate max-w-[200px]">{f.name}</span>
                          <button onClick={() => setImages(prev => prev.filter((_, idx) => idx !== i))} className="text-red-500 hover:text-red-700 font-bold">X</button>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 4 && (
            <div className="animate-slide-in">
              <h2 className="text-xl font-bold text-[#191c1e] mb-6 text-center">Confirma tu solicitud</h2>
              
              <div className="bg-[#f7f9fb] rounded-xl p-6 border border-[#eceef0] space-y-4">
                <div className="flex items-center gap-3 pb-4 border-b border-[#eceef0]">
                  <div className="w-12 h-12 rounded-full bg-[#004ac6]/10 flex items-center justify-center text-xl">
                    {CATEGORIES.find(c => c.key === category)?.icon ? '🛠️' : '🔧'}
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-[#505f76] uppercase tracking-wider">Categoría</p>
                    <p className="font-bold text-[#191c1e]">{CATEGORIES.find(c => c.key === category)?.label || category}</p>
                  </div>
                </div>

                <div>
                  <p className="text-xs font-semibold text-[#505f76] uppercase tracking-wider mb-1">Título</p>
                  <p className="font-medium text-[#191c1e]">{title}</p>
                </div>

                <div>
                  <p className="text-xs font-semibold text-[#505f76] uppercase tracking-wider mb-1">Dirección</p>
                  <p className="font-medium text-[#191c1e] flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-[#94a3b8]" /> {address}
                  </p>
                </div>

                {description && (
                  <div>
                    <p className="text-xs font-semibold text-[#505f76] uppercase tracking-wider mb-1">Descripción</p>
                    <p className="font-medium text-[#191c1e]">{description}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Navigation Buttons */}
        <div className="mt-8 flex justify-between">
          <button
            className="btn btn-ghost"
            onClick={handleBack}
            disabled={step === 1 || loading}
          >
            <ChevronLeft className="w-5 h-5" />
            Atrás
          </button>

          {step < 4 ? (
            <button
              className="btn btn-primary"
              onClick={handleNext}
              disabled={
                (step === 1 && !category) ||
                (step === 2 && (!title || !address))
              }
            >
              Continuar
              <ChevronRight className="w-5 h-5" />
            </button>
          ) : (
            <button
              className="btn btn-primary px-8"
              onClick={handleSubmit}
              disabled={loading}
            >
              {loading ? (
                <>
                  <div className="spinner mr-2"></div>
                  {uploadingText}
                </>
              ) : 'Confirmar Solicitud'}
            </button>
          )}
        </div>
      </main>
    </div>
  );
}
