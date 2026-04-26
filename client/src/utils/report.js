import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const COLORS = {
  ink: [15, 23, 42],
  muted: [100, 116, 139],
  purple: [108, 99, 255],
  teal: [78, 205, 196],
  slate: [226, 232, 240],
  panel: [248, 250, 252],
  emerald: [16, 185, 129],
  amber: [245, 158, 11],
  rose: [244, 63, 94]
};

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

const formatDateTime = (value) =>
  new Intl.DateTimeFormat(undefined, { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(value));

const formatMonthLabel = (value) =>
  new Intl.DateTimeFormat(undefined, { month: 'long', year: 'numeric' }).format(new Date(value));

export const resolveReportRange = ({ preset = '30d', from = '', to = '' } = {}) => {
  const now = new Date();
  const endDate = new Date(now);
  endDate.setHours(23, 59, 59, 999);

  if (preset === 'all') {
    return {
      preset,
      from: '',
      to: '',
      query: {},
      label: 'All time',
      fileLabel: 'AllTime'
    };
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
  const label = safeStart && safeEnd
    ? `${formatShortDate(safeStart)} - ${formatShortDate(safeEnd)}`
    : 'Custom period';

  return {
    preset,
    from: safeStart ? toDateInputValue(safeStart) : '',
    to: safeEnd ? toDateInputValue(safeEnd) : '',
    query: {
      from: safeStart ? safeStart.toISOString() : undefined,
      to: safeEnd ? safeEnd.toISOString() : undefined
    },
    label,
    fileLabel: safeStart ? formatMonthLabel(safeStart).replace(/\s+/g, '') : 'CustomPeriod'
  };
};

const sanitizeFilePart = (value = '') =>
  String(value).replace(/[^a-z0-9]+/gi, '').trim() || 'User';

export const buildReportFileName = (userName, rangeMeta) =>
  `IntervueAI_Report_${sanitizeFilePart(userName)}_${sanitizeFilePart(rangeMeta.fileLabel)}.pdf`;

const formatDuration = (seconds = 0) => {
  const totalMinutes = Math.round((seconds || 0) / 60);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (!hours) return `${minutes} min`;
  return `${hours} hr ${minutes} min`;
};

const gradeColor = (grade) => {
  if (grade === 'A') return COLORS.emerald;
  if (grade === 'B' || grade === 'C') return COLORS.amber;
  return COLORS.rose;
};

const drawSectionTitle = (doc, title, y) => {
  doc.setDrawColor(...COLORS.purple);
  doc.setLineWidth(1.2);
  doc.line(40, y, 555, y);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(...COLORS.ink);
  doc.text(title, 40, y - 10);
};

const drawMetricGrid = (doc, metrics, startY) => {
  const cardWidth = 248;
  const cardHeight = 58;
  const gap = 14;

  metrics.forEach((metric, index) => {
    const column = index % 2;
    const row = Math.floor(index / 2);
    const x = 40 + column * (cardWidth + gap);
    const y = startY + row * (cardHeight + gap);

    doc.setFillColor(...COLORS.panel);
    doc.setDrawColor(...COLORS.slate);
    doc.roundedRect(x, y, cardWidth, cardHeight, 10, 10, 'FD');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.setTextColor(...COLORS.muted);
    doc.text(metric.label.toUpperCase(), x + 14, y + 16);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.setTextColor(...COLORS.ink);
    doc.text(String(metric.value), x + 14, y + 39);
  });

  return startY + Math.ceil(metrics.length / 2) * (cardHeight + gap);
};

const drawPerformanceBars = (doc, performance, startY) => {
  const barLeft = 140;
  const barWidth = 300;
  const barHeight = 14;
  const colors = [COLORS.purple, COLORS.teal, [14, 165, 233]];

  performance.chartData.forEach((item, index) => {
    const y = startY + index * 34;
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...COLORS.ink);
    doc.text(item.label, 40, y + 11);

    doc.setFillColor(...COLORS.slate);
    doc.roundedRect(barLeft, y, barWidth, barHeight, 7, 7, 'F');
    doc.setFillColor(...colors[index % colors.length]);
    doc.roundedRect(barLeft, y, Math.max(8, (barWidth * item.score) / 100), barHeight, 7, 7, 'F');

    doc.setFont('helvetica', 'bold');
    doc.text(`${item.score}%`, barLeft + barWidth + 16, y + 11);
  });

  const statsTop = startY + performance.chartData.length * 34 + 10;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...COLORS.muted);
  doc.text(`Most frequent emotion: ${performance.mostFrequentEmotion || 'N/A'}`, 40, statsTop);
  doc.text(`Average filler words per session: ${performance.averageFillerWordsPerSession}`, 300, statsTop);

  return statsTop + 18;
};

const drawHeaderFooter = (doc, meta) => {
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const pageNumber = doc.internal.getCurrentPageInfo().pageNumber;

  doc.setDrawColor(...COLORS.slate);
  doc.line(40, 28, pageWidth - 40, 28);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.purple);
  doc.text('IntervueAI', 40, 20);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...COLORS.muted);
  doc.text(`${meta.userName}  |  ${meta.periodLabel}`, pageWidth - 40, 20, { align: 'right' });

  doc.setDrawColor(...COLORS.slate);
  doc.line(40, pageHeight - 24, pageWidth - 40, pageHeight - 24);
  doc.text(`Page ${pageNumber}`, pageWidth - 40, pageHeight - 10, { align: 'right' });
};

export const generateProgressReportPdf = ({ userName, rangeMeta, summaryPayload, sessions }) => {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const { summary, performance, insights, questionPerformance, generatedAt } = summaryPayload;
  const pageWidth = doc.internal.pageSize.getWidth();

  doc.setFillColor(248, 250, 252);
  doc.rect(0, 0, pageWidth, doc.internal.pageSize.getHeight(), 'F');

  doc.setFillColor(...COLORS.purple);
  doc.roundedRect(40, 60, 76, 76, 20, 20, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(255, 255, 255);
  doc.text('IA', 78, 108, { align: 'center' });

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(26);
  doc.setTextColor(...COLORS.ink);
  doc.text('IntervueAI Progress Report', 140, 92);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(13);
  doc.setTextColor(...COLORS.muted);
  doc.text(`Prepared for ${userName}`, 140, 118);
  doc.text(`Report period: ${rangeMeta.label}`, 140, 140);

  doc.setDrawColor(...COLORS.slate);
  doc.setLineWidth(1);
  doc.line(40, 180, pageWidth - 40, 180);

  const coverRows = [
    ['Generated on', formatDateTime(generatedAt)],
    ['Total sessions in this period', String(summary.totalSessions)],
    ['Average score', `${summary.averageOverallScore}%`],
    ['Overall grade', summary.overallGrade]
  ];

  autoTable(doc, {
    startY: 208,
    margin: { left: 40, right: 40 },
    theme: 'grid',
    body: coverRows,
    styles: {
      fontSize: 10,
      cellPadding: 10,
      textColor: COLORS.ink
    },
    columnStyles: {
      0: { fontStyle: 'bold', fillColor: COLORS.panel, cellWidth: 180 },
      1: { cellWidth: 255 }
    }
  });

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(...COLORS.muted);
  doc.text(
    'This report summarizes your interview practice history, scoring trends, communication patterns, and the coaching signals IntervueAI captured during this period.',
    40,
    doc.lastAutoTable.finalY + 34,
    { maxWidth: 515 }
  );

  doc.addPage();
  drawHeaderFooter(doc, { userName, periodLabel: rangeMeta.label });

  let cursorY = 64;
  drawSectionTitle(doc, 'Summary', cursorY);
  cursorY = drawMetricGrid(
    doc,
    [
      { label: 'Total sessions completed', value: summary.totalSessions },
      { label: 'Average overall score', value: `${summary.averageOverallScore}%` },
      { label: 'Best score achieved', value: `${summary.bestScore}%` },
      { label: 'Worst score', value: `${summary.worstScore}%` },
      { label: 'Total practice time', value: formatDuration(summary.totalPracticeTimeSeconds) },
      { label: 'Most practiced interview type', value: summary.mostPracticedType },
      { label: 'Overall grade', value: summary.overallGrade },
      {
        label: 'Improvement trend',
        value: `${summary.firstSessionScore}% -> ${summary.lastSessionScore}% (${summary.improvementTrendPercent >= 0 ? '+' : ''}${summary.improvementTrendPercent}%)`
      }
    ],
    74
  );

  drawSectionTitle(doc, 'Performance Breakdown', cursorY + 10);
  cursorY = drawPerformanceBars(doc, performance, cursorY + 30);

  autoTable(doc, {
    startY: cursorY + 18,
    margin: { left: 40, right: 40, top: 48, bottom: 34 },
    theme: 'striped',
    head: [['Date', 'Type', 'Level', 'Qs', 'Expr.', 'Speech', 'Content', 'Final', 'G']],
    body: sessions.map((session) => [
      formatShortDate(session.createdAt),
      session.type,
      session.difficulty,
      String(session.totalQuestions),
      `${session.expressionScore}%`,
      `${session.speechScore}%`,
      `${session.contentScore}%`,
      `${session.finalScore}%`,
      session.grade
    ]),
    styles: {
      fontSize: 8,
      cellPadding: 6,
      textColor: COLORS.ink,
      valign: 'middle'
    },
    headStyles: {
      fillColor: COLORS.purple,
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { cellWidth: 54 },
      1: { cellWidth: 56 },
      2: { cellWidth: 56 },
      3: { cellWidth: 40, halign: 'center' },
      4: { cellWidth: 48, halign: 'center' },
      5: { cellWidth: 40, halign: 'center' },
      6: { cellWidth: 44, halign: 'center' },
      7: { cellWidth: 56, halign: 'center' },
      8: { cellWidth: 30, halign: 'center' }
    },
    alternateRowStyles: {
      fillColor: [252, 252, 255]
    },
    didParseCell: ({ cell, column, row, section }) => {
      if (section === 'body' && column.index === 8) {
        cell.styles.textColor = gradeColor(row.raw[8]);
        cell.styles.fontStyle = 'bold';
      }
    },
    didDrawPage: () => drawHeaderFooter(doc, { userName, periodLabel: rangeMeta.label })
  });

  const insightsStart = doc.lastAutoTable.finalY + 22;
  drawSectionTitle(doc, 'Top Insights', insightsStart);

  autoTable(doc, {
    startY: insightsStart + 14,
    margin: { left: 40, right: 40, top: 48, bottom: 34 },
    theme: 'plain',
    body: [
      ['5 most repeated tips', insights.topTips.length ? insights.topTips.map((tip) => `${tip.tip} (${tip.count})`).join('\n') : 'No repeated tips yet'],
      ['Strongest category', insights.strongestCategory ? `${insights.strongestCategory.category} (${insights.strongestCategory.score}%)` : 'N/A'],
      ['Weakest category', insights.weakestCategory ? `${insights.weakestCategory.category} (${insights.weakestCategory.score}%)` : 'N/A'],
      ['Best performing session', insights.bestSession ? `${formatShortDate(insights.bestSession.date)} - ${insights.bestSession.type} - ${insights.bestSession.score}%` : 'N/A'],
      ['Most improved area', insights.mostImprovedArea ? `${insights.mostImprovedArea.area} (${insights.mostImprovedArea.delta >= 0 ? '+' : ''}${insights.mostImprovedArea.delta} pts)` : 'N/A']
    ],
    styles: {
      fontSize: 9,
      cellPadding: 7,
      textColor: COLORS.ink,
      overflow: 'linebreak'
    },
    columnStyles: {
      0: { fontStyle: 'bold', cellWidth: 155 },
      1: { cellWidth: 320 }
    },
    didDrawPage: () => drawHeaderFooter(doc, { userName, periodLabel: rangeMeta.label })
  });

  autoTable(doc, {
    startY: doc.lastAutoTable.finalY + 24,
    margin: { left: 40, right: 40, top: 48, bottom: 34 },
    theme: 'striped',
    head: [['Question', 'Cat.', 'Tries', 'Avg.', 'First', 'Latest', 'Delta']],
    body: questionPerformance.map((item) => [
      item.question,
      item.category,
      String(item.attempts),
      `${item.averageScore}%`,
      `${item.firstScore}%`,
      `${item.latestScore}%`,
      item.attempts > 1 ? `${item.improvement >= 0 ? '+' : ''}${item.improvement} pts` : 'Single attempt'
    ]),
    styles: {
      fontSize: 8,
      cellPadding: 6,
      textColor: COLORS.ink,
      overflow: 'linebreak'
    },
    headStyles: {
      fillColor: COLORS.teal,
      textColor: [15, 23, 42],
      fontStyle: 'bold'
    },
    columnStyles: {
      0: { cellWidth: 160 },
      1: { cellWidth: 55 },
      2: { halign: 'center', cellWidth: 40 },
      3: { halign: 'center', cellWidth: 45 },
      4: { halign: 'center', cellWidth: 38 },
      5: { halign: 'center', cellWidth: 38 },
      6: { halign: 'center', cellWidth: 60 }
    },
    alternateRowStyles: {
      fillColor: [252, 252, 255]
    },
    didParseCell: ({ cell, column, row, section }) => {
      if (section === 'body' && column.index === 6) {
        const improvementText = row.raw[6];
        if (String(improvementText).startsWith('+')) cell.styles.textColor = COLORS.emerald;
        if (String(improvementText).startsWith('-')) cell.styles.textColor = COLORS.rose;
      }
    },
    didDrawPage: () => drawHeaderFooter(doc, { userName, periodLabel: rangeMeta.label })
  });

  const fileName = buildReportFileName(userName, rangeMeta);
  doc.save(fileName);
  return fileName;
};
