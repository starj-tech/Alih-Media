import { useState, useEffect, useCallback } from 'react';
import { apiFetch, setToken, removeToken, getToken } from '@/lib/api-client';
import { User, UserRole, getUserProfile } from '@/lib/auth';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if we have a stored token and validate it
    const token = getToken();
    if (token) {
      getUserProfile().then(profile => {
        setUser(profile);
        if (!profile) removeToken(); // Token invalid, clear it
        setLoading(false);
      });
    } else {
      setLoading(false);
    }
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<User | { error: string }> => {
    try {
      const data = await apiFetch<{ token: string; user: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setToken(data.token);
      const profile = await getUserProfile();
      if (!profile) return { error: 'Profil tidak ditemukan' };
      setUser(profile);
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

      if (data.token) {
        setToken(data.token);
        const profile = await getUserProfile();
        if (profile) {
          setUser(profile);
          return profile;
        }
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
    setUser(null);
  }, []);

  return { user, loading, login, register, logout };
}
