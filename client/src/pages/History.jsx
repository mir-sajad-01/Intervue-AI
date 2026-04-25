import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import Loader from '../components/Loader';
import api from '../utils/api';
import { formatDate, gradeTone } from '../utils/helpers';

const cleanParams = (params) =>
  Object.fromEntries(Object.entries(params).filter(([, value]) => value !== '' && value !== null && value !== undefined));

const History = () => {
  const [filters, setFilters] = useState({ page: 1, type: '', difficulty: '', sortBy: 'date', order: 'desc', startDate: '', endDate: '' });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');
    api
      .get('/sessions', { params: cleanParams(filters) })
      .then((res) => setData(res.data))
      .catch((err) => {
        setData({ sessions: [], page: 1, totalPages: 1, total: 0 });
        setError(err.response?.data?.message || 'Could not load session history');
      })
      .finally(() => setLoading(false));
  }, [filters]);

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <h1 className="mb-6 text-3xl font-black text-slate-950 dark:text-white">Session History</h1>
      <div className="panel mb-6 grid gap-3 p-4 md:grid-cols-6">
        <select className="input" value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value, page: 1 })}><option value="">All types</option>{['HR', 'Technical', 'Behavioural', 'Mixed', 'Custom'].map((v) => <option key={v}>{v}</option>)}</select>
        <select className="input" value={filters.difficulty} onChange={(e) => setFilters({ ...filters, difficulty: e.target.value, page: 1 })}><option value="">All levels</option>{['Easy', 'Medium', 'Hard'].map((v) => <option key={v}>{v}</option>)}</select>
        <input className="input" type="date" value={filters.startDate} onChange={(e) => setFilters({ ...filters, startDate: e.target.value })} />
        <input className="input" type="date" value={filters.endDate} onChange={(e) => setFilters({ ...filters, endDate: e.target.value })} />
        <select className="input" value={filters.sortBy} onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}><option value="date">Date</option><option value="score">Score</option></select>
        <select className="input" value={filters.order} onChange={(e) => setFilters({ ...filters, order: e.target.value })}><option value="desc">Desc</option><option value="asc">Asc</option></select>
      </div>
      {error && <div className="panel mb-4 p-4 text-sm text-rose-300">{error}</div>}
      {loading ? <Loader label="Loading sessions..." /> : data?.sessions?.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {data.sessions.map((session) => (
            <Link to={`/sessions/${session._id}`} key={session._id} className="panel p-4 transition hover:border-cyan-400">
              <div className="flex justify-between gap-3">
                <div>
                  <h2 className="font-bold text-slate-950 dark:text-white">{session.type} Interview</h2>
                  <p className="text-sm text-slate-500">{formatDate(session.createdAt)}</p>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{session.difficulty} · {session.totalQuestions} questions</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-cyan-600">{session.finalScore}%</div>
                  <div className={`font-black ${gradeTone(session.grade)}`}>{session.grade}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : <div className="panel p-8 text-center text-slate-500">No sessions match your filters.</div>}
      {data && data.totalPages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          <button className="btn-secondary" disabled={filters.page <= 1} onClick={() => setFilters({ ...filters, page: filters.page - 1 })}>Previous</button>
          <span className="px-4 py-2 text-sm">Page {data.page} of {data.totalPages}</span>
          <button className="btn-secondary" disabled={filters.page >= data.totalPages} onClick={() => setFilters({ ...filters, page: filters.page + 1 })}>Next</button>
        </div>
      )}
    </main>
  );
};

export default History;
