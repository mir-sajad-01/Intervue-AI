import { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { Bar, BarChart, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import Loader from '../components/Loader';
import ScoreCard from '../components/ScoreCard';
import api from '../utils/api';
import { getReadableSampleAnswer } from '../utils/feedback';
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

  if (!session) return <main className="mx-auto max-w-7xl px-4 py-8">Session not found.</main>;

  const timeline = session.emotionTimeline.map((item, index) => ({
    index: index + 1,
    emotion: normalizeEmotion(item.emotion),
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
        <ScoreCard
          label="Overall result"
          value={session.finalScore}
          suffix="%"
          grade={session.grade}
          caption={describePercentageScore(session.finalScore)}
          description="Your complete interview readiness score."
          scaleLabel="0-100%"
        />
        <ScoreCard
          label="Expression score"
          value={session.expressionScore}
          suffix="%"
          caption={describePercentageScore(session.expressionScore)}
          description="Camera presence from happy and neutral expression snapshots."
          scaleLabel="0-100%"
          tone="teal"
        />
        <ScoreCard
          label="Speech score"
          value={session.speechScore}
          suffix="%"
          caption={describePercentageScore(session.speechScore)}
          description="Speaking flow based on fluency feedback."
          scaleLabel="0-100%"
          tone="amber"
        />
        <ScoreCard
          label="Content score"
          value={session.contentScore}
          suffix="%"
          caption={describePercentageScore(session.contentScore)}
          description="Answer quality based on relevance and clarity."
          scaleLabel="0-100%"
          tone="purple"
        />
      </div>

      <section className="mt-4 panel p-5">
        <div className="grid gap-4 lg:grid-cols-[1.2fr_1.8fr]">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-[#6C63FF] dark:text-[#4ECDC4]">Score guide</p>
            <h2 className="mt-1 text-xl font-black text-slate-950 dark:text-white">How to read this result</h2>
            <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
              IntervueAI separates your performance into camera presence, speaking flow, and answer quality. The final score combines those areas into one easy percentage.
            </p>
            <p className="mt-2 text-xs text-slate-500 dark:text-slate-400">{session.scoringExplanation}</p>
          </div>
          <div className="grid gap-2 sm:grid-cols-5">
            {scoreGuide.map((item) => (
              <div key={item.title} className="rounded-md border border-[#6C63FF]/20 bg-white/50 p-3 dark:border-white/10 dark:bg-white/5">
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
                <XAxis dataKey="name" />
                <YAxis domain={[0, 100]} />
                <Tooltip formatter={(value, name, item) => [`${value}%`, item.payload.meaning]} />
                <Bar dataKey="score" fill="#06b6d4" radius={[4, 4, 0, 0]} />
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

      <section className="mt-6 panel p-5">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-black uppercase tracking-wide text-[#6C63FF] dark:text-[#4ECDC4]">Answer review</p>
            <h2 className="mt-1 text-xl font-black text-slate-950 dark:text-white">Question-by-question feedback</h2>
            <p className="mt-2 text-sm text-slate-600 dark:text-slate-300">
              These scores are per answer. A higher number means the answer was more interview-ready.
            </p>
          </div>
          <div className="rounded-md border border-[#6C63FF]/20 bg-white/50 px-4 py-3 text-xs text-slate-600 dark:border-white/10 dark:bg-white/5 dark:text-slate-300">
            <span className="font-black text-slate-950 dark:text-white">Answer scale:</span> 0 weak, 5 fair, 10 excellent.
          </div>
        </div>
      </section>

      <section className="mt-4 space-y-4">
        {session.answers.map((answer, answerIndex) => (
          <article key={answer._id} className="panel overflow-hidden p-4">
            <div className="rounded-md border border-[#6C63FF]/20 bg-gradient-to-r from-[#6C63FF]/10 to-[#4ECDC4]/10 p-4 dark:border-white/10">
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
              <div className="rounded-md border border-[#4ECDC4]/20 bg-[#4ECDC4]/10 p-4">
                <p className="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">Suggested stronger answer</p>
                <p className="mt-2 text-sm leading-relaxed text-slate-600 dark:text-slate-300">
                  {getReadableSampleAnswer(answer.questionId?.text, answer.sampleAnswer)}
                </p>
              </div>
              <div className="rounded-md border border-[#6C63FF]/20 bg-white/50 p-4 dark:border-white/10 dark:bg-white/5">
                <p className="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">Coach tips for this answer</p>
                {answer.tips?.length ? (
                  <ul className="mt-2 space-y-2 text-sm text-slate-600 dark:text-slate-300">
                    {answer.tips.map((tip) => (
                      <li key={tip}>- {tip}</li>
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
    </main>
  );
};

export default SessionResult;
