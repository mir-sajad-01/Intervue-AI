import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import Loader from '../components/Loader';
import ReportDateRangePicker from '../components/ReportDateRangePicker';
import api from '../utils/api';
import { formatDate, gradeTone } from '../utils/helpers';
import { generateProgressReportPdf, resolveReportRange } from '../utils/report';
import { useAuth } from '../context/AuthContext';

const cleanParams = (params) =>
  Object.fromEntries(Object.entries(params).filter(([, value]) => value !== '' && value !== null && value !== undefined));

const History = () => {
  const { user } = useAuth();
  const [filters, setFilters] = useState({ page: 1, type: '', difficulty: '', sortBy: 'date', order: 'desc', startDate: '', endDate: '' });
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reportPreset, setReportPreset] = useState('all');
  const [exporting, setExporting] = useState(false);

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

  const exportSessions = async () => {
    if (!user) return;
    if (reportPreset === 'custom' && (!filters.startDate || !filters.endDate)) {
      toast.error('Choose both dates to export a custom period');
      return;
    }

    setExporting(true);
    try {
      const rangeMeta = resolveReportRange({ preset: reportPreset, from: filters.startDate, to: filters.endDate });
      const query = {
        limit: 1000,
        sortBy: filters.sortBy,
        order: filters.order,
        type: filters.type || undefined,
        difficulty: filters.difficulty || undefined,
        ...rangeMeta.query
      };

      const [summaryResponse, sessionsResponse] = await Promise.all([
        api.get('/reports/summary', { params: cleanParams({ ...rangeMeta.query, type: filters.type, difficulty: filters.difficulty }) }),
        api.get('/sessions', { params: cleanParams(query) })
      ]);

      if (!sessionsResponse.data.sessions?.length) {
        toast.error('No sessions match your current filters');
        return;
      }

      generateProgressReportPdf({
        userName: user.name,
        rangeMeta,
        summaryPayload: summaryResponse.data,
        sessions: sessionsResponse.data.sessions
      });
      toast.success('Filtered sessions exported');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not export sessions');
    } finally {
      setExporting(false);
    }
  };

  const deleteSession = async (sessionId) => {
    const confirmed = window.confirm('Delete this session permanently?');
    if (!confirmed) return;

    try {
      await api.delete(`/sessions/${sessionId}`);
      setData((current) => ({
        ...(current || { page: 1, totalPages: 1, total: 0 }),
        sessions: (current?.sessions || []).filter((session) => session._id !== sessionId),
        total: Math.max(0, (current?.total || 0) - 1)
      }));
      toast.success('Session deleted');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not delete session');
    }
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-black text-slate-950 dark:text-white">Session History</h1>
        <button className="btn-primary" onClick={exportSessions} disabled={exporting}>
          <Download size={16} />
          {exporting ? 'Preparing PDF...' : 'Export filtered sessions as PDF'}
        </button>
      </div>
      <div className="panel mb-6 space-y-4 p-4">
        <div className="grid gap-3 md:grid-cols-4">
          <select className="input" value={filters.type} onChange={(e) => setFilters({ ...filters, type: e.target.value, page: 1 })}><option value="">All types</option>{['HR', 'Technical', 'Behavioural', 'Mixed', 'Custom'].map((v) => <option key={v}>{v}</option>)}</select>
          <select className="input" value={filters.difficulty} onChange={(e) => setFilters({ ...filters, difficulty: e.target.value, page: 1 })}><option value="">All levels</option>{['Easy', 'Medium', 'Hard'].map((v) => <option key={v}>{v}</option>)}</select>
          <select className="input" value={filters.sortBy} onChange={(e) => setFilters({ ...filters, sortBy: e.target.value })}><option value="date">Date</option><option value="score">Score</option></select>
          <select className="input" value={filters.order} onChange={(e) => setFilters({ ...filters, order: e.target.value })}><option value="desc">Desc</option><option value="asc">Asc</option></select>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-slate-400">Date period</p>
          <ReportDateRangePicker
            preset={reportPreset}
            from={filters.startDate}
            to={filters.endDate}
            onPresetChange={(value) => {
              setReportPreset(value);
              setFilters((current) => ({ ...current, page: 1 }));
            }}
            onFromChange={(value) => setFilters((current) => ({ ...current, startDate: value, page: 1 }))}
            onToChange={(value) => setFilters((current) => ({ ...current, endDate: value, page: 1 }))}
          />
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">Export filtered sessions as PDF.</p>
        </div>
      </div>
      {error && <div className="panel mb-4 p-4 text-sm text-rose-300">{error}</div>}
      {loading ? <Loader label="Loading sessions..." /> : data?.sessions?.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {data.sessions.map((session) => (
            <div key={session._id} className="panel p-4 transition hover:border-cyan-400">
              <div className="flex justify-between gap-3">
                <div>
                  <Link to={`/sessions/${session._id}`} className="font-bold text-slate-950 dark:text-white">{session.type} Interview</Link>
                  <p className="text-sm text-slate-500">{formatDate(session.createdAt)}</p>
                  <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{session.difficulty} · {session.totalQuestions} questions</p>
                </div>
                <div className="text-right">
                  <div className="text-2xl font-black text-cyan-600">{session.finalScore}%</div>
                  <div className={`font-black ${gradeTone(session.grade)}`}>{session.grade}</div>
                  <button className="btn-secondary mt-3" onClick={() => deleteSession(session._id)}>Delete</button>
                </div>
              </div>
            </div>
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
