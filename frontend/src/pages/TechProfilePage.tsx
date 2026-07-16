import React, { useEffect, useState } from 'react';
import TopNavBar from '../components/TopNavBar';
import TechVerificationBadge from '../components/TechVerificationBadge';
import { getMyTechProfile, updateMyTechProfile, uploadDocuments } from '../api/techs';
import { useAuth } from '../store/AuthContext';
import { User, Briefcase, Award, Link as LinkIcon, Star } from 'lucide-react';
import StarRatingInput from '../components/StarRatingInput';
import type { TechProfileData } from '../types';
import { FileUploadZone } from '../components/FileUploadZone';
import { uploadTechDoc, uploadProfilePhoto } from '../lib/storage';

export default function TechProfilePage() {
  const { user } = useAuth();
  const [profile, setProfile] = useState<TechProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  // Form 1
  const [fullName, setFullName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [experience, setExperience] = useState('');
  const [description, setDescription] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');
  const [savingInfo, setSavingInfo] = useState(false);

  // Form 2
  const [dniFront, setDniFront] = useState('');
  const [dniBack, setDniBack] = useState('');
  const [certUrl, setCertUrl] = useState('');
  const [savingDocs, setSavingDocs] = useState(false);

  useEffect(() => {
    getMyTechProfile()
      .then(res => {
        const p = res.data;
        setProfile(p);
        setFullName(p.full_name || user?.user_metadata?.full_name || '');
        setSpecialty(p.specialty || '');
        setExperience(p.experience_years ? String(p.experience_years) : '');
        setDescription(p.description || '');
        setPhotoUrl(p.photo_url || '');
      })
      .finally(() => setLoading(false));
  }, [user]);

  const handleSaveInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingInfo(true);
    try {
      const res = await updateMyTechProfile({
        full_name: fullName,
        specialty,
        experience_years: parseInt(experience) || 0,
        description,
        photo_url: photoUrl
      });
      setProfile(res.data);
      alert('Información guardada con éxito.');
    } catch {
      alert('Error al guardar.');
    } finally {
      setSavingInfo(false);
    }
  };

  const handleSaveDocs = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingDocs(true);
    try {
      const res = await uploadDocuments({
        dni_front_url: dniFront,
        dni_back_url: dniBack,
        cert_url: certUrl
      });
      setProfile(res.data);
      alert('Documentos enviados a verificación.');
    } catch {
      alert('Error al guardar documentos.');
    } finally {
      setSavingDocs(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen bg-[#f7f9fb] flex flex-col">
      <TopNavBar />
      <div className="flex-1 flex justify-center items-center"><div className="spinner text-[#004ac6] w-10 h-10 border-4" /></div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f7f9fb]">
      <TopNavBar title="Mi Perfil Técnico" />

      <main className="max-w-4xl mx-auto px-4 py-8 grid md:grid-cols-2 gap-8">
        
        {/* Left Col: Public Info */}
        <div className="space-y-6">
          <div className="card p-6">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-xl font-bold text-[#191c1e] flex items-center gap-2">
                <User className="text-[#004ac6] w-5 h-5" /> Información Pública
              </h2>
              {profile && (
                <div className="text-right">
                  <div className="flex items-center gap-1 justify-end pointer-events-none scale-75 origin-right">
                    <StarRatingInput value={Math.round(profile.rating_avg || 0)} onChange={()=>{}} readonly />
                  </div>
                  <p className="text-xs text-[#505f76] font-medium mt-1">
                    {profile.rating_avg.toFixed(1)} ({profile.reviews_count} {profile.reviews_count === 1 ? 'reseña' : 'reseñas'})
                  </p>
                </div>
              )}
            </div>
            <form onSubmit={handleSaveInfo} className="space-y-4">
              <div>
                <label className="label">Nombre Completo</label>
                <input type="text" className="input" value={fullName} onChange={e=>setFullName(e.target.value)} required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label">Especialidad Principal</label>
                  <div className="relative">
                    <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
                    <input type="text" className="input pl-9" placeholder="Ej. Electricista" value={specialty} onChange={e=>setSpecialty(e.target.value)} />
                  </div>
                </div>
                <div>
                  <label className="label">Años de Experiencia</label>
                  <div className="relative">
                    <Award className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[#94a3b8]" />
                    <input type="number" min="0" className="input pl-9" placeholder="Ej. 5" value={experience} onChange={e=>setExperience(e.target.value)} />
                  </div>
                </div>
              </div>
              <div>
                <label className="label">Acerca de mí</label>
                <textarea className="input" rows={4} placeholder="Cuenta a los clientes sobre tu trabajo..." value={description} onChange={e=>setDescription(e.target.value)} />
              </div>
              <div>
                <FileUploadZone
                  label="Foto de Perfil"
                  value={photoUrl}
                  onChange={setPhotoUrl}
                  onUpload={(file) => uploadProfilePhoto(user!.id, file)}
                />
              </div>
              <button type="submit" disabled={savingInfo} className="btn btn-primary btn-full mt-2">
                {savingInfo ? 'Guardando...' : 'Guardar Información'}
              </button>
            </form>
          </div>
        </div>

        {/* Right Col: Verification */}
        <div className="space-y-6">
          <div className="card p-6 border-t-4 border-[#004ac6]">
            <div className="flex justify-between items-start mb-6">
              <h2 className="text-xl font-bold text-[#191c1e]">Verificación</h2>
              <TechVerificationBadge status={profile?.verification_status as any || 'pending'} />
            </div>

            <div className="bg-blue-50/50 p-4 rounded-xl border border-blue-100 mb-6 text-sm text-[#434655]">
              Sube tus documentos oficiales. Las imágenes se guardarán de forma segura para validación.
            </div>

            <form onSubmit={handleSaveDocs} className="space-y-6">
              <FileUploadZone
                label="DNI Frontal"
                value={dniFront}
                onChange={setDniFront}
                onUpload={(file) => uploadTechDoc(user!.id, 'dni-front', file)}
              />
              <FileUploadZone
                label="DNI Reverso"
                value={dniBack}
                onChange={setDniBack}
                onUpload={(file) => uploadTechDoc(user!.id, 'dni-back', file)}
              />
              <FileUploadZone
                label="Certificado (Opcional)"
                value={certUrl}
                onChange={setCertUrl}
                onUpload={(file) => uploadTechDoc(user!.id, 'cert', file)}
              />
              <button type="submit" disabled={savingDocs} className="btn btn-primary btn-full mt-2">
                {savingDocs ? 'Enviando...' : 'Enviar a Verificación'}
              </button>
            </form>
          </div>
        </div>

      </main>
    </div>
  );
}
