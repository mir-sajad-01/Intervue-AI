import { useQuery } from '@tanstack/react-query';
import api from '../utils/api';
import { queryKeys } from '../lib/queryClient';

export const useDashboardStats = (enabled = true) =>
  useQuery({
    queryKey: queryKeys.dashboard,
    queryFn: async () => (await api.get('/dashboard/stats')).data,
    enabled
  });

export const useSessions = (params = {}) =>
  useQuery({
    queryKey: [...queryKeys.sessions, params],
    queryFn: async () => (await api.get('/sessions', { params })).data,
    placeholderData: (previousData) => previousData
  });

export const useSession = (id) =>
  useQuery({
    queryKey: queryKeys.session(id),
    queryFn: async () => (await api.get(`/sessions/${id}`)).data.session,
    enabled: Boolean(id)
  });

export const useProfile = () =>
  useQuery({
    queryKey: queryKeys.profile,
    queryFn: async () => (await api.get('/auth/profile')).data
  });
