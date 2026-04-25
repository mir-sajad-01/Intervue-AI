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
      const snapshot = await SessionSnapshot.create({
        sessionId,
        emotion: result.emotion,
        confidence: result.confidence,
        allEmotions: result.allEmotions
      });

      await Session.findOneAndUpdate(
        { _id: sessionId, userId: req.user._id },
        {
          $push: {
            emotionTimeline: {
              emotion: result.emotion,
              confidence: result.confidence,
              timestamp: snapshot.timestamp
            }
          }
        }
      );
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
