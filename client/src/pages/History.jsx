import { useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Download } from 'lucide-react';
import { Link } from 'react-router-dom';
import Loader from '../components/Loader';
import ReportDateRangePicker from '../components/ReportDateRangePicker';
import PageHeader from '../components/PageHeader';
import AppDialog from '../components/AppDialog';
import RequestError from '../components/RequestError';
import EmptyState from '../components/EmptyState';
import api from '../utils/api';
import { formatDate, gradeTone } from '../utils/helpers';
import { resolveReportRange } from '../utils/reportRange';
import { useAuth } from '../context/AuthContext';
import { useSessions } from '../hooks/queries';
import { queryKeys } from '../lib/queryClient';
import { getErrorMessage } from '../utils/errors';
import { fetchSessionExport } from '../utils/sessionExport';
import { getZodFieldErrors, reportRangeSchema } from '../schemas/validation';

const cleanParams = (params) =>
  Object.fromEntries(Object.entries(params).filter(([, value]) => value !== '' && value !== null && value !== undefined));

const History = () => {
  const { user } = useAuth();
  const [filters, setFilters] = useState({ page: 1, type: '', difficulty: '', sortBy: 'date', order: 'desc', startDate: '', endDate: '' });
  const params = cleanParams(filters);
  const { data, isPending: loading, error } = useSessions(params);
  const queryClient = useQueryClient();
  const [reportPreset, setReportPreset] = useState('all');
  const [exporting, setExporting] = useState(false);
  const [pendingDeleteSession, setPendingDeleteSession] = useState(null);
  const [rangeError, setRangeError] = useState('');

  const deleteMutation = useMutation({
    mutationFn: (sessionId) => api.delete(`/sessions/${sessionId}`),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.sessions }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
        queryClient.invalidateQueries({ queryKey: queryKeys.profile })
      ]);
      toast.success('Session deleted');
    },
    onError: (err) => toast.error(getErrorMessage(err, 'Could not delete session'))
  });

  const exportSessions = async () => {
    if (!user) return;
    const rangeValidation = reportRangeSchema.safeParse({ preset: reportPreset, from: filters.startDate, to: filters.endDate });
    if (!rangeValidation.success) {
      const errors = getZodFieldErrors(rangeValidation.error);
      const message = errors.from || errors.to || 'Choose a valid report period.';
      setRangeError(message);
      return;
    }

    setRangeError('');
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

      const [summaryResponse, sessions] = await Promise.all([
        api.get('/reports/summary', { params: cleanParams({ ...rangeMeta.query, type: filters.type, difficulty: filters.difficulty }) }),
        fetchSessionExport(query)
      ]);

      if (!sessions.length) {
        toast.error('No sessions match your current filters');
        return;
      }

      const { generateHistoryExportPdf } = await import('../utils/report.js');
      generateHistoryExportPdf({
        userName: user.name,
        rangeMeta,
        summaryPayload: summaryResponse.data,
        sessions,
        filters
      });
      toast.success('Filtered sessions exported');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not export session history.'));
    } finally {
      setExporting(false);
    }
  };

  const deleteSession = (sessionId) => setPendingDeleteSession(sessionId);

  return (
    <main className="page-shell mx-auto max-w-7xl px-4 sm:px-6">
      <PageHeader eyebrow="Your practice" title="Session history" description="Review completed interviews, scores, and coaching notes in one place." action={<button className="btn-primary" type="button" onClick={exportSessions} disabled={exporting}>
          <Download size={16} />
          {exporting ? 'Preparing report…' : 'Export history'}
        </button>} />
      <div className="panel mb-6 space-y-5 p-5 sm:p-6">
        <div><h2 className="font-semibold text-slate-950 dark:text-white">Find a session</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Narrow the list by interview type, level, or date.</p></div>
        <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Interview type<select aria-label="Filter by interview type" className="input mt-1.5" value={filters.type} onChange={(e) => setFilters((current) => ({ ...current, type: e.target.value, page: 1 }))}><option value="">All types</option>{['HR', 'Technical', 'Behavioural', 'Mixed', 'Custom'].map((v) => <option key={v}>{v}</option>)}</select></label>
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Difficulty<select aria-label="Filter by difficulty" className="input mt-1.5" value={filters.difficulty} onChange={(e) => setFilters((current) => ({ ...current, difficulty: e.target.value, page: 1 }))}><option value="">All levels</option>{['Easy', 'Medium', 'Hard'].map((v) => <option key={v}>{v}</option>)}</select></label>
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Sort by<select aria-label="Sort sessions by" className="input mt-1.5" value={filters.sortBy} onChange={(e) => setFilters((current) => ({ ...current, sortBy: e.target.value, page: 1 }))}><option value="date">Date</option><option value="score">Score</option></select></label>
          <label className="text-xs font-semibold text-slate-600 dark:text-slate-300">Order<select aria-label="Sort order" className="input mt-1.5" value={filters.order} onChange={(e) => setFilters((current) => ({ ...current, order: e.target.value, page: 1 }))}><option value="desc">Newest first</option><option value="asc">Oldest first</option></select></label>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold text-slate-600 dark:text-slate-300">Date period</p>
          <ReportDateRangePicker
            preset={reportPreset}
            from={filters.startDate}
            to={filters.endDate}
            onPresetChange={(value) => {
              setReportPreset(value);
              setRangeError('');
              setFilters((current) => ({ ...current, page: 1 }));
            }}
            onFromChange={(value) => { setRangeError(''); setFilters((current) => ({ ...current, startDate: value, page: 1 })); }}
            onToChange={(value) => { setRangeError(''); setFilters((current) => ({ ...current, endDate: value, page: 1 })); }}
            error={rangeError}
          />
          <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
            Exports only the sessions matching these History filters.
          </p>
        </div>
      </div>
      {loading ? <Loader label="Loading sessions..." /> : error ? (
        <RequestError title="Session history unavailable" message={getErrorMessage(error, 'Your session history could not be loaded.')} onRetry={() => queryClient.invalidateQueries({ queryKey: queryKeys.sessions })} />
      ) : data?.sessions?.length ? (
        <div className="grid gap-4 md:grid-cols-2">
          {data.sessions.map((session) => (
              <div key={session._id} className="panel flex min-h-52 flex-col justify-between p-5 sm:p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="section-kicker">{session.type} interview</p>
                  <Link to={`/sessions/${session._id}`} className="mt-1 inline-block text-lg font-semibold tracking-tight text-slate-950 hover:text-emerald-800 dark:text-white dark:hover:text-emerald-300">Session review</Link>
                  <p className="mt-1 text-sm text-slate-500 dark:text-slate-400">{formatDate(session.createdAt)}</p>
                </div>
                <div className="shrink-0 rounded-2xl bg-emerald-50 px-4 py-3 text-right dark:bg-emerald-400/10">
                  <div className="text-xs font-semibold text-slate-500 dark:text-slate-400">Final score</div>
                  <div className="mt-0.5 text-2xl font-bold tabular-nums text-emerald-800 dark:text-emerald-300">{session.finalScore}%</div>
                  <div className={`text-xs font-semibold ${gradeTone(session.grade)}`}>Grade {session.grade}</div>
                </div>
              </div>
              <div className="mt-5 flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-4 dark:border-slate-700">
                <p className="text-sm text-slate-600 dark:text-slate-300">{session.difficulty} level <span className="mx-1.5 text-slate-300">|</span> {session.totalQuestions} questions</p>
                <button className="btn-secondary min-h-9 px-3 py-1.5 text-xs" type="button" disabled={deleteMutation.isPending} onClick={() => deleteSession(session._id)}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      ) : <EmptyState title="No sessions found" description="Try a wider date range or remove a filter. Completed interviews will be saved here." icon={Download} />}
      {data && data.totalPages > 1 && (
        <div className="mt-6 flex justify-center gap-2">
          <button className="btn-secondary" type="button" disabled={filters.page <= 1} onClick={() => setFilters((current) => ({ ...current, page: current.page - 1 }))}>Previous</button>
          <span className="px-4 py-2 text-sm">Page {data.page} of {data.totalPages}</span>
          <button className="btn-secondary" type="button" disabled={filters.page >= data.totalPages} onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))}>Next</button>
        </div>
      )}
      <AppDialog
        open={Boolean(pendingDeleteSession)}
        title="Delete this session?"
        description="This permanently removes the session and its feedback from your history."
        onClose={() => setPendingDeleteSession(null)}
        busy={deleteMutation.isPending}
        actions={[
          { label: 'Keep session', variant: 'secondary', onSelect: () => setPendingDeleteSession(null) },
          { label: 'Delete session', variant: 'danger', loadingLabel: 'Deleting…', onSelect: () => { const id = pendingDeleteSession; setPendingDeleteSession(null); deleteMutation.mutate(id); } }
        ]}
      />
    </main>
  );
};

export default History;
