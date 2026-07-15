import React, { useEffect, useRef, useState } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './store/AuthContext';

import AuthPage from './pages/AuthPage';
import AdminDashboard from './pages/AdminDashboard';
import ClientDashboard from './pages/ClientDashboard';
import TechDashboard from './pages/TechDashboard';
import CreateRequestPage from './pages/CreateRequestPage';
import RequestDetailPage from './pages/RequestDetailPage';
import ClientServicePage from './pages/ClientServicePage';
import TechServicePage from './pages/TechServicePage';
import TechJobDetailPage from './pages/TechJobDetailPage';
import AvailabilityPage from './pages/AvailabilityPage';
import ReviewPage from './pages/ReviewPage';
import ClientProfilePage from './pages/ClientProfilePage';
import TechProfilePage from './pages/TechProfilePage';
import TechPublicProfile from './pages/TechPublicProfile';
import HistoryPage from './pages/HistoryPage';
import TechWalletPage from './pages/TechWalletPage';

function AuthGuard({ children, allowedRole }: { children: React.ReactNode; allowedRole?: 'client' | 'tech' | 'admin' }) {
  const { session, role, loading } = useAuth();
  const [roleTimeout, setRoleTimeout] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    // If session exists but role is still null, start a 5s safety timer
    if (session && !role && !loading) {
      timerRef.current = setTimeout(() => setRoleTimeout(true), 5000);
    } else {
      if (timerRef.current) clearTimeout(timerRef.current);
      setRoleTimeout(false);
    }
    return () => { if (timerRef.current) clearTimeout(timerRef.current); };
  }, [session, role, loading]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-on-surface-variant font-label-md text-label-md">Cargando...</p>
        </div>
      </div>
    );
  }

  if (!session) return <Navigate to="/auth" replace />;
  
  // If role timed out, redirect to auth to re-login
  if (roleTimeout) return <Navigate to="/auth" replace />;

  // If role is not yet determined, show brief spinner
  if (!role) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
          <p className="text-on-surface-variant font-label-md text-label-md">Sincronizando...</p>
        </div>
      </div>
    );
  }
  
  if (allowedRole && role !== allowedRole) {
    if (role === 'admin') return <Navigate to="/admin" replace />;
    return <Navigate to={role === 'tech' ? '/tech/dashboard' : '/dashboard'} replace />;
  }

  return <>{children}</>;
}

export default function App() {
  const { session, role, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="w-10 h-10 border-4 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <Routes>
      <Route
        path="/auth"
        element={
          session
            ? <Navigate to={role === 'admin' ? '/admin' : role === 'tech' ? '/tech/dashboard' : '/dashboard'} replace />
            : <AuthPage />
        }
      />

      <Route path="/admin" element={<AuthGuard allowedRole="admin"><AdminDashboard /></AuthGuard>} />

      <Route path="/dashboard" element={<AuthGuard allowedRole="client"><ClientDashboard /></AuthGuard>} />
      <Route path="/requests/new" element={<AuthGuard allowedRole="client"><CreateRequestPage /></AuthGuard>} />
      <Route path="/requests/:id" element={<AuthGuard allowedRole="client"><RequestDetailPage /></AuthGuard>} />
      <Route path="/services/:id" element={<AuthGuard allowedRole="client"><ClientServicePage /></AuthGuard>} />
      <Route path="/services/:id/review" element={<AuthGuard allowedRole="client"><ReviewPage /></AuthGuard>} />
      <Route path="/profile" element={<AuthGuard allowedRole="client"><ClientProfilePage /></AuthGuard>} />
      <Route path="/history" element={<AuthGuard><HistoryPage /></AuthGuard>} />

      <Route path="/tech/dashboard" element={<AuthGuard allowedRole="tech"><TechDashboard /></AuthGuard>} />
      <Route path="/tech/jobs/:id" element={<AuthGuard allowedRole="tech"><TechJobDetailPage /></AuthGuard>} />
      <Route path="/tech/services/:id" element={<AuthGuard allowedRole="tech"><TechServicePage /></AuthGuard>} />
      <Route path="/tech/availability" element={<AuthGuard allowedRole="tech"><AvailabilityPage /></AuthGuard>} />
      <Route path="/tech/profile" element={<AuthGuard allowedRole="tech"><TechProfilePage /></AuthGuard>} />
      <Route path="/tech/wallet" element={<AuthGuard allowedRole="tech"><TechWalletPage /></AuthGuard>} />

      <Route path="/techs/:id" element={<TechPublicProfile />} />

      <Route
        path="*"
        element={
          session
            ? <Navigate to={role === 'admin' ? '/admin' : role === 'tech' ? '/tech/dashboard' : '/dashboard'} replace />
            : <Navigate to="/auth" replace />
        }
      />
    </Routes>
  );
}
