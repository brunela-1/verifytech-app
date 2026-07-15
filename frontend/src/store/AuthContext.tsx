import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import { Session, User } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { syncProfile, getMe } from '../api/auth';
import type { UserRole } from '../types';

interface AuthContextType {
  session: Session | null;
  user: User | null;
  role: UserRole | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  session: null,
  user: null,
  role: null,
  loading: true,
  signOut: async () => {},
});

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [role, setRole] = useState<UserRole | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  // Track if we already synced for this session to avoid duplicate calls
  const syncedSessionRef = useRef<string | null>(null);

  const extractRole = (u: User | null): UserRole | null => {
    if (!u) return null;
    const email = u.email || u.user_metadata?.email || '';
    if (email === 'admin@tecnicoconfianza.com' || email === 'admin@verifytech.com') {
      return 'admin';
    }
    return (u.user_metadata?.role as UserRole) ?? 'client';
  };

  useEffect(() => {
    let isMounted = true;
    // Safety net: never stay loading more than 8 seconds
    const timeout = setTimeout(() => { if (isMounted) setLoading(false); }, 8000);

    const loadRealRole = async (session: Session | null) => {
      if (!session) return null;
      try {
        const { data: meData } = await getMe();
        return (meData?.role as UserRole) ?? extractRole(session.user);
      } catch {
        return extractRole(session.user);
      }
    };

    // 1. Load initial session
    supabase.auth.getSession().then(async ({ data: { session: initialSession } }) => {
      if (!isMounted) return;
      setSession(initialSession);
      setUser(initialSession?.user ?? null);
      if (initialSession) {
        const realRole = await loadRealRole(initialSession);
        if (isMounted) setRole(realRole);
      } else {
        if (isMounted) setRole(null);
      }
      if (isMounted) setLoading(false);
      clearTimeout(timeout);
    });

    // 2. Listen for future auth state changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (_event, newSession) => {
        if (!isMounted) return;
        
        // Skip INITIAL_SESSION because getSession already handles it cleanly
        if (_event === 'INITIAL_SESSION') return;

        setSession(newSession);
        setUser(newSession?.user ?? null);
        setError(null);

        if (!newSession) {
          setRole(null);
          setLoading(false);
          clearTimeout(timeout);
          return;
        }

        // Fetch real role for any new session events (like SIGNED_IN)
        const realRole = await loadRealRole(newSession);
        if (isMounted) setRole(realRole);

        // Only call syncProfile once per unique session (avoids duplicate calls)
        if (_event === 'SIGNED_IN' && newSession) {
          const sessionKey = newSession.access_token;
          if (syncedSessionRef.current !== sessionKey) {
            syncedSessionRef.current = sessionKey;
            try {
              const meta = newSession.user.user_metadata || {};
              const defaultRole = extractRole(newSession.user);
              // Backend will ignore this if the user is already admin
              await syncProfile(defaultRole || 'client', meta.referral_source || null);
              
              // Refetch role just in case syncProfile changed something
              const postSyncRole = await loadRealRole(newSession);
              if (isMounted) setRole(postSyncRole);

            } catch (err) {
              console.error('Error syncing profile (non-blocking):', err);
            }
          }
        }

        if (_event === 'SIGNED_OUT') {
          syncedSessionRef.current = null;
        }

        if (isMounted) setLoading(false);
        clearTimeout(timeout);
      }
    );

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const signOut = async () => {
    syncedSessionRef.current = null;
    await supabase.auth.signOut();
    setSession(null);
    setUser(null);
    setRole(null);
    setError(null);
  };

  return (
    <AuthContext.Provider value={{ session, user, role, loading, signOut }}>
      {error && (
        <div className="fixed top-0 left-0 right-0 bg-red-500 text-white p-4 text-center font-semibold z-50">
          {error}
        </div>
      )}
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
