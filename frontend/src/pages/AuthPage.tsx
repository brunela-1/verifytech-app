import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Shield, CheckCircle, Clock, Star } from 'lucide-react';
import type { UserRole } from '../types';
import type { ReferralSource } from '../api/metrics';

export default function AuthPage() {
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState<UserRole>('client');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [specialty, setSpecialty] = useState('');
  const [experienceYears, setExperienceYears] = useState('');
  const [referralSource, setReferralSource] = useState<ReferralSource | ''>('');
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!isLogin && password !== confirmPassword) {
      setError('Las contraseñas no coinciden');
      return;
    }

    if (!isLogin && !referralSource) {
      setError('¿Cómo conociste la aplicación? Es obligatorio seleccionar una opción.');
      return;
    }

    setLoading(true);

    try {
      if (isLogin) {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: {
              role,
              full_name: fullName,
              referral_source: referralSource,
              ...(role === 'tech' ? {
                specialty,
                experience_years: parseInt(experienceYears) || 0
              } : {})
            },
          },
        });
        if (error) throw error;
        // The App component's AuthGuard will handle redirection after AuthContext updates
      }
    } catch (err: any) {
      setError(err.message || 'Error en la autenticación');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#f7f9fb]">
      {/* Left Panel */}
      <div className="hidden md:flex flex-col justify-between w-1/2 bg-gradient-to-br from-[#004ac6] to-[#003ea8] text-white p-12 lg:p-20">
        <div>
          <div className="flex items-center gap-2 mb-16">
            <Shield className="w-10 h-10 text-white" />
            <span className="text-2xl font-black tracking-tight">VerifyTech</span>
          </div>
          
          <h1 className="text-4xl lg:text-5xl font-black leading-tight mb-6">
            Tu técnico de confianza, <br/> a un clic de distancia.
          </h1>
          <p className="text-blue-100 text-lg mb-12 max-w-md leading-relaxed">
            Conectamos a hogares con profesionales verificados para soluciones rápidas, seguras y garantizadas.
          </p>

          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <CheckCircle className="w-6 h-6 text-blue-200 shrink-0" />
              <div>
                <h3 className="font-bold text-white">Profesionales Verificados</h3>
                <p className="text-sm text-blue-100 mt-1">Todos los técnicos pasan por un riguroso proceso de validación.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Clock className="w-6 h-6 text-blue-200 shrink-0" />
              <div>
                <h3 className="font-bold text-white">Respuesta Rápida</h3>
                <p className="text-sm text-blue-100 mt-1">Coordina horarios que se ajusten a tu disponibilidad de manera instantánea.</p>
              </div>
            </div>
            <div className="flex items-start gap-4">
              <Star className="w-6 h-6 text-blue-200 shrink-0" />
              <div>
                <h3 className="font-bold text-white">Calidad Garantizada</h3>
                <p className="text-sm text-blue-100 mt-1">Califica y revisa reseñas para asegurar el mejor servicio posible.</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Form */}
      <div className="flex-1 flex flex-col justify-center px-6 py-12 lg:px-20 overflow-y-auto">
        <div className="w-full max-w-md mx-auto">
          {/* Mobile Logo */}
          <div className="flex md:hidden items-center gap-2 mb-8 justify-center">
            <Shield className="w-8 h-8 text-[#004ac6]" />
            <span className="text-xl font-black text-[#191c1e] tracking-tight">VerifyTech</span>
          </div>

          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold text-[#191c1e]">
              {isLogin ? 'Bienvenido a VerifyTech' : 'Crea tu cuenta'}
            </h2>
            <p className="text-[#505f76] mt-2 text-sm">
              {isLogin ? 'Ingresa tus credenciales para continuar' : 'Únete a nuestra plataforma hoy mismo'}
            </p>
          </div>

          {/* Role Toggle (Only on Register) */}
          {!isLogin && (
            <div className="flex p-1 bg-[#eceef0] rounded-xl mb-6">
              <button
                type="button"
                onClick={() => setRole('client')}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${role === 'client' ? 'bg-white text-[#004ac6] shadow-sm' : 'text-[#505f76] hover:text-[#191c1e]'}`}
              >
                Soy Cliente
              </button>
              <button
                type="button"
                onClick={() => setRole('tech')}
                className={`flex-1 py-2 text-sm font-semibold rounded-lg transition-all ${role === 'tech' ? 'bg-white text-[#004ac6] shadow-sm' : 'text-[#505f76] hover:text-[#191c1e]'}`}
              >
                Soy Técnico
              </button>
            </div>
          )}

          {error && (
            <div className="mb-6 p-4 bg-[#fee2e2] text-[#dc2626] rounded-xl text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="label">Nombre Completo</label>
                <input
                  type="text"
                  required
                  className="input"
                  placeholder="Juan Pérez"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            )}

            <div>
              <label className="label">Correo Electrónico</label>
              <input
                type="email"
                required
                className="input"
                placeholder="juan@ejemplo.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div>
              <label className="label">Contraseña</label>
              <input
                type="password"
                required
                className="input"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={6}
              />
            </div>

            {!isLogin && (
              <div>
                <label className="label">Confirmar Contraseña</label>
                <input
                  type="password"
                  required
                  className="input"
                  placeholder="••••••••"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={6}
                />
              </div>
            )}

            {!isLogin && role === 'tech' && (
              <div className="space-y-4 pt-2 border-t border-[#eceef0]">
                <h3 className="font-bold text-[#191c1e] text-sm">Datos Profesionales</h3>
                <div>
                  <label className="label">Especialidad Principal</label>
                  <input
                    type="text"
                    required
                    className="input"
                    placeholder="Ej. Electricista, Plomero..."
                    value={specialty}
                    onChange={(e) => setSpecialty(e.target.value)}
                  />
                </div>
                <div>
                  <label className="label">Años de Experiencia</label>
                  <input
                    type="number"
                    required
                    min="0"
                    className="input"
                    placeholder="Ej. 5"
                    value={experienceYears}
                    onChange={(e) => setExperienceYears(e.target.value)}
                  />
                </div>
              </div>
            )}

            {/* Referral source — solo en registro */}
            {!isLogin && (
              <div className="space-y-3 pt-2 border-t border-[#eceef0]">
                <h3 className="font-bold text-[#191c1e] text-sm">
                  ¿Cómo conociste la aplicación? <span className="text-[#dc2626]">*</span>
                </h3>
                {([
                  { value: 'friend_family',  label: 'Un amigo o familiar me la recomendó' },
                  { value: 'social_media',   label: 'Publicidad en Redes Sociales (Facebook / Instagram)' },
                  { value: 'hardware_store', label: 'Lo vi en un anuncio en una ferretera' },
                  { value: 'google_search',  label: 'Buscando en Google / Internet' },
                ] as { value: ReferralSource; label: string }[]).map((opt) => (
                  <label
                    key={opt.value}
                    className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                      referralSource === opt.value
                        ? 'border-[#004ac6] bg-blue-50'
                        : 'border-[#d8dde3] hover:border-[#004ac6] hover:bg-gray-50'
                    }`}
                  >
                    <input
                      type="radio"
                      name="referral_source"
                      value={opt.value}
                      checked={referralSource === opt.value}
                      onChange={() => setReferralSource(opt.value)}
                      className="accent-[#004ac6]"
                    />
                    <span className="text-sm text-[#191c1e]">{opt.label}</span>
                  </label>
                ))}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="btn btn-primary btn-full py-3 mt-6"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : isLogin ? 'Iniciar Sesión' : 'Registrarse'}
            </button>
          </form>

          <div className="mt-8 text-center text-sm">
            <span className="text-[#505f76]">
              {isLogin ? '¿No tienes una cuenta?' : '¿Ya tienes una cuenta?'}
            </span>{' '}
            <button
              onClick={() => {
                setIsLogin(!isLogin);
                setError(null);
              }}
              className="font-bold text-[#004ac6] hover:text-[#003ea8] transition-colors"
            >
              {isLogin ? 'Regístrate aquí' : 'Inicia Sesión'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
