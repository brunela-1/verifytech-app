import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import TopNavBar from '../components/TopNavBar';
import TechVerificationBadge from '../components/TechVerificationBadge';
import StarRatingInput from '../components/StarRatingInput';
import { getTechPublic } from '../api/techs';
import { getTechReviews } from '../api/reviews';
import { Briefcase, Award } from 'lucide-react';

export default function TechPublicProfile() {
  const { id } = useParams<{ id: string }>();
  const [profile, setProfile] = useState<any>(null);
  const [reviews, setReviews] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    Promise.all([getTechPublic(id), getTechReviews(id)])
      .then(([pRes, rRes]) => {
        setProfile(pRes.data);
        setReviews(rRes.data);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-[#f7f9fb] flex flex-col">
      <TopNavBar />
      <div className="flex-1 flex justify-center items-center"><div className="spinner text-[#004ac6] w-10 h-10 border-4" /></div>
    </div>
  );

  if (!profile) return (
    <div className="min-h-screen bg-[#f7f9fb]">
      <TopNavBar />
      <div className="text-center py-12 font-bold text-red-500">Técnico no encontrado</div>
    </div>
  );

  return (
    <div className="min-h-screen bg-[#f7f9fb]">
      <TopNavBar title="Perfil del Técnico" showBack />

      <main className="max-w-3xl mx-auto px-4 py-12 space-y-6">
        {/* Header Card */}
        <div className="card p-8 flex flex-col md:flex-row items-center md:items-start gap-8 relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-[#004ac6] to-[#003ea8]"></div>
          
          <div className="relative z-10 w-32 h-32 rounded-full bg-white border-4 border-white shadow-lg overflow-hidden flex items-center justify-center text-4xl font-black text-[#004ac6] shrink-0">
            {profile.photo_url ? (
              <img src={profile.photo_url} alt="Profile" className="w-full h-full object-cover" />
            ) : (
              profile.full_name.charAt(0).toUpperCase()
            )}
          </div>

          <div className="relative z-10 flex-1 text-center md:text-left pt-2 md:pt-12">
            <h1 className="text-3xl font-black text-[#191c1e]">{profile.full_name}</h1>
            
            <div className="flex flex-wrap justify-center md:justify-start items-center gap-3 mt-3">
              <TechVerificationBadge status={profile.verification_status} />
              {profile.specialty && (
                <span className="flex items-center gap-1 text-sm font-semibold text-[#505f76] bg-[#eceef0] px-3 py-1 rounded-full">
                  <Briefcase className="w-4 h-4" /> {profile.specialty}
                </span>
              )}
              {profile.experience_years > 0 && (
                <span className="flex items-center gap-1 text-sm font-semibold text-[#505f76] bg-[#eceef0] px-3 py-1 rounded-full">
                  <Award className="w-4 h-4" /> {profile.experience_years} años exp.
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-6">
            <div className="card p-6 text-center">
              <h3 className="font-bold text-[#191c1e] mb-2">Reputación</h3>
              <div className="text-5xl font-black text-[#191c1e] mb-2">{profile.rating_avg}</div>
              <div className="flex justify-center mb-2 pointer-events-none">
                <StarRatingInput value={Math.round(profile.rating_avg)} onChange={()=>{}} readonly />
              </div>
              <p className="text-[#505f76] text-sm">{profile.reviews_count} reseñas</p>
            </div>
          </div>

          <div className="md:col-span-2 space-y-6">
            <div className="card p-6">
              <h3 className="font-bold text-[#191c1e] mb-4">Acerca de mí</h3>
              <p className="text-[#434655] whitespace-pre-wrap leading-relaxed">
                {profile.description || 'Este técnico aún no ha agregado una descripción.'}
              </p>
            </div>

            <div className="card p-6">
              <h3 className="font-bold text-[#191c1e] mb-6">Reseñas de Clientes</h3>
              {reviews.length === 0 ? (
                <p className="text-[#505f76] text-sm">Aún no hay reseñas.</p>
              ) : (
                <div className="space-y-4">
                  {reviews.map(r => (
                    <div key={r.id} className="pb-4 border-b border-[#eceef0] last:border-0 last:pb-0">
                      <div className="flex justify-between items-start mb-2">
                        <div className="pointer-events-none scale-75 origin-left">
                          <StarRatingInput value={r.rating} onChange={()=>{}} readonly />
                        </div>
                        <span className="text-xs text-[#94a3b8]">
                          {new Date(r.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      {r.comment && <p className="text-[#434655] text-sm italic">"{r.comment}"</p>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

      </main>
    </div>
  );
}
