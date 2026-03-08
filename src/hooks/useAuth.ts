import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, UserRole, getUserProfile } from '@/lib/auth';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Listen for auth state changes FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (session?.user) {
        // Use setTimeout to avoid potential deadlock with Supabase auth
        setTimeout(async () => {
          const profile = await getUserProfile();
          setUser(profile);
          setLoading(false);
        }, 0);
      } else {
        setUser(null);
        setLoading(false);
      }
    });

    // Then check existing session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await getUserProfile();
        setUser(profile);
      }
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<User | { error: string }> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    if (!data.user) return { error: 'Login gagal' };

    const profile = await getUserProfile();
    if (!profile) return { error: 'Profil tidak ditemukan' };
    setUser(profile);
    return profile;
  }, []);

  const register = useCallback(async (
    name: string,
    email: string,
    password: string,
    extra?: { no_telepon?: string; pengguna?: string; nama_instansi?: string }
  ): Promise<User | string> => {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: {
          name,
          no_telepon: extra?.no_telepon || '',
          pengguna: extra?.pengguna || 'Perorangan',
          nama_instansi: extra?.nama_instansi || null,
        },
        emailRedirectTo: window.location.origin,
      },
    });

    if (error) return error.message;
    if (!data.user) return 'Registrasi gagal';

    // If email confirmation is required (user exists but not confirmed)
    if (data.user.identities?.length === 0) {
      return 'Email sudah terdaftar';
    }

    // If session exists (auto-confirmed), set the user
    if (data.session) {
      const profile = await getUserProfile();
      if (profile) {
        setUser(profile);
        return profile;
      }
    }

    return 'Registrasi berhasil, silakan cek email untuk konfirmasi';
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  return { user, loading, login, register, logout };
}
