const POSITIVE_EMOTIONS = ['happy', 'neutral'];
const EMOTION_LABELS = ['angry', 'disgust', 'fear', 'happy', 'neutral', 'sad', 'surprise'];
const FILLER_PATTERNS = [
  /\bumm+\b/gi,
  /\buh+\b/gi,
  /\blike\b/gi,
  /\byou know\b/gi,
  /\bbasically\b/gi,
  /\bactually\b/gi
];

export const average = (items = []) =>
  items.length ? items.reduce((sum, item) => sum + item, 0) / items.length : 0;

export const gradeFor = (score) => {
  if (score >= 90) return 'A';
  if (score >= 75) return 'B';
  if (score >= 60) return 'C';
  if (score >= 45) return 'D';
  return 'F';
};

export const countFillerWords = (transcript = '') =>
  FILLER_PATTERNS.reduce((total, pattern) => total + ((String(transcript).match(pattern) || []).length), 0);

export const normalizeEmotionLabel = (emotion) => {
  const normalized = String(emotion || '')
    .toLowerCase()
    .replace(/[^a-z\s]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  return EMOTION_LABELS.find((label) => normalized.includes(label)) || normalized;
};

const createDateBoundary = (input, endOfDay = false) => {
  if (!input) return null;

  const value = new Date(input);
  if (Number.isNaN(value.getTime())) return null;

  const looksLikeDateOnly = typeof input === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(input);
  if (looksLikeDateOnly) {
    if (endOfDay) {
      value.setHours(23, 59, 59, 999);
    } else {
      value.setHours(0, 0, 0, 0);
    }
  }

  return value;
};

export const buildDateRangeQuery = ({ from, to, startDate, endDate } = {}) => {
  const fromDate = createDateBoundary(from || startDate, false);
  const toDate = createDateBoundary(to || endDate, true);
  const createdAt = {};

  if (fromDate) createdAt.$gte = fromDate;
  if (toDate) createdAt.$lte = toDate;

  return {
    fromDate,
    toDate,
    createdAt: Object.keys(createdAt).length ? createdAt : null
  };
};

const normalizeAnswerScore = (answer = {}) =>
  Math.round((((answer.relevanceScore || 0) + (answer.fluencyScore || 0) + (answer.clarityScore || 0)) / 3) * 10);

const readQuestionText = (answer = {}) => {
  if (typeof answer.questionId === 'object' && answer.questionId?.text) return answer.questionId.text;
  return answer.questionText || 'Question unavailable';
};

const readQuestionCategory = (answer = {}) => {
  if (typeof answer.questionId === 'object' && answer.questionId?.category) return answer.questionId.category;
  return 'Mixed';
};

const summarizeMostFrequent = (items = [], fallback = 'N/A') => {
  const counts = items.reduce((acc, item) => {
    if (!item) return acc;
    acc[item] = (acc[item] || 0) + 1;
    return acc;
  }, {});

  const [winner] = Object.entries(counts).sort((a, b) => b[1] - a[1]);
  return winner ? winner[0] : fallback;
};

export const buildReportSummary = (sessions = []) => {
  const orderedSessions = [...sessions].sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
  const totalSessions = orderedSessions.length;
  const averageOverallScore = Math.round(average(orderedSessions.map((session) => session.finalScore || 0)));
  const bestScore = totalSessions ? Math.max(...orderedSessions.map((session) => session.finalScore || 0)) : 0;
  const worstScore = totalSessions ? Math.min(...orderedSessions.map((session) => session.finalScore || 0)) : 0;
  const totalPracticeTimeSeconds = orderedSessions.reduce((sum, session) => sum + (session.duration || 0), 0);

  const typeCounts = orderedSessions.reduce((acc, session) => {
    acc[session.type] = (acc[session.type] || 0) + 1;
    return acc;
  }, {});

  const mostPracticedType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A';
  const firstSession = orderedSessions[0] || null;
  const lastSession = orderedSessions[orderedSessions.length - 1] || null;
  const scoreDelta = (lastSession?.finalScore || 0) - (firstSession?.finalScore || 0);
  const improvementTrendPercent = firstSession?.finalScore
    ? Math.round((scoreDelta / firstSession.finalScore) * 100)
    : totalSessions > 1
      ? Math.round(scoreDelta)
      : 0;

  const emotionList = orderedSessions.flatMap((session) =>
    (session.emotionTimeline || []).map((item) => normalizeEmotionLabel(item.emotion))
  );

  const fillerWordsPerSession = orderedSessions.map((session) =>
    (session.answers || []).reduce((sum, answer) => sum + countFillerWords(answer.transcript), 0)
  );

  const tipCounts = new Map();
  orderedSessions.forEach((session) => {
    (session.answers || []).forEach((answer) => {
      (answer.tips || []).forEach((tip) => {
        const normalized = String(tip || '').trim().toLowerCase();
        if (!normalized) return;
        const previous = tipCounts.get(normalized);
        tipCounts.set(normalized, {
          tip: previous?.tip || String(tip).trim(),
          count: (previous?.count || 0) + 1
        });
      });
    });
  });

  const categoryScores = orderedSessions.reduce((acc, session) => {
    const bucket = acc[session.type] || [];
    bucket.push(session.finalScore || 0);
    acc[session.type] = bucket;
    return acc;
  }, {});

  const categoryRanking = Object.entries(categoryScores)
    .map(([category, scores]) => ({ category, score: Math.round(average(scores)) }))
    .sort((a, b) => b.score - a.score);

  const questionPerformanceMap = new Map();
  orderedSessions.forEach((session) => {
    (session.answers || []).forEach((answer) => {
      const questionText = readQuestionText(answer);
      const category = readQuestionCategory(answer);
      const score = normalizeAnswerScore(answer);
      const existing = questionPerformanceMap.get(questionText) || {
        question: questionText,
        category,
        attempts: []
      };

      existing.attempts.push({
        date: session.createdAt,
        score
      });
      questionPerformanceMap.set(questionText, existing);
    });
  });

  const questionPerformance = [...questionPerformanceMap.values()]
    .map((entry) => {
      const attempts = entry.attempts.sort((a, b) => new Date(a.date) - new Date(b.date));
      const firstAttempt = attempts[0] || null;
      const latestAttempt = attempts[attempts.length - 1] || null;
      return {
        question: entry.question,
        category: entry.category,
        attempts: attempts.length,
        averageScore: Math.round(average(attempts.map((item) => item.score))),
        firstScore: firstAttempt?.score || 0,
        latestScore: latestAttempt?.score || 0,
        improvement: attempts.length > 1 ? (latestAttempt?.score || 0) - (firstAttempt?.score || 0) : 0
      };
    })
    .sort((a, b) => b.averageScore - a.averageScore);

  const areaDeltas = firstSession && lastSession
    ? [
        { area: 'Expression', delta: (lastSession.expressionScore || 0) - (firstSession.expressionScore || 0) },
        { area: 'Speech', delta: (lastSession.speechScore || 0) - (firstSession.speechScore || 0) },
        { area: 'Content', delta: (lastSession.contentScore || 0) - (firstSession.contentScore || 0) }
      ].sort((a, b) => b.delta - a.delta)
    : [];

  return {
    summary: {
      totalSessions,
      averageOverallScore,
      bestScore,
      worstScore,
      totalPracticeTimeSeconds,
      mostPracticedType,
      overallGrade: gradeFor(averageOverallScore),
      firstSessionScore: firstSession?.finalScore || 0,
      lastSessionScore: lastSession?.finalScore || 0,
      improvementTrendPercent,
      scoreDelta
    },
    performance: {
      averageExpressionScore: Math.round(average(orderedSessions.map((session) => session.expressionScore || 0))),
      averageSpeechScore: Math.round(average(orderedSessions.map((session) => session.speechScore || 0))),
      averageContentScore: Math.round(average(orderedSessions.map((session) => session.contentScore || 0))),
      chartData: [
        { label: 'Expression', score: Math.round(average(orderedSessions.map((session) => session.expressionScore || 0))) },
        { label: 'Speech', score: Math.round(average(orderedSessions.map((session) => session.speechScore || 0))) },
        { label: 'Content', score: Math.round(average(orderedSessions.map((session) => session.contentScore || 0))) }
      ],
      mostFrequentEmotion: summarizeMostFrequent(emotionList),
      averageFillerWordsPerSession: totalSessions ? Number(average(fillerWordsPerSession).toFixed(1)) : 0
    },
    insights: {
      topTips: [...tipCounts.values()].sort((a, b) => b.count - a.count).slice(0, 5),
      strongestCategory: categoryRanking[0] || null,
      weakestCategory: categoryRanking[categoryRanking.length - 1] || null,
      bestSession: orderedSessions
        .map((session) => ({ date: session.createdAt, score: session.finalScore || 0, type: session.type }))
        .sort((a, b) => b.score - a.score)[0] || null,
      mostImprovedArea: areaDeltas[0] || null
    },
    questionPerformance
  };
};

export { POSITIVE_EMOTIONS };
