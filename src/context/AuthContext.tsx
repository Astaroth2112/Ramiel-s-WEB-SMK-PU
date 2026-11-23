import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api, getStoredToken, setStoredToken } from '../lib/api';
import {
  ensureSupabaseConfigured,
  isSupabaseConfigured,
  supabase,
} from '../lib/supabaseClient';
import type { UserProfile } from '../types';

interface AuthContextValue {
  user: UserProfile | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<UserProfile>;
  register: (payload: {
    email: string;
    fullName: string;
    nip: string;
    positionTitle: string;
    password: string;
  }) => Promise<UserProfile>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  const refreshUser = useCallback(async () => {
    let token = getStoredToken();
    if (!isSupabaseConfigured) {
      let hasSbStorage = false;
      try {
        hasSbStorage = Object.keys(localStorage).some(
          (k) => k.startsWith('sb-') && k.endsWith('-auth-token'),
        );
      } catch {
        hasSbStorage = false;
      }
      if (hasSbStorage || (token && !token.startsWith('local-fallback:'))) {
        await ensureSupabaseConfigured();
      }
    }
    if (!token && isSupabaseConfigured && supabase) {
      try {
        const { data } = await supabase.auth.getSession();
        if (data.session?.access_token) {
          token = data.session.access_token;
          setStoredToken(token);
        }
      } catch {
        // ignore session restore error
      }
    }
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await api.me();
      setUser(res.user);
    } catch {
      setStoredToken(null);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void refreshUser();
  }, [refreshUser]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await api.login(email, password);
    setStoredToken(res.token);
    setUser(res.user);
    return res.user;
  }, []);

  const register = useCallback(
    async (payload: {
      email: string;
      fullName: string;
      nip: string;
      positionTitle: string;
      password: string;
    }) => {
      const res = await api.register(payload);
      if (res.token) {
        setStoredToken(res.token);
      }
      setUser(res.user);
      return res.user;
    },
    [],
  );

  const logout = useCallback(() => {
    setStoredToken(null);
    setUser(null);
    if (isSupabaseConfigured && supabase) {
      void supabase.auth.signOut();
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used inside AuthProvider');
  }
  return ctx;
}
