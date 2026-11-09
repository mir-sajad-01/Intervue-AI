import { Clock } from 'lucide-react';

const Timer = ({ seconds }) => {
  const minutes = Math.floor(seconds / 60);
  const rest = String(seconds % 60).padStart(2, '0');
  return (
    <div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3.5 py-2.5 text-sm font-semibold tabular-nums text-slate-900 dark:border-slate-700 dark:bg-slate-900 dark:text-white" aria-label={`Time remaining ${minutes} minutes ${rest} seconds`}>
      <Clock size={16} className="text-emerald-700 dark:text-emerald-300" />
      <span>{minutes}:{rest}</span>
    </div>
  );
};

export default Timer;
