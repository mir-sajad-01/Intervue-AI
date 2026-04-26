import Session from '../models/Session.js';
import { buildDateRangeQuery, buildReportSummary } from '../utils/reporting.js';

export const getReportSummary = async (req, res, next) => {
  try {
    const { from, to, type, difficulty } = req.query;
    const { fromDate, toDate, createdAt } = buildDateRangeQuery({ from, to });
    const query = { userId: req.user._id, status: 'completed' };

    if (createdAt) query.createdAt = createdAt;
    if (type) query.type = type;
    if (difficulty) query.difficulty = difficulty;

    const sessions = await Session.find(query).sort({ createdAt: 1 }).populate('answers.questionId');
    const report = buildReportSummary(sessions);

    console.log(`Generated report summary for user ${req.user._id} across ${sessions.length} sessions`);

    res.json({
      generatedAt: new Date().toISOString(),
      period: {
        from: fromDate?.toISOString() || null,
        to: toDate?.toISOString() || null,
        totalSessions: sessions.length
      },
      ...report
    });
  } catch (error) {
    next(error);
  }
};
