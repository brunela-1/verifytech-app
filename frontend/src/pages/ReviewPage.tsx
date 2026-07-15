import React, { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import TopNavBar from '../components/TopNavBar';
import StarRatingInput from '../components/StarRatingInput';
import { createReview } from '../api/reviews';

const ratingLabels: Record<number, { text: string; color: string }> = {
  1: { text: 'Muy malo', color: 'text-red-500' },
  2: { text: 'Malo', color: 'text-orange-500' },
  3: { text: 'Regular', color: 'text-amber-500' },
  4: { text: 'Bueno', color: 'text-[#16a34a]' },
  5: { text: 'Excelente', color: 'text-[#004ac6]' },
};

export default function ReviewPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id || rating === 0) return;

    setLoading(true);
    try {
      await createReview({ service_id: id, rating, comment });
      setSubmitted(true);
      setTimeout(() => navigate('/dashboard'), 2500);
    } catch (err: any) {
      alert(err.response?.data?.detail || 'Error al enviar reseña. Por favor intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-[#f7f9fb] flex flex-col">
        <TopNavBar />
        <div className="flex-1 flex items-center justify-center p-4">
          <div className="card p-10 max-w-md w-full text-center animate-scale-in">
            <div className="text-7xl mb-6 animate-bounce">🎉</div>
            <h2 className="text-2xl font-black text-[#191c1e] mb-3">¡Gracias por tu reseña!</h2>
            <p className="text-[#505f76] mb-4">
              Tu opinión ayuda a mantener la calidad de la plataforma y guía a otros clientes.
            </p>
            <div className="flex justify-center pointer-events-none mb-4">
              <StarRatingInput value={rating} onChange={() => {}} readonly />
            </div>
            <p className="text-sm text-[#94a3b8]">Redirigiendo al panel principal...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f7f9fb] flex flex-col">
      <TopNavBar showBack backTo="/dashboard" title="Calificar Servicio" />

      <main className="flex-1 flex items-center justify-center p-4 py-8">
        <div className="card max-w-lg w-full overflow-hidden animate-fade-in">
          {/* Header gradient */}
          <div className="bg-gradient-to-br from-[#004ac6] to-[#1d4ed8] p-8 text-center text-white">
            <div className="text-6xl mb-4">⭐</div>
            <h1 className="text-2xl font-black mb-2">¿Cómo fue tu experiencia?</h1>
            <p className="text-blue-200 text-sm">
              Tu opinión es muy valiosa y ayuda a mejorar el servicio
            </p>
          </div>

          <div className="p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Star rating */}
              <div className="text-center">
                <p className="text-sm font-semibold text-[#505f76] mb-4">
                  Toca las estrellas para calificar
                </p>
                <div className="flex justify-center mb-3">
                  <StarRatingInput value={rating} onChange={setRating} />
                </div>
                {rating > 0 ? (
                  <p className={`text-sm font-bold transition-all ${ratingLabels[rating].color}`}>
                    {ratingLabels[rating].text}
                  </p>
                ) : (
                  <p className="text-sm text-red-400 font-medium">
                    Por favor selecciona una calificación
                  </p>
                )}
              </div>

              {/* Visual rating bar */}
              {rating > 0 && (
                <div className="flex gap-1 animate-fade-in">
                  {[1, 2, 3, 4, 5].map(n => (
                    <div
                      key={n}
                      className={`flex-1 h-2 rounded-full transition-all duration-300 ${
                        n <= rating ? 'bg-[#004ac6]' : 'bg-[#eceef0]'
                      }`}
                    />
                  ))}
                </div>
              )}

              {/* Comment */}
              <div>
                <label className="label">
                  Comentario{' '}
                  <span className="text-[#94a3b8] font-normal text-xs ml-1">(Opcional)</span>
                </label>
                <textarea
                  className="input"
                  placeholder="Cuéntanos más sobre el trabajo realizado, puntualidad, limpieza, etc..."
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  rows={4}
                />
                <p className="text-xs text-[#94a3b8] mt-1 text-right">
                  {comment.length}/500 caracteres
                </p>
              </div>

              <button
                type="submit"
                disabled={loading || rating === 0}
                className="btn btn-primary btn-full py-4 text-base shadow-lg hover:shadow-xl"
              >
                {loading ? (
                  <>
                    <div className="spinner mr-2 border-white" />
                    Enviando reseña...
                  </>
                ) : (
                  '⭐ Enviar Calificación'
                )}
              </button>

              <p className="text-xs text-center text-[#94a3b8]">
                Al enviar tu reseña aceptas que será visible públicamente en el perfil del técnico.
              </p>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
