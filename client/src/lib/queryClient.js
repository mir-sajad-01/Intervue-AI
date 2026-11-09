import { QueryClient } from '@tanstack/react-query';

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      refetchOnWindowFocus: true,
      retry: (failureCount, error) => {
        const status = error?.response?.status;
        if (status && status < 500) return false;
        return failureCount < 2;
      }
    },
    mutations: {
      retry: false
    }
  }
});

export const queryKeys = {
  dashboard: ['dashboard'],
  sessions: ['sessions'],
  session: (id) => ['sessions', id],
  profile: ['profile'],
  reports: ['reports']
};
