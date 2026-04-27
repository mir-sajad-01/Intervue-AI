import axios from 'axios';
import { createContext, useContext, useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';

const AuthContext = createContext(null);
const API_BASE_URL = `${import.meta.env.VITE_API_URL || 'http://localhost:5000'}/api`;

const decodeJwtPayload = (token) => {
  try {
    const payload = token.split('.')[1];
    if (!payload) return null;
    const normalized = payload.replace(/-/g, '+').replace(/_/g, '/');
    const decoded = atob(normalized.padEnd(normalized.length + ((4 - (normalized.length % 4)) % 4), '='));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
};

const isExpired = (token) => {
  const payload = decodeJwtPayload(token);
  if (!payload?.exp) return true;
  return payload.exp * 1000 <= Date.now() + 5000;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);
  const bootstrappedRef = useRef(false);

  const clearStoredAuth = () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
  };

  const persist = (payload) => {
    localStorage.setItem('accessToken', payload.accessToken);
    localStorage.setItem('refreshToken', payload.refreshToken);
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
    const refreshToken = localStorage.getItem('refreshToken');
    await api.post('/auth/logout', { refreshToken }).catch(() => null);
    clearStoredAuth();
  };

  const refreshProfile = async () => {
    const { data } = await api.get('/auth/profile');
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const refreshAccessToken = async (refreshToken) => {
    const { data } = await axios.post(`${API_BASE_URL}/auth/refresh`, { refreshToken });
    localStorage.setItem('accessToken', data.accessToken);
    return data.accessToken;
  };

  useEffect(() => {
    if (bootstrappedRef.current) return;
    bootstrappedRef.current = true;

    const bootstrapAuth = async () => {
      const accessToken = localStorage.getItem('accessToken');
      const refreshToken = localStorage.getItem('refreshToken');

      if (!accessToken && !refreshToken) {
        clearStoredAuth();
        setCheckingAuth(false);
        return;
      }

      try {
        if (!refreshToken || isExpired(refreshToken)) {
          clearStoredAuth();
          setCheckingAuth(false);
          return;
        }

        if (!accessToken || isExpired(accessToken)) {
          await refreshAccessToken(refreshToken);
        }

        await refreshProfile();
      } catch {
        clearStoredAuth();
      } finally {
        setCheckingAuth(false);
      }
    };

    bootstrapAuth();
  }, []);

  const value = useMemo(
    () => ({ user, loading, checkingAuth, register, login, logout, refreshProfile, setUser }),
    [user, loading, checkingAuth]
  );
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => useContext(AuthContext);
