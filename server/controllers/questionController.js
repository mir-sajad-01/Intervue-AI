import Question from '../models/Question.js';

export const getQuestions = async (req, res, next) => {
  try {
    const { type, difficulty, limit = 10 } = req.query;
    const query = {};
    if (type && type !== 'Mixed') query.category = type;
    if (type === 'Mixed') query.category = { $in: ['HR', 'Technical', 'Behavioural', 'Mixed'] };
    if (difficulty) query.difficulty = difficulty;

    const questions = await Question.aggregate([
      { $match: query },
      { $sample: { size: Number(limit) } },
      { $project: { text: 1, category: 1, difficulty: 1, tags: 1 } }
    ]);

    res.json({ questions });
  } catch (error) {
    next(error);
  }
};
