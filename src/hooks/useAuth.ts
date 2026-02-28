import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User, UserRole, getUserProfile } from '@/lib/auth';

export function useAuth() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        if (session?.user) {
          // Use setTimeout to avoid Supabase client deadlock
          setTimeout(async () => {
            const profile = await getUserProfile(session.user.id);
            setUser(profile);
            setLoading(false);
          }, 0);
        } else {
          setUser(null);
          setLoading(false);
        }
      }
    );

    // THEN check current session
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (session?.user) {
        const profile = await getUserProfile(session.user.id);
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

    const profile = await getUserProfile(data.user.id);
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
        data: { name, ...extra },
        emailRedirectTo: window.location.origin,
      },
    });
    if (error) return error.message;
    if (!data.user) return 'Registrasi gagal';

    // Wait for trigger to create profile
    await new Promise(resolve => setTimeout(resolve, 500));
    const profile = await getUserProfile(data.user.id);
    if (!profile) return 'Profil gagal dibuat';
    setUser(profile);
    return profile;
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  return { user, loading, login, register, logout };
}
