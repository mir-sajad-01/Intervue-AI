import { describePercentageScore, describeTenPointScore, gradeTone } from '../utils/helpers';

const toNumber = (value) => {
  const parsed = parseFloat(String(value ?? '').replace(/[^\d.-]/g, ''));
  return Number.isFinite(parsed) ? parsed : null;
};

const toneStyles = {
  primary: 'bg-emerald-50 text-emerald-800 dark:bg-emerald-400/10 dark:text-emerald-300',
  teal: 'bg-teal-50 text-teal-800 dark:bg-teal-400/10 dark:text-teal-300',
  purple: 'bg-violet-50 text-violet-800 dark:bg-violet-400/10 dark:text-violet-300',
  amber: 'bg-orange-50 text-orange-800 dark:bg-orange-400/10 dark:text-orange-300'
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
  showProgress = true,
  tone = 'primary',
  icon: Icon
}) => {
  const numericValue = toNumber(value);
  const safeMax = Number(max) || 100;
  const progress = numericValue === null ? 0 : Math.max(0, Math.min(100, (numericValue / safeMax) * 100));
  const autoCaption = caption || (showProgress && numericValue !== null
    ? safeMax === 10 ? describeTenPointScore(numericValue) : describePercentageScore(numericValue)
    : '');

  return (
    <article className="panel stat-card p-5 sm:p-6">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          {Icon ? <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${toneStyles[tone] || toneStyles.primary}`}><Icon size={19} strokeWidth={1.9} /></span> : null}
          <div>
            <h2 className="text-sm font-semibold text-slate-600 dark:text-slate-400">{label}</h2>
            {description ? <p className="mt-1.5 max-w-xs text-xs leading-5 text-slate-500 dark:text-slate-400">{description}</p> : null}
          </div>
        </div>
        {grade ? <span className={`rounded-lg bg-slate-100 px-2.5 py-1 text-lg font-bold dark:bg-slate-800 ${gradeTone(grade)}`}>{grade}</span> : null}
      </div>

      <div className="mt-5 flex items-end gap-2">
        <span className="text-4xl font-bold tracking-tight tabular-nums text-slate-950 dark:text-white">{value ?? 0}</span>
        {suffix ? <span className="pb-1 text-sm font-medium text-slate-500 dark:text-slate-400">{suffix}</span> : null}
      </div>

      {showProgress && numericValue !== null ? (
        <div className="mt-4">
          <div className="h-1.5 overflow-hidden rounded-full bg-slate-100 dark:bg-slate-800">
            <div className="h-full rounded-full bg-indigo-600 transition-[width] dark:bg-indigo-400" style={{ width: `${progress}%` }} />
          </div>
          <div className="mt-2 flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>{autoCaption}</span><span>{scaleLabel || `0–${safeMax}`}</span>
          </div>
        </div>
      ) : autoCaption ? <p className="mt-3 text-xs text-slate-500 dark:text-slate-400">{autoCaption}</p> : null}
    </article>
  );
};

export default ScoreCard;
