export const REPORT_PRESETS = [
  { key: '7d', label: 'Last 7 days' },
  { key: '30d', label: 'Last 30 days' },
  { key: '3m', label: 'Last 3 months' },
  { key: 'all', label: 'All time' },
  { key: 'custom', label: 'Custom' }
];

export const toDateInputValue = (value) => {
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return date.toISOString().slice(0, 10);
};

const formatShortDate = (value) =>
  new Intl.DateTimeFormat(undefined, { day: '2-digit', month: 'long', year: 'numeric' }).format(new Date(value));

const formatMonthLabel = (value) =>
  new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(new Date(value));

export const resolveReportRange = ({ preset = '30d', from = '', to = '' } = {}) => {
  const now = new Date();
  const endDate = new Date(now);
  endDate.setHours(23, 59, 59, 999);

  if (preset === 'all') {
    return { preset, from: '', to: '', query: {}, label: 'All time', fileLabel: 'AllTime' };
  }

  let startDate = null;
  let customEndDate = endDate;
  if (preset === 'custom') {
    startDate = from ? new Date(from) : null;
    customEndDate = to ? new Date(to) : endDate;
    if (startDate && !Number.isNaN(startDate.getTime())) startDate.setHours(0, 0, 0, 0);
    if (customEndDate && !Number.isNaN(customEndDate.getTime())) customEndDate.setHours(23, 59, 59, 999);
  } else {
    startDate = new Date(endDate);
    if (preset === '7d') startDate.setDate(startDate.getDate() - 6);
    if (preset === '30d') startDate.setDate(startDate.getDate() - 29);
    if (preset === '3m') startDate.setMonth(startDate.getMonth() - 3);
    startDate.setHours(0, 0, 0, 0);
  }

  const safeStart = startDate && !Number.isNaN(startDate.getTime()) ? startDate : null;
  const safeEnd = customEndDate && !Number.isNaN(customEndDate.getTime()) ? customEndDate : null;
  const label = safeStart && safeEnd ? `${formatShortDate(safeStart)} – ${formatShortDate(safeEnd)}` : 'Custom period';

  return {
    preset,
    from: safeStart ? toDateInputValue(safeStart) : '',
    to: safeEnd ? toDateInputValue(safeEnd) : '',
    query: { from: safeStart ? safeStart.toISOString() : undefined, to: safeEnd ? safeEnd.toISOString() : undefined },
    label,
    fileLabel: safeStart ? formatMonthLabel(safeStart).replace(/\s+/g, '') : 'CustomPeriod'
  };
};
