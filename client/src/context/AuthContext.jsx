import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import api from '../utils/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(false);
  const [checkingAuth, setCheckingAuth] = useState(true);

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
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    setUser(null);
  };

  const refreshProfile = async () => {
    const { data } = await api.get('/auth/profile');
    localStorage.setItem('user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  useEffect(() => {
    const bootstrapAuth = async () => {
      if (!localStorage.getItem('accessToken')) {
        localStorage.removeItem('user');
        setCheckingAuth(false);
        return;
      }

      try {
        await refreshProfile();
      } catch {
        await logout();
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
