import Question from '../models/Question.js';
import Session from '../models/Session.js';
import SessionSnapshot from '../models/SessionSnapshot.js';
import { evaluateAnswer, generateInterviewQuestions } from '../utils/gemini.js';
import { average, buildDateRangeQuery, gradeFor, normalizeEmotionLabel } from '../utils/reporting.js';
import { sendApiError } from '../middleware/errorMiddleware.js';

const computeScores = (session) => {
  const positive = ['happy', 'neutral'];
  const hasExpressionData = (session.emotionTimeline || []).length > 0;
  const expressionScore = average(
    session.emotionTimeline.map((snap) => (positive.includes(normalizeEmotionLabel(snap.emotion)) ? snap.confidence * 100 : 0))
  );
  const speechScore = average(session.answers.map((answer) => answer.fluencyScore * 10));
  const contentScore = average(
    session.answers.map((answer) => ((answer.relevanceScore + answer.clarityScore) / 2) * 10)
  );
  const finalScore = hasExpressionData
    ? expressionScore * 0.3 + speechScore * 0.35 + contentScore * 0.35
    : speechScore * 0.5 + contentScore * 0.5;

  return {
    hasExpressionData,
    expressionScore: Math.round(expressionScore),
    speechScore: Math.round(speechScore),
    contentScore: Math.round(contentScore),
    finalScore: Math.round(finalScore),
    grade: gradeFor(finalScore)
  };
};

const decorateSession = (session) => {
  const data = session.toObject ? session.toObject() : session;
  const questionSnapshots = data.questions || [];
  const answers = (data.answers || []).map((answer) => {
    if (answer.questionId?.text) return answer;

    const answerQuestionId = String(answer.questionId?._id || answer.questionId || '');
    const snapshot = questionSnapshots.find((item) => String(item.questionId) === answerQuestionId);
    if (!snapshot) return answer;

    return {
      ...answer,
      questionId: {
        _id: snapshot.questionId,
        text: snapshot.text,
        category: snapshot.category,
        difficulty: snapshot.difficulty,
        tags: snapshot.tags || []
      }
    };
  });
  data.answers = answers;
  const computedScores = computeScores(data);
  const scoredAnswers = [...(data.answers || [])].sort((a, b) => {
    const scoreA = a.relevanceScore + a.fluencyScore + a.clarityScore;
    const scoreB = b.relevanceScore + b.fluencyScore + b.clarityScore;
    return scoreB - scoreA;
  });
  return {
    ...data,
    ...computedScores,
    scoringExplanation: computedScores.hasExpressionData
      ? 'Overall score uses 30% expression, 35% speech, and 35% content.'
      : 'No expression snapshots were captured, so overall score is based on speech and content only.',
    strongestAnswer: scoredAnswers[0] || null,
    weakestAnswer: scoredAnswers[scoredAnswers.length - 1] || null
  };
};

const toObjectId = (id) => (id?._id ? id._id : id);
const toQuestionSnapshot = (question) => ({
  questionId: toObjectId(question._id),
  text: question.text,
  category: question.category || 'Custom',
  difficulty: question.difficulty,
  tags: question.tags || []
});

export const startSession = async (req, res, next) => {
  try {
    const { type, difficulty, totalQuestions, topic } = req.body;
    const requestedCount = Number(totalQuestions);
    const generated = await generateInterviewQuestions({
      type,
      topic,
      difficulty,
      totalQuestions: requestedCount
    });
    const questions = await Promise.all(generated.questions.map((item) =>
      Question.findOneAndUpdate(
        { text: item.text, category: item.category },
        { $set: item },
        { new: true, upsert: true, runValidators: true, setDefaultsOnInsert: true }
      )
    ));

    if (questions.length < requestedCount) {
      return sendApiError(res, {
        statusCode: 503,
        code: 'QUESTIONS_UNAVAILABLE',
        message: 'We could not prepare enough questions. Please try again with a different setup.',
        requestId: req.requestId
      });
    }

    const session = await Session.create({
      userId: req.user._id,
      type,
      topic: type === 'Custom' ? topic : '',
      difficulty,
      totalQuestions: requestedCount,
      questionIds: questions.map((question) => toObjectId(question._id)),
      questions: questions.map(toQuestionSnapshot)
    });

    console.log(`Started session ${session._id} for user ${req.user._id}`);
    res.status(201).json({ session, questions, questionSource: generated.source });
  } catch (error) {
    next(error);
  }
};

export const submitAnswer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { questionId, transcript } = req.body;
    const session = await Session.findOne({ _id: id, userId: req.user._id });
    if (!session) return sendApiError(res, { statusCode: 404, code: 'SESSION_NOT_FOUND', message: 'We could not find this interview session.', requestId: req.requestId });
    if (session.status === 'completed') return sendApiError(res, { statusCode: 409, code: 'SESSION_ALREADY_COMPLETED', message: 'This interview session has already been completed.', requestId: req.requestId });

    const allowedQuestionIds = (session.questionIds || []).map((id) => String(id));
    const questionIndex = allowedQuestionIds.indexOf(String(questionId));
    if (allowedQuestionIds.length && questionIndex === -1) {
      return sendApiError(res, { statusCode: 400, code: 'QUESTION_NOT_IN_SESSION', message: 'That question does not belong to this interview session.', requestId: req.requestId });
    }
    if (session.answers.some((answer) => String(answer.questionId) === String(questionId))) {
      return sendApiError(res, { statusCode: 409, code: 'QUESTION_ALREADY_ANSWERED', message: 'You have already submitted an answer for this question.', requestId: req.requestId });
    }

    const snapshot = (session.questions || []).find((item) => String(item.questionId) === String(questionId));
    const question =
      (await Question.findById(questionId)) || snapshot || {
        _id: questionId,
        text: `Question ${questionIndex >= 0 ? questionIndex + 1 : session.answers.length + 1}`,
        category: session.type,
        difficulty: session.difficulty
      };

    const feedback = await evaluateAnswer({ question: question.text, transcript });
    session.answers.push({ questionId, transcript, ...feedback });
    await session.save();

    res.json({ feedback, session });
  } catch (error) {
    next(error);
  }
};

export const endSession = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { duration = 0 } = req.body;
    const session = await Session.findOne({ _id: id, userId: req.user._id });
    if (!session) return sendApiError(res, { statusCode: 404, code: 'SESSION_NOT_FOUND', message: 'We could not find this interview session.', requestId: req.requestId });

    const scores = computeScores(session);
    Object.assign(session, scores, { duration, status: 'completed' });
    await session.save();
    await session.populate('answers.questionId');
    console.log(`Completed session ${id} with score ${scores.finalScore}`);
    res.json({ session: decorateSession(session) });
  } catch (error) {
    next(error);
  }
};

export const deleteSession = async (req, res, next) => {
  try {
    const session = await Session.findOne({ _id: req.params.id, userId: req.user._id });
    if (!session) return sendApiError(res, { statusCode: 404, code: 'SESSION_NOT_FOUND', message: 'We could not find this interview session.', requestId: req.requestId });

    await SessionSnapshot.deleteMany({ sessionId: session._id });
    await Session.deleteOne({ _id: session._id });

    console.log(`Deleted session ${session._id} for user ${req.user._id}`);
    res.json({ message: 'Session deleted successfully' });
  } catch (error) {
    next(error);
  }
};

export const getSessions = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 10,
      type,
      difficulty,
      from,
      to,
      startDate,
      endDate,
      sortBy = 'date',
      order = 'desc'
    } = req.query;

    const query = { userId: req.user._id, status: 'completed' };
    if (type) query.type = type;
    if (difficulty) query.difficulty = difficulty;
    const { createdAt } = buildDateRangeQuery({ from, to, startDate, endDate });
    if (createdAt) query.createdAt = createdAt;

    const sort = { [sortBy === 'score' ? 'finalScore' : 'createdAt']: order === 'asc' ? 1 : -1 };
    const skip = (Number(page) - 1) * Number(limit);
    const [sessions, total] = await Promise.all([
      Session.find(query).sort(sort).skip(skip).limit(Number(limit)).populate('answers.questionId'),
      Session.countDocuments(query)
    ]);

    res.json({
      sessions: sessions.map((session) => decorateSession(session)),
      page: Number(page),
      totalPages: Math.ceil(total / Number(limit)),
      total
    });
  } catch (error) {
    next(error);
  }
};

export const getSessionById = async (req, res, next) => {
  try {
    const session = await Session.findOne({ _id: req.params.id, userId: req.user._id }).populate('answers.questionId');
    if (!session) return sendApiError(res, { statusCode: 404, code: 'SESSION_NOT_FOUND', message: 'We could not find this interview session.', requestId: req.requestId });
    res.json({ session: decorateSession(session) });
  } catch (error) {
    next(error);
  }
};

export const getDashboardStats = async (req, res, next) => {
  try {
    const filter = { userId: req.user._id, status: 'completed' };
    const [totalsRows, dayRows, emotionRows, recentSessions] = await Promise.all([
      Session.aggregate([
        { $match: filter },
        { $group: { _id: null, totalSessions: { $sum: 1 }, averageScore: { $avg: '$finalScore' }, bestScore: { $max: '$finalScore' } } }
      ]),
      Session.aggregate([
        { $match: filter },
        { $group: { _id: { $dateToString: { date: '$createdAt', format: '%Y-%m-%d', timezone: 'UTC' } } } },
        { $sort: { _id: -1 } }
      ]),
      Session.aggregate([
        { $match: filter },
        { $unwind: '$emotionTimeline' },
        { $group: { _id: { $toLower: '$emotionTimeline.emotion' }, value: { $sum: 1 } } }
      ]),
      Session.find(filter)
        .select('type difficulty totalQuestions finalScore grade createdAt')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean()
    ]);

    const totals = totalsRows[0] || { totalSessions: 0, averageScore: 0, bestScore: 0 };
    const totalSessions = totals.totalSessions;
    const averageScore = Math.round(totals.averageScore || 0);
    const bestScore = Math.round(totals.bestScore || 0);
    const practicedDays = new Set(dayRows.map(({ _id }) => _id));
    let streak = 0;
    const cursor = new Date();
    while (practicedDays.has(cursor.toISOString().slice(0, 10))) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }

    const emotionDistribution = emotionRows.reduce((acc, item) => {
      const emotion = normalizeEmotionLabel(item._id);
      acc[emotion] = (acc[emotion] || 0) + item.value;
      return acc;
    }, {});

    res.json({
      totalSessions,
      averageScore,
      bestScore,
      streak,
      scoreTrend: [...recentSessions]
        .reverse()
        .map((session) => ({ date: session.createdAt, score: session.finalScore, id: session._id })),
      emotionDistribution: Object.entries(emotionDistribution).map(([emotion, value]) => ({ emotion, value })),
      recentSessions: recentSessions.slice(0, 5)
    });
  } catch (error) {
    next(error);
  }
};
