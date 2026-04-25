import { Clock } from 'lucide-react';

const Timer = ({ seconds }) => {
  const minutes = Math.floor(seconds / 60);
  const rest = String(seconds % 60).padStart(2, '0');
  return (
    <div className="inline-flex items-center gap-2 rounded-md border border-[#6C63FF]/20 bg-white/50 px-3 py-2 text-sm font-bold text-slate-950 shadow-[0_0_24px_rgba(78,205,196,0.12)] backdrop-blur-xl dark:border-white/10 dark:bg-white/10 dark:text-white">
      <Clock size={16} />
      {minutes}:{rest}
    </div>
  );
};

export default Timer;
