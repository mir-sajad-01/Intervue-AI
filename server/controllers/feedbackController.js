import { evaluateAnswer } from '../utils/gemini.js';

export const evaluateFeedback = async (req, res, next) => {
  try {
    const { transcript, question } = req.body;
    const feedback = await evaluateAnswer({ transcript, question });
    res.json(feedback);
  } catch (error) {
    next(error);
  }
};
