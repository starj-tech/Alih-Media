import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { apiFetch, setToken, removeToken, getToken, AUTH_INVALID_EVENT } from '@/lib/api-client';
import { User, UserRole } from '@/lib/auth';
import { toast } from 'sonner';

const USER_STORAGE_KEY = 'auth_user';

function getBrowserStorage(): Storage | null {
  if (typeof window === 'undefined') return null;
  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

function storeUser(user: User) {
  const storage = getBrowserStorage();
  if (!storage) return;
  try {
    storage.setItem(USER_STORAGE_KEY, JSON.stringify(user));
  } catch {
    // Ignore storage write failures (privacy mode / quota exceeded)
  }
}

function loadStoredUser(): User | null {
  try {
    const raw = getBrowserStorage()?.getItem(USER_STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    if (parsed?.id && parsed?.email && parsed?.role) return parsed as User;
    return null;
  } catch {
    return null;
  }
}

function clearStoredUser() {
  try {
    getBrowserStorage()?.removeItem(USER_STORAGE_KEY);
  } catch {
    // Ignore storage remove failures
  }
}

function clearSession(setUser: (user: User | null) => void) {
  removeToken();
  clearStoredUser();
  setUser(null);
}

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User | { error: string }>;
  register: (name: string, email: string, password: string, extra?: { no_telepon?: string; pengguna?: string; nama_instansi?: string }) => Promise<User | string>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;

    const bootstrapAuth = async () => {
      const token = getToken();
      if (!token) {
        clearStoredUser();
        if (mounted) setLoading(false);
        return;
      }

      const stored = loadStoredUser();
      if (stored && mounted) {
        setUser(stored);
      }

      try {
        const data = await apiFetch<any>('/auth/me');
        if (!mounted) return;

        if (data?.id) {
          const freshUser: User = {
            id: data.id,
            email: data.email,
            name: data.name,
            role: (data.role as UserRole) || 'user',
          };
          setUser(freshUser);
          storeUser(freshUser);
        } else {
          clearSession(setUser);
        }
      } catch {
        if (mounted) {
          clearSession(setUser);
        }
      } finally {
        if (mounted) setLoading(false);
      }
    };

    bootstrapAuth();

    const handleAuthInvalid = (event: Event) => {
      const customEvent = event as CustomEvent<{ message?: string }>;
      clearSession(setUser);
      setLoading(false);
      if (customEvent.detail?.message) {
        toast.error(customEvent.detail.message);
      }
    };

    if (typeof window !== 'undefined') {
      window.addEventListener(AUTH_INVALID_EVENT, handleAuthInvalid as EventListener);
    }

    return () => {
      mounted = false;
      if (typeof window !== 'undefined') {
        window.removeEventListener(AUTH_INVALID_EVENT, handleAuthInvalid as EventListener);
      }
    };
  }, []);

  const login = useCallback(async (email: string, password: string): Promise<User | { error: string }> => {
    try {
      const data = await apiFetch<{ token: string; user: any }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email, password }),
      });
      setToken(data.token);
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
    name: string, email: string, password: string,
    extra?: { no_telepon?: string; pengguna?: string; nama_instansi?: string }
  ): Promise<User | string> => {
    try {
      const data = await apiFetch<{ token?: string; message?: string; user?: any }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify({
          name, email, password, password_confirmation: password,
          no_telepon: extra?.no_telepon || '',
          pengguna: extra?.pengguna || 'Perorangan',
          nama_instansi: extra?.nama_instansi || null,
        }),
      });
      if (data.token && data.user) {
        setToken(data.token);
        const profile: User = { id: data.user.id, email: data.user.email, name: data.user.name, role: (data.user.role as UserRole) || 'user' };
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
    try { await apiFetch('/auth/logout', { method: 'POST' }); } catch {}
    clearSession(setUser);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextType {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuthContext must be used within AuthProvider');
  return ctx;
}