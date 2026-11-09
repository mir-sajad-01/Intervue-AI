import axios from 'axios';

const configuredApiUrl = (import.meta.env.VITE_API_URL || (import.meta.env.DEV ? 'http://localhost:5000' : '')).trim();
const apiRoot = configuredApiUrl.replace(/\/+$/, '').replace(/\/api$/i, '');
export const API_BASE_URL = apiRoot ? `${apiRoot}/api` : '/api';

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 30_000,
  withCredentials: true,
  headers: { 'Content-Type': 'application/json' }
});

let refreshRequest;
let accessToken = null;

export const setAccessToken = (token) => {
  accessToken = token || null;
};

const clearAuth = () => {
  setAccessToken(null);
  localStorage.removeItem('accessToken');
  localStorage.removeItem('refreshToken');
  localStorage.removeItem('user');
  window.dispatchEvent(new Event('auth:expired'));
};

api.interceptors.request.use((config) => {
  if (accessToken) config.headers.Authorization = `Bearer ${accessToken}`;
  else delete config.headers.Authorization;
  return config;
});

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config;
    const isAuthEndpoint = /\/auth\/(login|register|refresh|logout)/.test(original?.url || '');

    if (error.response?.status === 401 && original?._retry && !isAuthEndpoint) {
      clearAuth();
      return Promise.reject(error);
    }

    if (error.response?.status !== 401 || !original || original._retry || isAuthEndpoint) {
      return Promise.reject(error);
    }

    original._retry = true;
    try {
      if (!refreshRequest) {
        const legacyRefreshToken = localStorage.getItem('refreshToken');
        refreshRequest = axios
          .post(`${API_BASE_URL}/auth/refresh`, legacyRefreshToken ? { refreshToken: legacyRefreshToken } : {}, {
            timeout: 15_000,
            withCredentials: true,
            headers: { 'Content-Type': 'application/json' }
          })
          .then(({ data }) => {
            setAccessToken(data.accessToken);
            localStorage.removeItem('accessToken');
            localStorage.removeItem('refreshToken');
            return data.accessToken;
          })
          .catch((refreshError) => {
            if ([401, 403].includes(refreshError.response?.status)) clearAuth();
            throw refreshError;
          })
          .finally(() => {
            refreshRequest = null;
          });
      }

      const accessToken = await refreshRequest;
      original.headers = { ...original.headers, Authorization: `Bearer ${accessToken}` };
      return api(original);
    } catch (refreshError) {
      return Promise.reject(refreshError);
    }
  }
);

export default api;
