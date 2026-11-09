import { describeTenPointScore } from '../utils/helpers';

const metrics = [
  {
    key: 'relevanceScore',
    label: 'Relevance',
    help: 'Answers the question'
  },
  {
    key: 'fluencyScore',
    label: 'Fluency',
    help: 'Speaking flow'
  },
  {
    key: 'clarityScore',
    label: 'Clarity',
    help: 'Easy to understand'
  }
];

const FeedbackPanel = ({ feedback }) => {
  if (!feedback) return null;

  return (
    <section className="panel p-4 sm:p-5">
      <div className="mb-4 flex flex-wrap items-start justify-between gap-3">
        <div><p className="section-kicker">Answer review</p><h3 className="mt-1 font-semibold text-slate-950 dark:text-white">Your feedback</h3></div>
        <span className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">Each score out of 10</span>
      </div>
      <div className="mb-4 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 dark:border-slate-700 dark:bg-slate-800/60">
        {feedback.evaluationSource === 'fallback' ? <p className="mt-2 text-xs text-amber-700 dark:text-amber-300" role="status">Gemini is unavailable right now. This feedback uses the local evaluator.</p> : null}
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        {metrics.map((metric) => {
          const value = Number(feedback[metric.key]) || 0;
          const progress = Math.max(0, Math.min(100, value * 10));

          return (
            <div key={metric.key} className="rounded-xl border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-900">
              <div className="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">{metric.label}</div>
              <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{metric.help}</div>
              <div className="mt-3 flex items-end justify-between gap-2">
                <div>
                  <span className="text-2xl font-black text-slate-950 dark:text-white">{value}</span>
                  <span className="ml-1 text-xs font-bold text-slate-500">/10</span>
                </div>
                <span className="text-xs font-semibold text-emerald-800 dark:text-emerald-300">{describeTenPointScore(value)}</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                <div className="h-full rounded-full bg-emerald-600 dark:bg-emerald-400" style={{ width: `${progress}%` }} />
              </div>
            </div>
          );
        })}
      </div>
      <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
        {feedback.tips?.map((tip) => <li className="border-l-2 border-emerald-500 pl-3" key={tip}>{tip}</li>)}
      </ul>
    </section>
  );
};

export default FeedbackPanel;
