import { useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Activity, Award, Download, FileText, Flame, Video } from 'lucide-react';
import Loader from '../components/Loader';
import ReportDateRangePicker from '../components/ReportDateRangePicker';
import ScoreCard from '../components/ScoreCard';
import PageHeader from '../components/PageHeader';
import RequestError from '../components/RequestError';
import EmptyState from '../components/EmptyState';
import { useAuth } from '../context/AuthContext';
import { formatDate } from '../utils/helpers';
import { chartAxisProps, chartTooltipProps } from '../utils/chartTheme';
import { resolveReportRange, toDateInputValue } from '../utils/reportRange';
import { useDashboardStats } from '../hooks/queries';
import { getErrorMessage } from '../utils/errors';
import { fetchSessionExport } from '../utils/sessionExport';
import { getZodFieldErrors, reportRangeSchema } from '../schemas/validation';
import api from '../utils/api';

const colors = ['#059669', '#10b981', '#15998d', '#0d9488', '#2563eb', '#047857', '#064e3b'];

const Dashboard = () => {
  const { user, checkingAuth } = useAuth();
  const { data: stats, isPending: loading, error, refetch } = useDashboardStats(!checkingAuth && Boolean(user));
  const defaultRange = resolveReportRange({ preset: '30d' });
  const [reportPreset, setReportPreset] = useState('30d');
  const [reportFrom, setReportFrom] = useState(defaultRange.from || toDateInputValue(new Date()));
  const [reportTo, setReportTo] = useState(defaultRange.to || toDateInputValue(new Date()));
  const [rangeError, setRangeError] = useState('');
  const [exporting, setExporting] = useState(false);

  const downloadReport = async () => {
    if (!user) return;
    const rangeValidation = reportRangeSchema.safeParse({ preset: reportPreset, from: reportFrom, to: reportTo });
    if (!rangeValidation.success) {
      const errors = getZodFieldErrors(rangeValidation.error);
      const message = errors.from || errors.to || 'Choose a valid report period.';
      setRangeError(message);
      return;
    }

    setRangeError('');
    setExporting(true);
    try {
      const rangeMeta = resolveReportRange({ preset: reportPreset, from: reportFrom, to: reportTo });
      const [summaryResponse, sessions] = await Promise.all([
        api.get('/reports/summary', { params: rangeMeta.query }),
        fetchSessionExport({ sortBy: 'date', order: 'asc', ...rangeMeta.query })
      ]);

      if (!sessions.length) {
        toast.error('No sessions found for this period');
        return;
      }

      const { generateProgressReportPdf } = await import('../utils/report.js');
      generateProgressReportPdf({
        userName: user.name,
        rangeMeta,
        summaryPayload: summaryResponse.data,
        sessions
      });
      toast.success('Progress report downloaded');
    } catch (err) {
      toast.error(getErrorMessage(err, 'Could not generate the progress report.'));
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <main className="page-shell mx-auto max-w-7xl px-4 sm:px-6"><Loader label="Loading your dashboard..." /></main>;

  return (
    <main className="page-shell mx-auto max-w-7xl px-4 sm:px-6">
      <PageHeader eyebrow="Your workspace" title={`Welcome${user?.name ? `, ${user.name.split(' ')[0]}` : ''}`} description="A clear view of the work you’ve put into interview practice." action={<Link to="/interview" className="btn-primary"><Video size={16} />Start a practice session</Link>} />
      {error ? <RequestError title="Dashboard unavailable" message={getErrorMessage(error, 'Your dashboard could not be loaded.')} onRetry={() => refetch()} /> : !stats ? <EmptyState title="Your dashboard is getting ready" description="Your completed sessions and progress will appear here." icon={Video} action={<Link to="/interview" className="btn-primary">Start your first session</Link>} /> : (
      <>
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ScoreCard
          label="Completed sessions"
          value={stats.totalSessions}
          description="Total saved interview practices."
          showProgress={false}
          icon={Video}
        />
        <ScoreCard
          label="Average final score"
          value={stats.averageScore}
          suffix="%"
          description="Your usual performance across sessions."
          scaleLabel="0-100%"
          tone="teal"
          icon={Activity}
        />
        <ScoreCard
          label="Best final score"
          value={stats.bestScore}
          suffix="%"
          description="Your strongest session so far."
          scaleLabel="0-100%"
          tone="purple"
          icon={Award}
        />
        <ScoreCard
          label="Practice streak"
          value={stats.streak}
          suffix="days"
          description="Consecutive days practiced."
          showProgress={false}
          tone="amber"
          icon={Flame}
        />
      </div>
      <section className="mt-7 panel overflow-hidden p-5 sm:p-7">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <div className="section-kicker mb-2 inline-flex items-center gap-2"><FileText size={14} />Progress report</div>
            <h2 className="text-xl font-semibold tracking-tight text-slate-950 dark:text-white sm:text-2xl">Take your progress with you</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-500 dark:text-slate-300">
              Choose a time period for a downloadable summary of your scores, session history, and recurring coaching notes.
            </p>
          </div>
          <button className="btn-primary shrink-0" type="button" onClick={downloadReport} disabled={exporting}>
            <Download size={16} />
            {exporting ? 'Preparing report…' : 'Download report'}
          </button>
        </div>
        <div className="mt-6 border-t border-slate-200 pt-5 dark:border-slate-700">
          <ReportDateRangePicker
            preset={reportPreset}
            from={reportFrom}
            to={reportTo}
            onPresetChange={(value) => { setReportPreset(value); setRangeError(''); }}
            onFromChange={(value) => { setReportFrom(value); setRangeError(''); }}
            onToChange={(value) => { setReportTo(value); setRangeError(''); }}
            error={rangeError}
          />
        </div>
      </section>
      <div className="mt-7 grid gap-5 lg:grid-cols-3">
        <div className="panel p-5 sm:p-6 lg:col-span-2">
          <div className="mb-4"><h2 className="font-semibold tracking-tight text-slate-950 dark:text-white">Score trend</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Your final result for each completed session.</p></div>
          {stats.scoreTrend.length ? (
            <div className="h-72">
              <ResponsiveContainer>
                <LineChart data={stats.scoreTrend}>
                  <XAxis dataKey="date" tickFormatter={(d) => new Date(d).toLocaleDateString()} {...chartAxisProps} />
                  <YAxis domain={[0, 100]} {...chartAxisProps} />
                  <Tooltip {...chartTooltipProps} />
                  <Line dataKey="score" stroke="#059669" strokeWidth={2.5} dot={{ r: 3, fill: '#059669' }} activeDot={{ r: 5 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="text-sm text-slate-500">No sessions yet.</p>}
        </div>
        <div className="panel p-5 sm:p-6">
          <div className="mb-4"><h2 className="font-semibold tracking-tight text-slate-950 dark:text-white">Expression mix</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Camera snapshots during practice.</p></div>
          {stats.emotionDistribution.length ? (
            <div className="h-72">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={stats.emotionDistribution} dataKey="value" nameKey="emotion" outerRadius={90} label={{ fill: 'var(--text-muted)', fontSize: 12 }}>
                    {stats.emotionDistribution.map((entry, index) => <Cell key={entry.emotion} fill={colors[index % colors.length]} />)}
                  </Pie>
                  <Tooltip {...chartTooltipProps} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="text-sm text-slate-500">Emotion snapshots appear after practice.</p>}
        </div>
      </div>
      <section className="mt-7 panel p-5 sm:p-6">
        <div className="mb-3 flex items-end justify-between gap-4"><div><h2 className="font-semibold tracking-tight text-slate-950 dark:text-white">Recent sessions</h2><p className="mt-1 text-sm text-slate-500 dark:text-slate-400">Pick up where you left off.</p></div><Link to="/history" className="text-sm font-semibold text-emerald-800 hover:underline dark:text-emerald-300">View history</Link></div>
        {stats.recentSessions.length ? (
          <div className="mt-2 divide-y divide-slate-200 dark:divide-slate-800">
            {stats.recentSessions.map((session) => (
              <Link key={session._id} to={`/sessions/${session._id}`} className="flex flex-wrap items-center justify-between gap-3 py-4 transition-colors hover:text-emerald-800 dark:hover:text-emerald-300">
                <span><span className="font-medium text-slate-900 dark:text-white">{session.type} interview</span><span className="mx-2 text-slate-300 dark:text-slate-600">/</span><span className="text-sm text-slate-500 dark:text-slate-400">{session.difficulty} — {formatDate(session.createdAt)}</span></span>
                <span className="inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-sm font-semibold text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-300">{session.finalScore}% <span className="text-xs">Grade {session.grade}</span></span>
              </Link>
            ))}
          </div>
        ) : <p className="text-sm text-slate-500">No completed sessions yet.</p>}
      </section>
      </>
      )}
    </main>
  );
};

export default Dashboard;
