import { generateInterviewQuestions } from '../utils/gemini.js';

export const getQuestions = async (req, res, next) => {
  try {
    const { type = 'Mixed', difficulty = 'Medium', limit = 10, topic } = req.query;
    const result = await generateInterviewQuestions({
      type,
      difficulty,
      totalQuestions: Number(limit),
      topic
    });

    res.json(result);
  } catch (error) {
    next(error);
  }
};
