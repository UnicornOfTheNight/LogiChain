import { useCallback, useEffect, useState } from 'react';
import { AuthService } from '../services/AuthService';
import type { AuthUser } from '../types/dtos';

export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      const authenticated = await AuthService.isAuthenticated();
      if (authenticated) {
        try {
          setUser(await AuthService.getCurrentUser());
        } catch {
          setUser(null);
        }
      }
      setLoading(false);
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    setError(null);
    setLoading(true);
    try {
      setUser(await AuthService.login(email, password));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Erreur de connexion');
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(async () => {
    await AuthService.logout();
    setUser(null);
  }, []);

  return { user, loading, error, login, logout };
}
