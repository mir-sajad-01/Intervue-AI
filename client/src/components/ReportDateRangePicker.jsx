import { REPORT_PRESETS, resolveReportRange } from '../utils/reportRange';

const ReportDateRangePicker = ({
  preset,
  from,
  to,
  onPresetChange,
  onFromChange,
  onToChange,
  error = ''
}) => {
  const selectPreset = (nextPreset) => {
    if (nextPreset === 'custom') {
      onPresetChange('custom');
      return;
    }

    const range = resolveReportRange({ preset: nextPreset });
    onPresetChange(nextPreset);
    onFromChange(range.from);
    onToChange(range.to);
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {REPORT_PRESETS.map((option) => (
          <button
            key={option.key}
            type="button"
            className={preset === option.key ? 'btn-primary px-3 py-2 text-xs' : 'btn-secondary px-3 py-2 text-xs'}
            onClick={() => selectPreset(option.key)}
          >
            {option.label}
          </button>
        ))}
      </div>
      {preset === 'custom' && (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="text-sm text-slate-600 dark:text-slate-300">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">From</span>
            <input className="input" type="date" value={from} aria-invalid={Boolean(error)} aria-describedby={error ? 'report-range-error' : undefined} onChange={(event) => onFromChange(event.target.value)} />
          </label>
          <label className="text-sm text-slate-600 dark:text-slate-300">
            <span className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-400">To</span>
            <input className="input" type="date" value={to} aria-invalid={Boolean(error)} aria-describedby={error ? 'report-range-error' : undefined} onChange={(event) => onToChange(event.target.value)} />
          </label>
        </div>
      )}
      {error ? <p id="report-range-error" role="alert" className="text-sm text-rose-600 dark:text-rose-400">{error}</p> : null}
    </div>
  );
};

export default ReportDateRangePicker;
