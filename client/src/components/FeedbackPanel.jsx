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
    <div className="panel p-4">
      <div className="mb-4 rounded-md border border-[#6C63FF]/20 bg-gradient-to-r from-[#6C63FF]/10 to-[#4ECDC4]/10 px-3 py-2">
        <h3 className="font-bold text-slate-900 dark:text-white">Latest answer feedback</h3>
        <p className="mt-1 text-xs text-slate-500 dark:text-slate-300">Each answer score uses a simple 0-10 scale.</p>
      </div>
      <div className="grid gap-2 sm:grid-cols-3">
        {metrics.map((metric) => {
          const value = Number(feedback[metric.key]) || 0;
          const progress = Math.max(0, Math.min(100, value * 10));

          return (
            <div key={metric.key} className="rounded-md border border-[#6C63FF]/20 bg-white/50 p-3 dark:border-white/10 dark:bg-white/5">
              <div className="text-xs font-black uppercase tracking-wide text-slate-500 dark:text-slate-400">{metric.label}</div>
              <div className="mt-1 text-[11px] text-slate-500 dark:text-slate-400">{metric.help}</div>
              <div className="mt-3 flex items-end justify-between gap-2">
                <div>
                  <span className="text-2xl font-black text-slate-950 dark:text-white">{value}</span>
                  <span className="ml-1 text-xs font-bold text-slate-500">/10</span>
                </div>
                <span className="text-xs font-bold text-[#5B54E8] dark:text-[#4ECDC4]">{describeTenPointScore(value)}</span>
              </div>
              <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-200 dark:bg-white/10">
                <div className="h-full rounded-full bg-gradient-to-r from-[#6C63FF] to-[#4ECDC4]" style={{ width: `${progress}%` }} />
              </div>
            </div>
          );
        })}
      </div>
      <ul className="mt-3 space-y-2 text-sm text-slate-600 dark:text-slate-300">
        {feedback.tips?.map((tip) => <li key={tip}>- {tip}</li>)}
      </ul>
    </div>
  );
};

export default FeedbackPanel;
