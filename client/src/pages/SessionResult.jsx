import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import Loader from '../components/Loader';
import ScoreCard from '../components/ScoreCard';
import api from '../utils/api';
import { getReadableSampleAnswer } from '../utils/feedback';
import { aggregateTips, describeTenPointScore, emotionValue, formatDate, gradeTone } from '../utils/helpers';

const buildExpressionSummary = (session) => {
  const snapshots = session?.emotionTimeline || [];
  if (!snapshots.length) {
    return {
      headline: 'Expression feedback unavailable',
      summary:
        'No facial-expression snapshots were captured during this session, so the expression score could not be interpreted in a meaningful way.',
      dominantEmotion: 'N/A',
      positiveRate: 0,
      totalSnapshots: 0
    };
  }

  const positiveEmotions = ['happy', 'neutral'];
  const frequency = snapshots.reduce((acc, item) => {
    const key = String(item.emotion || '').toLowerCase();
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const dominantEmotion = Object.entries(frequency).sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral';
  const positiveCount = snapshots.filter((item) => positiveEmotions.includes(String(item.emotion || '').toLowerCase())).length;
  const positiveRate = Math.round((positiveCount / snapshots.length) * 100);

  let headline = 'Expression needs more consistency';
  let summary = `Your camera presence leaned mostly ${dominantEmotion}. Try to keep a calm, engaged expression and avoid letting tension sit on your face for too long.`;

  if (session.expressionScore >= 70) {
    headline = 'Strong expression control';
    summary = `You maintained a steady, interview-friendly expression for most of the session. ${dominantEmotion === 'happy' ? 'Your visible positivity helped.' : 'Your neutral composure worked in your favor.'}`;
  } else if (session.expressionScore >= 40) {
    headline = 'Mostly steady expression';
    summary =
      'Your expression was reasonably controlled, but it drifted at times. Keeping your face relaxed and responsive more consistently would lift the overall impression.';
  }

  if (['fear', 'sad', 'angry', 'disgust'].includes(dominantEmotion)) {
    summary =
      `The dominant expression looked ${dominantEmotion}, which can read as nervous or closed-off in an interview. ` +
      'Focus on relaxing your jaw, softening your eyes, and returning to a neutral listening face between answers.';
  }

  return {
    headline,
    summary,
    dominantEmotion,
    positiveRate,
    totalSnapshots: snapshots.length
  };
};

const SessionResult = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get(`/sessions/${id}`)
      .then(({ data }) => setSession(data.session))
      .finally(() => setLoading(false));
  }, [id]);

  const breakdown = useMemo(
    () =>
      session
        ? [
            { name: 'Expression', score: session.expressionScore },
            { name: 'Speech', score: session.speechScore },
            { name: 'Content', score: session.contentScore }
          ]
        : [],
    [session]
  );

  const expressionSummary = useMemo(() => buildExpressionSummary(session), [session]);

  if (loading) {
    return (
      <main className="mx-auto max-w-7xl px-4 py-8">
        <Loader label="Loading result..." />
      </main>
    );
  }

  if (!session) return <main className="mx-auto max-w-7xl px-4 py-8">Session not found.</main>;

  const timeline = session.emotionTimeline.map((item, index) => ({
    index: index + 1,
    emotion: item.emotion,
    value: emotionValue(item.emotion),
    confidence: item.confidence
  }));

  const deleteSession = async () => {
    const confirmed = window.confirm('Delete this saved session permanently?');
    if (!confirmed) return;

    try {
      await api.delete(`/sessions/${session._id}`);
      toast.success('Session deleted');
      navigate('/history');
    } catch (error) {
      toast.error(error.response?.data?.message || 'Could not delete session');
    }
  };

  return (
    <main className="mx-auto max-w-7xl px-4 py-8">
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-3xl font-black text-slate-950 dark:text-white">Session Result</h1>
          <p className="text-sm text-slate-500">
            {session.type} - {session.difficulty} - {formatDate(session.createdAt)}
          </p>
        </div>
        <div className="flex gap-2">
          <Link className="btn-primary" to="/interview">
            Practice Again
          </Link>
          <Link className="btn-secondary" to="/dashboard">
            Go to Dashboard
          </Link>
          <button className="btn-secondary" onClick={deleteSession}>
            Delete Session
          </button>
          <button
            className="btn-secondary"
            onClick={() =>
              navigator.share?.({
                title: 'IntervueAI Result',
                text: `I scored ${session.finalScore}% (${session.grade}) on IntervueAI.`
              })
            }
          >
            Share Result
          </button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <ScoreCard label="Overall" value={`${session.finalScore}%`} grade={session.grade} />
        <ScoreCard label="Expression" value={`${session.expressionScore}%`} />
        <ScoreCard label="Speech" value={`${session.speechScore}%`} />
        <ScoreCard label="Content" value={`${session.contentScore}%`} />
      </div>
      <section className="mt-4 panel p-4">
        <p className="text-sm font-semibold text-slate-900 dark:text-white">{session.scoringExplanation}</p>
        <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">
          Grade scale: A = 90-100, B = 75-89, C = 60-74, D = 45-59, F = below 45.
        </p>
      </section>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="panel p-4">
          <h2 className="mb-4 font-bold text-slate-950 dark:text-white">Breakdown</h2>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={breakdown}>
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip />
                <Bar dataKey="score" fill="#06b6d4" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="panel p-4">
          <h2 className="mb-4 font-bold text-slate-950 dark:text-white">Emotion Timeline</h2>
          <div className="h-72">
            <ResponsiveContainer>
              <LineChart data={timeline}>
                <XAxis dataKey="index" />
                <YAxis domain={[0, 7]} />
                <Tooltip formatter={(value, name, item) => item.payload.emotion} />
                <Line dataKey="value" stroke="#34d399" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <section className="mt-6 panel p-4">
        <h2 className="mb-3 font-bold text-slate-950 dark:text-white">Expression Feedback</h2>
        <p className="text-sm font-semibold text-slate-900 dark:text-white">{expressionSummary.headline}</p>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">{expressionSummary.summary}</p>
        <div className="mt-4 grid gap-3 sm:grid-cols-3">
          <div className="rounded-md border border-white/10 bg-white/5 p-3">
            <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Dominant emotion</div>
            <div className="mt-1 text-sm font-semibold capitalize text-slate-900 dark:text-white">
              {expressionSummary.dominantEmotion}
            </div>
          </div>
          <div className="rounded-md border border-white/10 bg-white/5 p-3">
            <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Positive frames</div>
            <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
              {expressionSummary.positiveRate}%
            </div>
          </div>
          <div className="rounded-md border border-white/10 bg-white/5 p-3">
            <div className="text-xs uppercase tracking-wide text-slate-500 dark:text-slate-400">Snapshots captured</div>
            <div className="mt-1 text-sm font-semibold text-slate-900 dark:text-white">
              {expressionSummary.totalSnapshots}
            </div>
          </div>
        </div>
      </section>

      <section className="mt-6 panel p-4">
        <h2 className="mb-3 font-bold text-slate-950 dark:text-white">Highlights</h2>
        <p className={`text-sm font-semibold ${gradeTone(session.grade)}`}>Grade {session.grade}</p>
        <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
          Strongest answer: {session.strongestAnswer?.questionId?.text || 'Not available'}
        </p>
        <p className="text-sm text-slate-600 dark:text-slate-300">
          Weakest answer: {session.weakestAnswer?.questionId?.text || 'Not available'}
        </p>
      </section>

      <section className="mt-6 panel p-4">
        <h2 className="mb-3 font-bold text-slate-950 dark:text-white">Improvement Tips</h2>
        <ul className="space-y-2 text-sm text-slate-600 dark:text-slate-300">
          {aggregateTips(session.answers).map((tip) => (
            <li key={tip}>- {tip}</li>
          ))}
        </ul>
      </section>

      <section className="mt-6 space-y-4">
        {session.answers.map((answer, answerIndex) => (
          <article key={answer._id} className="panel p-4">
            <h3 className="font-bold text-slate-950 dark:text-white">
              {answerIndex + 1}. {answer.questionId?.text}
            </h3>
            <p className="mt-3 text-sm text-slate-500">{answer.transcript}</p>
            <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">
              This answer uses a 0-10 scale: 0-2 weak, 3-4 needs work, 5-6 fair, 7-8 strong, 9-10 excellent.
            </p>
            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              <ScoreCard
                label="Relevance"
                value={answer.relevanceScore}
                suffix="/10"
                caption={describeTenPointScore(answer.relevanceScore)}
              />
              <ScoreCard
                label="Fluency"
                value={answer.fluencyScore}
                suffix="/10"
                caption={describeTenPointScore(answer.fluencyScore)}
              />
              <ScoreCard
                label="Clarity"
                value={answer.clarityScore}
                suffix="/10"
                caption={describeTenPointScore(answer.clarityScore)}
              />
            </div>
            <p className="mt-3 text-sm font-semibold text-slate-900 dark:text-white">Suggested better answer</p>
            <p className="text-sm text-slate-600 dark:text-slate-300">
              {getReadableSampleAnswer(answer.questionId?.text, answer.sampleAnswer)}
            </p>
          </article>
        ))}
      </section>
    </main>
  );
};

export default SessionResult;
