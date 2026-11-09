import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import api, { setAccessToken } from '../utils/api';
import { queryClient } from '../lib/queryClient';

const AuthContext = createContext(null);
export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const bootstrappedRef = useRef(false);

  const updateUser = useCallback((nextUser) => {
    if (nextUser) localStorage.setItem('user', JSON.stringify(nextUser));
    else localStorage.removeItem('user');
    setUser(nextUser);
  }, []);

  const clearStoredAuth = useCallback(() => {
    setAccessToken(null);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
    queryClient.clear();
  }, []);

  const persist = (payload) => {
    setAccessToken(payload.accessToken);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.setItem('user', JSON.stringify(payload.user));
    setUser(payload.user);
  };

  const register = async (form) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/register', form);
      persist(data);
      toast.success('Welcome to IntervueAI');
    } finally {
      setLoading(false);
    }
  };

  const login = async (form) => {
    setLoading(true);
    try {
      const { data } = await api.post('/auth/login', form);
      persist(data);
      toast.success('Logged in');
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    const legacyRefreshToken = localStorage.getItem('refreshToken');
    await api.post('/auth/logout', legacyRefreshToken ? { refreshToken: legacyRefreshToken } : {}).catch(() => null);
    clearStoredAuth();
  };

  const refreshProfile = async () => {
    const { data } = await api.get('/auth/profile');
    updateUser(data.user);
    return data;
  };

  const refreshAccessToken = async (legacyRefreshToken) => {
    const { data } = await api.post('/auth/refresh', legacyRefreshToken ? { refreshToken: legacyRefreshToken } : {});
    setAccessToken(data.accessToken);
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    return data.accessToken;
  };

  useEffect(() => {
    const handleAuthExpired = () => clearStoredAuth();
    window.addEventListener('auth:expired', handleAuthExpired);

    return () => window.removeEventListener('auth:expired', handleAuthExpired);
  }, [clearStoredAuth]);

  useEffect(() => {
    if (bootstrappedRef.current) return;
    bootstrappedRef.current = true;

    const bootstrapAuth = async () => {
      const cachedUser = localStorage.getItem('user');
      const legacyAccessToken = localStorage.getItem('accessToken');
      const legacyRefreshToken = localStorage.getItem('refreshToken');

      if (cachedUser) {
        try {
          setUser(JSON.parse(cachedUser));
        } catch {
          localStorage.removeItem('user');
        }
      }
      setAccessToken(legacyAccessToken);

      try {
        // Refresh tokens live in an HttpOnly cookie, which JavaScript cannot
        // inspect. Attempt refresh even if local profile storage was cleared.
        await refreshAccessToken(legacyRefreshToken);
        await refreshProfile();
      } catch (error) {
        if ([401, 403].includes(error.response?.status)) clearStoredAuth();
      } finally {
        setCheckingAuth(false);
      }
    };

    bootstrapAuth();
  }, []);

  const value = useMemo(
    () => ({ user, loading, checkingAuth, register, login, logout, refreshProfile, setUser: updateUser }),
    [user, loading, checkingAuth, updateUser]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
