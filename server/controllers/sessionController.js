import Question from '../models/Question.js';
import Session from '../models/Session.js';
import SessionSnapshot from '../models/SessionSnapshot.js';
import { evaluateAnswer, generateInterviewQuestions } from '../utils/gemini.js';
import { average, buildDateRangeQuery, gradeFor } from '../utils/reporting.js';

const computeScores = (session) => {
  const positive = ['happy', 'neutral'];
  const expressionScore = average(
    session.emotionTimeline.map((snap) => (positive.includes(snap.emotion) ? snap.confidence * 100 : 0))
  );
  const speechScore = average(session.answers.map((answer) => answer.fluencyScore * 10));
  const contentScore = average(
    session.answers.map((answer) => ((answer.relevanceScore + answer.clarityScore) / 2) * 10)
  );
  const finalScore = expressionScore * 0.3 + speechScore * 0.35 + contentScore * 0.35;

  return {
    expressionScore: Math.round(expressionScore),
    speechScore: Math.round(speechScore),
    contentScore: Math.round(contentScore),
    finalScore: Math.round(finalScore),
    grade: gradeFor(finalScore)
  };
};

const decorateSession = (session) => {
  const data = session.toObject ? session.toObject() : session;
  const scoredAnswers = [...(data.answers || [])].sort((a, b) => {
    const scoreA = a.relevanceScore + a.fluencyScore + a.clarityScore;
    const scoreB = b.relevanceScore + b.fluencyScore + b.clarityScore;
    return scoreB - scoreA;
  });
  return {
    ...data,
    strongestAnswer: scoredAnswers[0] || null,
    weakestAnswer: scoredAnswers[scoredAnswers.length - 1] || null
  };
};

export const startSession = async (req, res, next) => {
  try {
    const { type, difficulty, totalQuestions, topic } = req.body;
    const requestedCount = Number(totalQuestions);
    let questions = [];

    if (type === 'Custom') {
      const generated = await generateInterviewQuestions({ topic, difficulty, totalQuestions: requestedCount });
      questions = await Question.insertMany(generated, { ordered: false }).catch(async () => {
        const texts = generated.map((item) => item.text);
        return Question.find({ text: { $in: texts } });
      });
    } else {
      const query = type === 'Mixed' ? { category: { $in: ['HR', 'Technical', 'Behavioural', 'Mixed'] } } : { category: type };
      query.difficulty = difficulty;

      questions = await Question.aggregate([{ $match: query }, { $sample: { size: requestedCount } }]);
      if (questions.length < requestedCount) {
        questions = await Question.aggregate([
          { $match: type === 'Mixed' ? { category: { $in: ['HR', 'Technical', 'Behavioural', 'Mixed'] } } : { category: type } },
          { $sample: { size: requestedCount } }
        ]);
      }

      if (questions.length < requestedCount) {
        const missing = requestedCount - questions.length;
        const generated = await generateInterviewQuestions({
          topic: `${type} interview preparation`,
          difficulty,
          totalQuestions: missing
        });
        const generatedQuestions = await Question.insertMany(generated, { ordered: false }).catch(async () => {
          const texts = generated.map((item) => item.text);
          return Question.find({ text: { $in: texts } });
        });
        questions = [...questions, ...generatedQuestions].slice(0, requestedCount);
      }
    }

    if (questions.length < requestedCount) {
      return res.status(400).json({ message: 'Not enough questions available for this setup' });
    }

    const session = await Session.create({
      userId: req.user._id,
      type,
      topic: type === 'Custom' ? topic : '',
      difficulty,
      totalQuestions: requestedCount
    });

    console.log(`Started session ${session._id} for user ${req.user._id}`);
    res.status(201).json({ session, questions });
  } catch (error) {
    next(error);
  }
};

export const submitAnswer = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { questionId, transcript } = req.body;
    const session = await Session.findOne({ _id: id, userId: req.user._id });
    if (!session) return res.status(404).json({ message: 'Session not found' });
    if (session.status === 'completed') return res.status(400).json({ message: 'Session already completed' });

    const question = await Question.findById(questionId);
    if (!question) return res.status(404).json({ message: 'Question not found' });

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
    if (!session) return res.status(404).json({ message: 'Session not found' });

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
    if (!session) return res.status(404).json({ message: 'Session not found' });

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

    res.json({ sessions, page: Number(page), totalPages: Math.ceil(total / Number(limit)), total });
  } catch (error) {
    next(error);
  }
};

export const getSessionById = async (req, res, next) => {
  try {
    const session = await Session.findOne({ _id: req.params.id, userId: req.user._id }).populate('answers.questionId');
    if (!session) return res.status(404).json({ message: 'Session not found' });
    res.json({ session: decorateSession(session) });
  } catch (error) {
    next(error);
  }
};

export const getDashboardStats = async (req, res, next) => {
  try {
    const sessions = await Session.find({ userId: req.user._id, status: 'completed' }).sort({ createdAt: -1 });
    const totalSessions = sessions.length;
    const averageScore = Math.round(average(sessions.map((session) => session.finalScore)));
    const bestScore = Math.round(Math.max(0, ...sessions.map((session) => session.finalScore)));

    const practicedDays = new Set(sessions.map((session) => session.createdAt.toISOString().slice(0, 10)));
    let streak = 0;
    const cursor = new Date();
    while (practicedDays.has(cursor.toISOString().slice(0, 10))) {
      streak += 1;
      cursor.setDate(cursor.getDate() - 1);
    }

    const emotionDistribution = sessions
      .flatMap((session) => session.emotionTimeline)
      .reduce((acc, item) => {
        acc[item.emotion] = (acc[item.emotion] || 0) + 1;
        return acc;
      }, {});

    res.json({
      totalSessions,
      averageScore,
      bestScore,
      streak,
      scoreTrend: sessions
        .slice(0, 10)
        .reverse()
        .map((session) => ({ date: session.createdAt, score: session.finalScore, id: session._id })),
      emotionDistribution: Object.entries(emotionDistribution).map(([emotion, value]) => ({ emotion, value })),
      recentSessions: sessions.slice(0, 5)
    });
  } catch (error) {
    next(error);
  }
};
