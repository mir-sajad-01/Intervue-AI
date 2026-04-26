import { useEffect, useState } from 'react';
import toast from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Download, FileText } from 'lucide-react';
import Loader from '../components/Loader';
import ReportDateRangePicker from '../components/ReportDateRangePicker';
import ScoreCard from '../components/ScoreCard';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { formatDate } from '../utils/helpers';
import { generateProgressReportPdf, resolveReportRange, toDateInputValue } from '../utils/report';

const colors = ['#06b6d4', '#34d399', '#f59e0b', '#fb7185', '#8b5cf6', '#64748b', '#ef4444'];

const Dashboard = () => {
  const { user, checkingAuth } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const defaultRange = resolveReportRange({ preset: '30d' });
  const [reportPreset, setReportPreset] = useState('30d');
  const [reportFrom, setReportFrom] = useState(defaultRange.from || toDateInputValue(new Date()));
  const [reportTo, setReportTo] = useState(defaultRange.to || toDateInputValue(new Date()));
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    if (checkingAuth || !user) return;
    setError('');
    api
      .get('/dashboard/stats')
      .then(({ data }) => setStats(data))
      .catch((err) => setError(err.response?.data?.message || 'Could not load dashboard'))
      .finally(() => setLoading(false));
  }, [checkingAuth, user]);

  const downloadReport = async () => {
    if (!user) return;
    if (reportPreset === 'custom' && (!reportFrom || !reportTo)) {
      toast.error('Choose both dates for a custom report range');
      return;
    }

    setExporting(true);
    try {
      const rangeMeta = resolveReportRange({ preset: reportPreset, from: reportFrom, to: reportTo });
      const [summaryResponse, sessionsResponse] = await Promise.all([
        api.get('/reports/summary', { params: rangeMeta.query }),
        api.get('/sessions', { params: { limit: 1000, sortBy: 'date', order: 'asc', ...rangeMeta.query } })
      ]);

      if (!sessionsResponse.data.sessions?.length) {
        toast.error('No sessions found for this period');
        return;
      }

      generateProgressReportPdf({
        userName: user.name,
        rangeMeta,
        summaryPayload: summaryResponse.data,
        sessions: sessionsResponse.data.sessions
      });
      toast.success('Progress report downloaded');
    } catch (err) {
      toast.error(err.response?.data?.message || 'Could not generate report');
    } finally {
      setExporting(false);
    }
  };

  if (loading) return <main className="mx-auto max-w-7xl px-4 py-8"><Loader label="Loading dashboard..." /></main>;

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-3xl font-black text-slate-950 dark:text-white">Dashboard</h1>
        <Link to="/interview" className="btn-primary">Quick Start</Link>
      </div>
      {error && <div className="panel mb-4 p-4 text-sm text-rose-300">{error}</div>}
      {!stats ? <div className="panel p-8 text-center text-slate-500">Dashboard data is unavailable.</div> : (
      <>
      <div className="grid gap-4 md:grid-cols-4">
        <ScoreCard label="Sessions" value={stats.totalSessions} />
        <ScoreCard label="Average Score" value={`${stats.averageScore}%`} />
        <ScoreCard label="Best Score" value={`${stats.bestScore}%`} />
        <ScoreCard label="Streak" value={`${stats.streak}d`} />
      </div>
      <section className="mt-6 panel p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div className="max-w-2xl">
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-300">
              <FileText size={14} />
              Download Progress Report
            </div>
            <h2 className="text-xl font-black text-slate-950 dark:text-white">Export a polished PDF summary of your interview practice</h2>
            <p className="mt-2 text-sm text-slate-500 dark:text-slate-300">
              Choose a time period and download a branded report with scores, trends, session tables, question performance, and repeated coaching tips.
            </p>
          </div>
          <button className="btn-primary" onClick={downloadReport} disabled={exporting}>
            <Download size={16} />
            {exporting ? 'Preparing PDF...' : 'Download My Progress Report'}
          </button>
        </div>
        <div className="mt-5">
          <ReportDateRangePicker
            preset={reportPreset}
            from={reportFrom}
            to={reportTo}
            onPresetChange={setReportPreset}
            onFromChange={setReportFrom}
            onToChange={setReportTo}
          />
        </div>
      </section>
      <div className="mt-6 grid gap-4 lg:grid-cols-3">
        <div className="panel p-4 lg:col-span-2">
          <h2 className="mb-4 font-bold text-slate-950 dark:text-white">Score Trend</h2>
          {stats.scoreTrend.length ? (
            <div className="h-72">
              <ResponsiveContainer>
                <LineChart data={stats.scoreTrend}>
                  <XAxis dataKey="date" tickFormatter={(d) => new Date(d).toLocaleDateString()} />
                  <YAxis domain={[0, 100]} />
                  <Tooltip />
                  <Line dataKey="score" stroke="#06b6d4" strokeWidth={3} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="text-sm text-slate-500">No sessions yet.</p>}
        </div>
        <div className="panel p-4">
          <h2 className="mb-4 font-bold text-slate-950 dark:text-white">Emotion Distribution</h2>
          {stats.emotionDistribution.length ? (
            <div className="h-72">
              <ResponsiveContainer>
                <PieChart>
                  <Pie data={stats.emotionDistribution} dataKey="value" nameKey="emotion" outerRadius={90} label>
                    {stats.emotionDistribution.map((entry, index) => <Cell key={entry.emotion} fill={colors[index % colors.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
          ) : <p className="text-sm text-slate-500">Emotion snapshots appear after practice.</p>}
        </div>
      </div>
      <section className="mt-6 panel p-4">
        <h2 className="mb-4 font-bold text-slate-950 dark:text-white">Recent Sessions</h2>
        {stats.recentSessions.length ? (
          <div className="divide-y divide-slate-200 dark:divide-slate-800">
            {stats.recentSessions.map((session) => (
              <Link key={session._id} to={`/sessions/${session._id}`} className="flex flex-wrap items-center justify-between gap-2 py-3">
                <span>{session.type} · {session.difficulty} · {formatDate(session.createdAt)}</span>
                <span className="font-bold text-cyan-600">{session.finalScore}% · {session.grade}</span>
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
