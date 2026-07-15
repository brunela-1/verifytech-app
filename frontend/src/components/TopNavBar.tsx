import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { Shield, LogOut, Menu, X, ChevronLeft, Wallet } from 'lucide-react';
import { useAuth } from '../store/AuthContext';

interface TopNavBarProps {
  title?: string;
  showBack?: boolean;
  backTo?: string;
}

export default function TopNavBar({ title, showBack, backTo }: TopNavBarProps) {
  const { user, role, signOut } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  const displayName =
    user?.user_metadata?.full_name ??
    user?.email?.split('@')[0] ??
    'Usuario';

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  const techLinks = [
    { label: 'Panel',         to: '/tech/dashboard' },
    { label: 'Disponibilidad',to: '/tech/availability' },
    { label: 'Mi Perfil',     to: '/tech/profile' },
    { label: 'Billetera',     to: '/tech/wallet' },
  ];

  const clientLinks = [
    { label: 'Mis Solicitudes', to: '/dashboard' },
    { label: 'Historial',       to: '/history' },
    { label: 'Mi Perfil',       to: '/profile' },
  ];

  const navLinks = role === 'tech' ? techLinks : clientLinks;

  return (
    <header style={{ position: 'sticky', top: 0, zIndex: 50, backgroundColor: 'white', borderBottom: '1px solid #eceef0', boxShadow: '0 1px 4px rgba(0,0,0,0.06)' }}>
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '0 1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', height: '56px', gap: '0.75rem' }}>

          {/* Brand */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0 }}>
            {showBack && (
              <Link to={backTo || '..'} style={{ padding: '0.375rem', borderRadius: '0.5rem', color: '#505f76', display: 'flex' }}>
                <ChevronLeft style={{ width: 20, height: 20 }} />
              </Link>
            )}
            <Link
              to={role === 'tech' ? '/tech/dashboard' : '/dashboard'}
              style={{ display: 'flex', alignItems: 'center', gap: '0.375rem', textDecoration: 'none', flexShrink: 0 }}
            >
              <Shield style={{ width: 22, height: 22, color: '#16a34a' }} />
              <span style={{ fontSize: '1.1rem', fontWeight: 900, color: '#004ac6', letterSpacing: '-0.02em', whiteSpace: 'nowrap' }}>
                VerifyTech
              </span>
            </Link>
          </div>

          {/* Desktop nav — center */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '0.125rem', flex: 1, justifyContent: 'center', overflow: 'hidden' }} className="hide-mobile">
            {navLinks.map(link => {
              const active = location.pathname === link.to || location.pathname.startsWith(link.to + '/');
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  style={{
                    padding: '0.375rem 0.75rem',
                    borderRadius: '0.5rem',
                    fontSize: '0.8125rem',
                    fontWeight: 600,
                    whiteSpace: 'nowrap',
                    textDecoration: 'none',
                    color: active ? '#004ac6' : '#434655',
                    backgroundColor: active ? '#e8effe' : 'transparent',
                    transition: 'all 0.15s',
                  }}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>

          {/* Right controls */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexShrink: 0, marginLeft: 'auto' }}>
            {/* User chip — desktop only */}
            <div className="hide-mobile" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#f2f4f6', borderRadius: '999px', padding: '0.3rem 0.75rem 0.3rem 0.4rem' }}>
              <div style={{ width: 26, height: 26, borderRadius: '50%', backgroundColor: '#004ac6', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: '0.75rem', fontWeight: 700, flexShrink: 0 }}>
                {displayName.charAt(0).toUpperCase()}
              </div>
              <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#191c1e', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {displayName}
              </span>
              {role && (
                <span style={{
                  fontSize: '0.65rem', fontWeight: 700,
                  padding: '0.15rem 0.5rem', borderRadius: '999px',
                  backgroundColor: role === 'tech' ? 'rgba(0,74,198,0.1)' : 'rgba(22,163,74,0.1)',
                  color: role === 'tech' ? '#004ac6' : '#16a34a',
                  whiteSpace: 'nowrap',
                }}>
                  {role === 'tech' ? 'Técnico' : 'Cliente'}
                </span>
              )}
            </div>

            {/* Sign out */}
            <button
              onClick={handleSignOut}
              title="Cerrar sesión"
              style={{ padding: '0.375rem', borderRadius: '50%', color: '#505f76', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center' }}
            >
              <LogOut style={{ width: 18, height: 18 }} />
            </button>

            {/* Mobile hamburger */}
            <button
              className="show-mobile"
              style={{ padding: '0.375rem', borderRadius: '0.5rem', color: '#505f76', background: 'none', border: 'none', cursor: 'pointer', display: 'none', alignItems: 'center' }}
              onClick={() => setMenuOpen(prev => !prev)}
              aria-label="Abrir menú"
            >
              {menuOpen ? <X style={{ width: 20, height: 20 }} /> : <Menu style={{ width: 20, height: 20 }} />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile dropdown */}
      {menuOpen && (
        <div style={{ backgroundColor: 'white', borderTop: '1px solid #eceef0', padding: '0.75rem 1rem', display: 'flex', flexDirection: 'column', gap: '0.25rem', boxShadow: '0 4px 16px rgba(0,0,0,0.08)' }}>
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMenuOpen(false)}
              style={{ padding: '0.625rem 0.875rem', borderRadius: '0.625rem', fontSize: '0.9rem', fontWeight: 600, color: '#434655', textDecoration: 'none', display: 'block' }}
            >
              {link.label}
            </Link>
          ))}
          <div style={{ height: '1px', background: '#eceef0', margin: '0.375rem 0' }} />
          <button
            onClick={handleSignOut}
            style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.625rem 0.875rem', borderRadius: '0.625rem', fontSize: '0.9rem', fontWeight: 600, color: '#dc2626', background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left' }}
          >
            <LogOut style={{ width: 16, height: 16 }} /> Cerrar sesión
          </button>
        </div>
      )}
    </header>
  );
}
