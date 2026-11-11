import { createContext, useContext, useEffect, useState, ReactNode, useCallback, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { axiosForBackend } from '@lark-apaas/client-toolkit/utils/getAxiosForBackend';
import { logger } from '@lark-apaas/client-toolkit/logger';
import type { UserProfile } from '@shared/api.interface';

interface AuthContextType {
  user: UserProfile | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, nickname: string) => Promise<void>;
  logout: () => Promise<void>;
  refresh: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();
  const userRef = useRef<UserProfile | null>(null);

  useEffect(() => {
    userRef.current = user;
  }, [user]);

  const handleUnauthorized = useCallback(() => {
    if (userRef.current) {
      setUser(null);
      userRef.current = null;
      navigate('/login', { replace: true });
    }
  }, [navigate]);

  useEffect(() => {
    const interceptor = axiosForBackend.interceptors.response.use(
      (response) => response,
      (error) => {
        if (error?.response?.status === 401) {
          const url: string = error.config?.url ?? '';
          if (!url.includes('/api/auth/login') && !url.includes('/api/auth/register') && !url.includes('/api/auth/me')) {
            handleUnauthorized();
          }
        }
        return Promise.reject(error);
      },
    );
    return () => {
      axiosForBackend.interceptors.response.eject(interceptor);
    };
  }, [handleUnauthorized]);

  const refresh = useCallback(async () => {
    try {
      const res = await axiosForBackend.get('/api/auth/me');
      const userData = res.data?.user ?? null;
      setUser(userData);
      userRef.current = userData;
    } catch {
      setUser(null);
      userRef.current = null;
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const login = useCallback(async (email: string, password: string) => {
    const res = await axiosForBackend.post('/api/auth/login', { email, password });
    setUser(res.data.user);
  }, []);

  const register = useCallback(async (email: string, password: string, nickname: string) => {
    const res = await axiosForBackend.post('/api/auth/register', { email, password, nickname });
    setUser(res.data.user);
  }, []);

  const logout = useCallback(async () => {
    try {
      await axiosForBackend.post('/api/auth/logout');
    } catch (err) {
      logger.error('logout error', err);
    }
    setUser(null);
    userRef.current = null;
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout, refresh }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
