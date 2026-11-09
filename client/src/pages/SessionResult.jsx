import { useMemo, useState } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Activity, Award, Brain, Download, Mic2, Share2, Video } from 'lucide-react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import Loader from '../components/Loader';
import ScoreCard from '../components/ScoreCard';
import AppDialog from '../components/AppDialog';
import RequestError from '../components/RequestError';
import PageHeader from '../components/PageHeader';
import { useAuth } from '../context/AuthContext';
import api from '../utils/api';
import { useSession } from '../hooks/queries';
import { queryKeys } from '../lib/queryClient';
import { getErrorMessage } from '../utils/errors';
import { getReadableSampleAnswer } from '../utils/feedback';
import { chartAxisProps, chartTooltipProps } from '../utils/chartTheme';
import {
  aggregateTips,
  describePercentageScore,
  describeTenPointScore,
  emotionValue,
  formatDate,
  gradeTone,
  normalizeEmotion
} from '../utils/helpers';

const answerMetrics = [
  {
    key: 'relevanceScore',
    label: 'Relevance score',
    shortLabel: 'Relevance',
    description: 'How directly this answer matches the question.'
  },
  {
    key: 'fluencyScore',
    label: 'Fluency score',
    shortLabel: 'Fluency',
    description: 'How naturally and smoothly the answer was spoken.'
  },
  {
    key: 'clarityScore',
    label: 'Clarity score',
    shortLabel: 'Clarity',
    description: 'How easy the answer is to understand and follow.'
  }
];

const scoreGuide = [
  { title: '0-2', text: 'Weak answer. Needs a clearer point and structure.' },
  { title: '3-4', text: 'Needs work. Some idea is present, but not enough detail.' },
  { title: '5-6', text: 'Fair. Understandable, but could be stronger.' },
  { title: '7-8', text: 'Strong. Clear, relevant, and interview-ready.' },
  { title: '9-10', text: 'Excellent. Confident, specific, and well structured.' }
];

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
    const key = normalizeEmotion(item.emotion);
    acc[key] = (acc[key] || 0) + 1;
    return acc;
  }, {});

  const dominantEmotion = Object.entries(frequency).sort((a, b) => b[1] - a[1])[0]?.[0] || 'neutral';
  const positiveCount = snapshots.filter((item) => positiveEmotions.includes(normalizeEmotion(item.emotion))).length;
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
  const { user } = useAuth();
  const { data: session, isPending: loading, error } = useSession(id);
  const queryClient = useQueryClient();
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const deleteMutation = useMutation({
    mutationFn: (sessionId) => api.delete(`/sessions/${sessionId}`),
    onSuccess: async () => {
      queryClient.removeQueries({ queryKey: queryKeys.session(session._id) });
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.sessions }),
        queryClient.invalidateQueries({ queryKey: queryKeys.dashboard }),
        queryClient.invalidateQueries({ queryKey: queryKeys.profile })
      ]);
      toast.success('Session deleted');
      navigate('/history');
    },
    onError: (deleteError) => toast.error(getErrorMessage(deleteError, 'Could not delete session'))
  });

  const breakdown = useMemo(
    () =>
      session
        ? [
            { name: 'Expression', score: session.expressionScore, meaning: 'Camera presence' },
            { name: 'Speech', score: session.speechScore, meaning: 'Speaking flow' },
            { name: 'Content', score: session.contentScore, meaning: 'Answer quality' }
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

  if (error || !session) return <main className="page-shell mx-auto max-w-7xl px-4 sm:px-6"><RequestError title="Session unavailable" message={getErrorMessage(error, 'This session could not be found.')} onRetry={() => queryClient.invalidateQueries({ queryKey: queryKeys.session(id) })} /><Link to="/history" className="btn-secondary mt-4">Back to history</Link></main>;

  const timeline = session.emotionTimeline.map((item, index) => ({
    index: index + 1,
    emotion: normalizeEmotion(item.emotion),
    value: emotionValue(item.emotion),
    confidence: item.confidence
  }));

  const deleteSession = async () => {
    setDeleteDialogOpen(true);
  };

  const downloadSessionReport = async () => {
    try {
      const { generateSessionReportPdf } = await import('../utils/report.js');
      generateSessionReportPdf({
        userName: user?.name || 'Candidate',
        session
      });
      toast.success('Session report downloaded');
    } catch (error) {
      toast.error('Could not generate session report');
    }
  };

  const shareResult = async () => {
    const shareData = {
      title: 'Intervue interview result',
      text: `I scored ${session.finalScore}% (Grade ${session.grade}) on an interview practice session.`,
      url: window.location.href
    };
    try {
      if (navigator.share) await navigator.share(shareData);
      else {
        await navigator.clipboard.writeText(shareData.url);
        toast.success('Result link copied');
      }
    } catch (shareError) {
      if (shareError.name !== 'AbortError') toast.error('Could not share this result.');
    }
  };

  return (
    <main className="page-shell mx-auto max-w-7xl px-4 sm:px-6">
      <PageHeader
        eyebrow="Session review"
        title={`${session.type} interview`}
        description={`${session.difficulty} level — ${formatDate(session.createdAt)}`}
        action={<div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:justify-end">
          <Link className="btn-primary" to="/interview"><Video size={16} />Practice again</Link>
          <Link className="btn-secondary" to="/history">History</Link>
          <button className="btn-secondary" type="button" onClick={downloadSessionReport}><Download size={16} />Download report</button>
          <button className="btn-secondary" type="button" onClick={shareResult}><Share2 size={16} />Share result</button>
          <button className="btn-danger col-span-2 sm:col-span-1" type="button" disabled={deleteMutation.isPending} onClick={deleteSession}>{deleteMutation.isPending ? 'Deleting…' : 'Delete session'}</button>
        </div>}
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <ScoreCard
          label="Overall result"
          value={session.finalScore}
          suffix="%"
          grade={session.grade}
          caption={describePercentageScore(session.finalScore)}
          description="Your complete interview readiness score."
          scaleLabel="0-100%"
          icon={Award}
        />
        <ScoreCard
          label="Expression score"
          value={session.expressionScore}
          suffix="%"
          caption={describePercentageScore(session.expressionScore)}
          description="Camera presence from happy and neutral expression snapshots."
          scaleLabel="0-100%"
          tone="teal"
          icon={Brain}
        />
        <ScoreCard
          label="Speech score"
          value={session.speechScore}
          suffix="%"
          caption={describePercentageScore(session.speechScore)}
          description="Speaking flow based on fluency feedback."
          scaleLabel="0-100%"
          tone="amber"
          icon={Mic2}
        />
        <ScoreCard
          label="Content score"
          value={session.contentScore}
          suffix="%"
          caption={describePercentageScore(session.contentScore)}
          description="Answer quality based on relevance and clarity."
          scaleLabel="0-100%"
          tone="purple"
          icon={Activity}
        />
      </div>

      <section className="mt-4 panel p-5">
        <div className="grid gap-4 lg:grid-cols-[1.2fr_1.8fr]">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">Score guide</p>
            <h2 className="mt-1 text-xl font-black text-slate-950 dark:text-white">How to read this result</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              IntervueAI separates your performance into camera presence, speaking flow, and answer quality. The final score combines those areas into one easy percentage.
            </p>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{session.scoringExplanation}</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-5">
            {scoreGuide.map((item) => (
              <div key={item.title} className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
                <div className="text-sm font-black text-slate-950 dark:text-white">{item.title}</div>
                <p className="mt-1 text-[11px] leading-relaxed text-slate-500 dark:text-slate-400">{item.text}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <div className="panel p-4">
          <div className="mb-4">
            <h2 className="font-bold text-slate-950 dark:text-white">Performance by area</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Each bar is scored from 0-100%.</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer>
              <BarChart data={breakdown}>
                <XAxis dataKey="name" {...chartAxisProps} />
                <YAxis domain={[0, 100]} {...chartAxisProps} />
                <Tooltip
                  formatter={(value, name, item) => [`${value}%`, item.payload.meaning]}
                  {...chartTooltipProps}
                />
                <Bar dataKey="score" fill="#15998d" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="panel p-4">
          <div className="mb-4">
            <h2 className="font-bold text-slate-950 dark:text-white">Emotion timeline</h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">Shows which emotion was detected across the session.</p>
          </div>
          <div className="h-72">
            <ResponsiveContainer>
              <LineChart data={timeline}>
                <XAxis dataKey="index" {...chartAxisProps} />
                <YAxis domain={[0, 7]} {...chartAxisProps} />
                <Tooltip
                  formatter={(value, name, item) => item.payload.emotion}
                  {...chartTooltipProps}
                />
                <Line dataKey="value" stroke="#10b981" strokeWidth={3} dot={false} />
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
            <li className="border-l-2 border-indigo-200 pl-3 dark:border-indigo-300" key={tip}>{tip}</li>
          ))}
        </ul>
      </section>

      <section className="mt-6 panel p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-indigo-700 dark:text-indigo-300">Answer review</p>
            <h2 className="mt-1 text-xl font-black text-slate-950 dark:text-white">Question-by-question feedback</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              These scores are per answer. A higher number means the answer was more interview-ready.
            </p>
          </div>
          <div className="rounded-xl border border-slate-200 bg-white px-4 py-3 text-xs text-slate-600 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
            <span className="font-black text-slate-950 dark:text-white">Answer scale:</span> 0 weak, 5 fair, 10 excellent.
          </div>
        </div>
      </section>

      <section className="mt-4 space-y-4">
        {session.answers.map((answer, answerIndex) => (
          <article key={answer._id} className="panel overflow-hidden p-4">
            <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 dark:border-slate-700 dark:bg-slate-800/60">
              <p className="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">Question {answerIndex + 1}</p>
              <h3 className="mt-1 text-lg font-black text-slate-950 dark:text-white">{answer.questionId?.text}</h3>
            </div>

            <div className="mt-4 rounded-md border border-slate-200/80 bg-white/50 p-4 dark:border-white/10 dark:bg-white/5">
              <p className="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">Your answer transcript</p>
              <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                {answer.transcript || 'No answer was submitted for this question.'}
              </p>
            </div>

            <div className="mt-3 grid gap-2 sm:grid-cols-3">
              {answerMetrics.map((metric, index) => (
                <ScoreCard
                  key={metric.key}
                  label={metric.label}
                  value={answer[metric.key]}
                  suffix="/10"
                  max={10}
                  caption={describeTenPointScore(answer[metric.key])}
                  description={metric.description}
                  scaleLabel="0-10"
                  tone={index === 0 ? 'purple' : index === 1 ? 'amber' : 'teal'}
                />
              ))}
            </div>

            <div className="mt-4 grid gap-3 lg:grid-cols-[1.2fr_0.8fr]">
              <div className="rounded-xl border border-indigo-100 bg-indigo-50 p-4 dark:border-indigo-300/10 dark:bg-indigo-400/10">
                <p className="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">Suggested stronger answer</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {getReadableSampleAnswer(answer.questionId?.text, answer.sampleAnswer)}
                </p>
              </div>
              <div className="rounded-xl border border-slate-200 bg-white p-4 dark:border-slate-700 dark:bg-slate-900">
                <p className="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">Coach tips for this answer</p>
                {answer.tips?.length ? (
                  <ul className="mt-2 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                    {answer.tips.map((tip) => (
                      <li className="border-l-2 border-indigo-200 pl-3 dark:border-indigo-300" key={tip}>{tip}</li>
                    ))}
                  </ul>
                ) : (
                  <p className="mt-2 text-sm text-slate-500 dark:text-slate-400">No specific tips were generated for this answer.</p>
                )}
              </div>
            </div>
          </article>
        ))}
      </section>
      <AppDialog
        open={deleteDialogOpen}
        title="Delete this session?"
        description="This permanently removes the session and its feedback from your history."
        onClose={() => setDeleteDialogOpen(false)}
        busy={deleteMutation.isPending}
        actions={[
          { label: 'Keep session', variant: 'secondary', onSelect: () => setDeleteDialogOpen(false) },
          { label: 'Delete session', variant: 'danger', loadingLabel: 'Deleting…', onSelect: () => { setDeleteDialogOpen(false); deleteMutation.mutate(session._id); } }
        ]}
      />
    </main>
  );
};

export default SessionResult;
