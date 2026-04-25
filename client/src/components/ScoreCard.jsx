import { gradeTone } from '../utils/helpers';

const ScoreCard = ({ label, value, grade }) => (
  <div className="panel relative overflow-hidden p-4">
    <div className="absolute right-0 top-0 h-20 w-20 rounded-bl-full bg-gradient-to-br from-[#6C63FF]/20 to-[#4ECDC4]/20 blur-xl" />
    <div className="relative text-sm font-medium text-slate-400">{label}</div>
    <div className="mt-1 flex items-end gap-2">
      <span className="relative text-3xl font-black text-slate-950 dark:text-white">{value ?? 0}</span>
      {grade && <span className={`text-xl font-black ${gradeTone(grade)}`}>{grade}</span>}
    </div>
  </div>
);

export default ScoreCard;
