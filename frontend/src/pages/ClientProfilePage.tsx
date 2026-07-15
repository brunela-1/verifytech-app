import React, { useState, useEffect } from 'react';
import { User, Mail, MapPin, Phone } from 'lucide-react';
import TopNavBar from '../components/TopNavBar';
import { useAuth } from '../store/AuthContext';
import { supabase } from '../lib/supabase';

export default function ClientProfilePage() {
  const { user } = useAuth();
  
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState<{ type: 'error' | 'success', text: string } | null>(null);

  useEffect(() => {
    if (user?.user_metadata) {
      setFullName(user.user_metadata.full_name || '');
      setPhone(user.user_metadata.phone || '');
      setAddress(user.user_metadata.address || '');
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMsg(null);
    try {
      const { error } = await supabase.auth.updateUser({
        data: { full_name: fullName, phone, address }
      });
      if (error) throw error;
      setMsg({ type: 'success', text: 'Perfil actualizado exitosamente' });
    } catch (err: any) {
      setMsg({ type: 'error', text: err.message || 'Error al actualizar' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f7f9fb]">
      <TopNavBar title="Mi Perfil" />

      <main className="max-w-xl mx-auto px-4 py-12">
        <div className="card p-8 animate-slide-in">
          <div className="flex flex-col items-center mb-8">
            <div className="w-24 h-24 bg-[#004ac6] text-white rounded-full flex items-center justify-center text-3xl font-bold mb-4 shadow-md">
              {fullName.charAt(0).toUpperCase() || 'C'}
            </div>
            <h1 className="text-2xl font-bold text-[#191c1e]">{fullName || 'Usuario Cliente'}</h1>
            <p className="text-[#505f76] flex items-center gap-1 mt-1">
              <Mail className="w-4 h-4" /> {user?.email}
            </p>
          </div>

          {msg && (
            <div className={`alert mb-6 ${msg.type === 'success' ? 'alert-success' : 'alert-error'}`}>
              {msg.text}
            </div>
          )}

          <form onSubmit={handleSave} className="space-y-5">
            <div>
              <label className="label">Nombre Completo</label>
              <div className="input-icon-wrap">
                <User className="input-icon" />
                <input
                  type="text"
                  className="input"
                  value={fullName}
                  onChange={e => setFullName(e.target.value)}
                  required
                />
              </div>
            </div>

            <div>
              <label className="label">Teléfono</label>
              <div className="input-icon-wrap">
                <Phone className="input-icon" />
                <input
                  type="tel"
                  className="input"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  placeholder="Opcional"
                />
              </div>
            </div>

            <div>
              <label className="label">Dirección Principal</label>
              <div className="input-icon-wrap">
                <MapPin className="input-icon" />
                <input
                  type="text"
                  className="input"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Ej. Av. Primavera 123"
                />
              </div>
            </div>

            <button type="submit" disabled={loading} className="btn btn-primary btn-full py-3.5 mt-4">
              {loading ? <div className="spinner mr-2" /> : null}
              Guardar Cambios
            </button>
          </form>
        </div>
      </main>
    </div>
  );
}
