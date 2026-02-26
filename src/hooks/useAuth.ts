import { useState, useEffect, useCallback } from 'react';
import { getUser, login as doLogin, logout as doLogout, register as doRegister, initAuth, subscribe, User } from '@/lib/auth';

export function useAuth() {
  const [user, setUser] = useState<User | null>(() => initAuth());

  useEffect(() => {
    return subscribe(() => setUser(getUser()));
  }, []);

  const login = useCallback((email: string, password: string) => {
    const result = doLogin(email, password);
    setUser(result);
    return result;
  }, []);

  const register = useCallback((name: string, email: string, password: string) => {
    const result = doRegister(name, email, password);
    if (typeof result !== 'string') setUser(result);
    return result;
  }, []);

  const logout = useCallback(() => {
    doLogout();
    setUser(null);
  }, []);

  return { user, login, register, logout };
}
