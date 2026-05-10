import { describePercentageScore, describeTenPointScore, gradeTone } from '../utils/helpers';

const tones = {
  purple: {
    title: 'from-[#6C63FF]/20 to-[#4ECDC4]/10 border-[#6C63FF]/25',
    bar: 'from-[#6C63FF] to-[#4ECDC4]'
  },
  teal: {
    title: 'from-[#4ECDC4]/20 to-emerald-400/10 border-[#4ECDC4]/25',
    bar: 'from-[#4ECDC4] to-emerald-400'
  },
  amber: {
    title: 'from-amber-400/20 to-orange-400/10 border-amber-300/25',
    bar: 'from-amber-300 to-orange-400'
  },
  rose: {
    title: 'from-rose-400/20 to-pink-400/10 border-rose-300/25',
    bar: 'from-rose-400 to-pink-400'
  }
};

const toNumber = (value) => {
  const parsed = parseFloat(String(value ?? '').replace(/[^\d.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
};

const ScoreCard = ({
  label,
  value,
  grade,
  suffix = '',
  caption = '',
  description = '',
  max = 100,
  scaleLabel = '',
  tone = 'purple',
  showProgress = true
}) => {
  const numericValue = toNumber(value);
  const safeMax = Number(max) || 100;
  const progress = numericValue === null ? 0 : Math.max(0, Math.min(100, (numericValue / safeMax) * 100));
  const selectedTone = tones[tone] || tones.purple;
  const autoCaption =
    caption ||
    (showProgress && numericValue !== null
      ? safeMax === 10
        ? describeTenPointScore(numericValue)
        : describePercentageScore(numericValue)
      : '');

  return (
    <div className="panel relative overflow-hidden p-4">
      <div className="absolute right-0 top-0 h-24 w-24 rounded-bl-full bg-gradient-to-br from-[#6C63FF]/20 to-[#4ECDC4]/20 blur-2xl" />
      <div className={`relative rounded-md border bg-gradient-to-br px-3 py-2 ${selectedTone.title}`}>
        <div className="text-[11px] font-black uppercase tracking-wide text-slate-700 dark:text-slate-200">{label}</div>
        {description ? <p className="mt-1 text-xs leading-relaxed text-slate-500 dark:text-slate-300">{description}</p> : null}
      </div>

      <div className="relative mt-4 flex items-end justify-between gap-3">
        <div className="flex items-end gap-2">
          <span className="text-4xl font-black text-slate-950 dark:text-white">{value ?? 0}</span>
          {suffix ? <span className="pb-1 text-sm font-bold text-slate-500 dark:text-slate-300">{suffix}</span> : null}
        </div>
        {grade ? (
          <span className={`rounded-md border border-white/10 bg-white/10 px-3 py-1 text-xl font-black ${gradeTone(grade)}`}>
            {grade}
          </span>
        ) : null}
      </div>

      {showProgress && numericValue !== null ? (
        <div className="relative mt-4">
          <div className="h-2 overflow-hidden rounded-full bg-slate-200/80 dark:bg-white/10">
            <div className={`h-full rounded-full bg-gradient-to-r ${selectedTone.bar}`} style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs font-semibold text-slate-500 dark:text-slate-400">
            <span>{autoCaption}</span>
            <span>{scaleLabel || `0-${safeMax}`}</span>
          </div>
        </div>
      ) : autoCaption ? (
        <p className="relative mt-3 text-xs font-semibold text-slate-500 dark:text-slate-400">{autoCaption}</p>
      ) : null}
    </div>
  );
};

export default ScoreCard;
