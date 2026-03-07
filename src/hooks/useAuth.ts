import { useState, useEffect, useCallback } from 'react';
import { api, getToken, setToken, clearToken } from '@/lib/api';
import { User, UserRole, getUserProfile } from '@/lib/auth';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check existing token on mount
    const token = getToken();
    if (token) {
      getUserProfile().then(profile => {
        setUser(profile);
        if (!profile) clearToken(); // Token invalid
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<User | { error: string }> => {
    const { data, error } = await api.post<{ token: string; user: User }>('/auth/login', { email, password });
    if (error || !data) return { error: error || 'Login gagal' };

    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const register = useCallback(async (
    name: string,
    email: string,
    password: string,
    extra?: { no_telepon?: string; pengguna?: string; nama_instansi?: string }
  ): Promise<User | string> => {
    const { data, error } = await api.post<{ token?: string; user?: User; message?: string }>('/auth/register', {
      name, email, password, ...extra,
    });
    if (error || !data) return error || 'Registrasi gagal';

    // If backend returns token directly (auto-login after register)
    if (data.token && data.user) {
      setToken(data.token);
      setUser(data.user);
      return data.user;
    }

    // If backend requires email verification (no token returned)
    return data.message || 'Registrasi berhasil, silakan cek email';
  }, []);

  const logout = useCallback(async () => {
    await api.post('/auth/logout').catch(() => {});
    clearToken();
    setUser(null);
  }, []);

  return { user, loading, login, register, logout };
}
