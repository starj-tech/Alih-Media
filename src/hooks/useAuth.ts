import { useState, useEffect, useCallback } from 'react';
import { getUser, login as doLogin, logout as doLogout, initAuth, subscribe, User } from '@/lib/auth';

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

  const logout = useCallback(() => {
    doLogout();
    setUser(null);
  }, []);

  return { user, login, logout };
}
