import { useState, useEffect, useCallback } from 'react';
import { apiFetch, setToken, removeToken, getToken } from '@/lib/api-client';
import { User, UserRole } from '@/lib/auth';

// Store user in localStorage for session persistence without /auth/me
const USER_STORAGE_KEY = 'auth_user';

function storeUser(user: User) {
  localStorage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
}

function loadStoredUser(): User | null {
  try {
    const raw = localStorage.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.id && parsed?.email && parsed?.role) return parsed as User;
    return null;
  } catch {
    return null;
  }
}

function clearStoredUser() {
  localStorage.removeItem(USER_STORAGE_KEY);
}

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = getToken();
    if (!token) {
      clearStoredUser();
      setLoading(false);
      return;
    }

    // First try to load from localStorage (instant, no network)
    const stored = loadStoredUser();
    if (stored) {
      setUser(stored);
      setLoading(false);
      // Optionally validate token in background — but don't block UI
      apiFetch<any>('/auth/me').then(data => {
        if (data?.id) {
          const freshUser: User = {
            id: data.id,
            email: data.email,
            name: data.name,
            role: data.role || 'user',
          };
          setUser(freshUser);
          storeUser(freshUser);
        }
      }).catch(() => {
        // /auth/me failed (HTML response, network error, 401, etc.)
        // Keep using stored user — don't logout just because /auth/me is broken
        console.warn('[Auth] /auth/me failed, using stored session');
      });
      return;
    }

    // No stored user but have token — try /auth/me once
    apiFetch<any>('/auth/me').then(data => {
      if (data?.id) {
        const u: User = {
          id: data.id,
          email: data.email,
          name: data.name,
          role: data.role || 'user',
        };
        setUser(u);
        storeUser(u);
      } else {
        // Invalid response — clear token
        removeToken();
        clearStoredUser();
      }
    }).catch(() => {
      // /auth/me completely broken — clear session
      removeToken();
      clearStoredUser();
    }).finally(() => {
      setLoading(false);
    });
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<User | { error: string }> => {
    try {
      const data = await apiFetch<{ token: string; user: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setToken(data.token);

      // Use user data directly from login response — NO /auth/me call needed
      const profile: User = {
        id: data.user.id,
        email: data.user.email,
        name: data.user.name,
        role: (data.user.role as UserRole) || 'user',
      };
      setUser(profile);
      storeUser(profile);
      return profile;
    } catch (err: any) {
      return { error: err.message || 'Login gagal' };
    }
  }, []);

  const register = useCallback(async (
    name: string,
    email: string,
    password: string,
    extra?: { no_telepon?: string; pengguna?: string; nama_instansi?: string }
  ): Promise<User | string> => {
    try {
      const data = await apiFetch<{ token?: string; message?: string; user?: any }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name,
          email,
          password,
          password_confirmation: password,
          no_telepon: extra?.no_telepon || '',
          pengguna: extra?.pengguna || 'Perorangan',
          nama_instansi: extra?.nama_instansi || null,
        }),
      });

      if (data.token && data.user) {
        setToken(data.token);
        // Use user data directly from register response
        const profile: User = {
          id: data.user.id,
          email: data.user.email,
          name: data.user.name,
          role: (data.user.role as UserRole) || 'user',
        };
        setUser(profile);
        storeUser(profile);
        return profile;
      }

      return data.message || 'Registrasi berhasil';
    } catch (err: any) {
      return err.message || 'Registrasi gagal';
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiFetch('/auth/logout', { method: 'POST' });
    } catch {
      // Ignore logout errors
    }
    removeToken();
    clearStoredUser();
    setUser(null);
  }, []);

  return { user, loading, login, register, logout };
}
