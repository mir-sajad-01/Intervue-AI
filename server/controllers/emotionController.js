import { analyzeEmotion } from '../utils/huggingface.js';
import Session from '../models/Session.js';
import SessionSnapshot from '../models/SessionSnapshot.js';

export const analyzeEmotionFrame = async (req, res, next) => {
  try {
    const { imageBase64, sessionId } = req.body;
    if (!imageBase64) {
      return res.status(400).json({ message: 'imageBase64 is required' });
    }

    const result = await analyzeEmotion(imageBase64);

    if (sessionId) {
      const session = await Session.findOne({ _id: sessionId, userId: req.user._id });
      if (!session) {
        return res.status(404).json({ message: 'Session not found' });
      }

      const snapshot = await SessionSnapshot.create({
        sessionId,
        emotion: result.emotion,
        confidence: result.confidence,
        allEmotions: result.allEmotions
      });

      session.emotionTimeline.push({
        emotion: result.emotion,
        confidence: result.confidence,
        timestamp: snapshot.timestamp
      });
      await session.save();
    }

    res.json(result);
  } catch (error) {
    console.error(`Emotion analysis failed: ${error.message}`);
    res.status(502).json({
      message: 'Emotion model request failed',
      detail: process.env.NODE_ENV === 'production' ? undefined : error.message
    });
  }
};
