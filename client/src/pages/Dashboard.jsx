import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Cell, Line, LineChart, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import Loader from '../components/Loader';
import ScoreCard from '../components/ScoreCard';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { formatDate } from '../utils/helpers';

const colors = ['#06b6d4', '#34d399', '#f59e0b', '#fb7185', '#8b5cf6', '#64748b', '#ef4444'];

const Dashboard = () => {
  const { user, checkingAuth } = useAuth();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (checkingAuth || !user) return;
    setError('');
    api
      .get('/dashboard/stats')
      .then(({ data }) => setStats(data))
      .catch((err) => setError(err.response?.data?.message || 'Could not load dashboard'))
      .finally(() => setLoading(false));
  }, [checkingAuth, user]);

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
