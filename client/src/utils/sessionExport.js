import api from './api';

const PAGE_SIZE = 100;
const MAX_EXPORT_SESSIONS = 1000;

export const fetchSessionExport = async (params = {}) => {
  const firstPage = await api.get('/sessions', { params: { ...params, page: 1, limit: PAGE_SIZE } });
  const { sessions = [], totalPages = 0, total = sessions.length } = firstPage.data;

  if (total > MAX_EXPORT_SESSIONS) {
    throw new Error(`This export has ${total.toLocaleString()} sessions. Narrow the date range to 1,000 sessions or fewer.`);
  }

  const pages = [];
  for (let start = 2; start <= totalPages; start += 5) {
    const pageNumbers = Array.from({ length: Math.min(5, totalPages - start + 1) }, (_, index) => start + index);
    const batch = await Promise.all(pageNumbers.map((page) => api.get('/sessions', {
      params: { ...params, page, limit: PAGE_SIZE }
    })));
    pages.push(...batch.flatMap((response) => response.data.sessions || []));
  }

  return [...sessions, ...pages];
};
