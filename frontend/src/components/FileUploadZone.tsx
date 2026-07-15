import React, { useState, useRef } from 'react';
import { UploadCloud, CheckCircle, XCircle } from 'lucide-react';

interface FileUploadZoneProps {
  label: string;
  onUpload: (file: File) => Promise<string | null>;
  onChange: (url: string) => void;
  value?: string;
  accept?: string;
}

export function FileUploadZone({ label, onUpload, onChange, value, accept = "image/*" }: FileUploadZoneProps) {
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError(null);
    setLoading(true);
    try {
      const url = await onUpload(file);
      if (url) {
        onChange(url);
      } else {
        setError('Error al subir el archivo');
      }
    } catch (err: any) {
      setError(err.message || 'Error inesperado');
    } finally {
      setLoading(false);
    }
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => {
    setIsDragging(false);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFile(e.dataTransfer.files[0]);
    }
  };

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFile(e.target.files[0]);
    }
  };

  return (
    <div className="w-full">
      <span className="block text-sm font-semibold text-[#191c1e] mb-2">{label}</span>
      <div
        className={`border-2 border-dashed rounded-xl p-6 flex flex-col items-center justify-center transition-colors cursor-pointer
          ${isDragging ? 'border-[#004ac6] bg-blue-50' : 'border-[#b7c8e1] hover:bg-[#f7f9fb]'}
          ${error ? 'border-[#dc2626] bg-red-50' : ''}
          ${value ? 'border-green-500 bg-green-50' : ''}
        `}
        onDragOver={onDragOver}
        onDragLeave={onDragLeave}
        onDrop={onDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          type="file"
          ref={fileInputRef}
          className="hidden"
          accept={accept}
          onChange={onFileChange}
        />

        {loading ? (
          <div className="flex flex-col items-center text-[#505f76]">
            <div className="w-8 h-8 border-4 border-[#004ac6] border-t-transparent rounded-full animate-spin mb-2" />
            <span className="text-sm">Subiendo archivo...</span>
          </div>
        ) : value ? (
          <div className="flex flex-col items-center text-green-700">
            <CheckCircle className="w-8 h-8 mb-2" />
            <span className="text-sm font-medium">Archivo subido correctamente</span>
            <a href={value} target="_blank" rel="noreferrer" className="text-xs text-blue-600 hover:underline mt-1" onClick={(e) => e.stopPropagation()}>
              Ver archivo
            </a>
          </div>
        ) : (
          <div className="flex flex-col items-center text-[#505f76]">
            <UploadCloud className={`w-10 h-10 mb-3 ${error ? 'text-[#dc2626]' : 'text-[#004ac6]'}`} />
            <span className="text-sm font-medium text-center">
              Haz clic o arrastra tu archivo aquí
            </span>
            <span className="text-xs mt-1 text-center opacity-70">
              Archivos permitidos: {accept}
            </span>
            {error && (
              <span className="text-xs font-bold text-[#dc2626] mt-2 flex items-center gap-1">
                <XCircle className="w-4 h-4" /> {error}
              </span>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
