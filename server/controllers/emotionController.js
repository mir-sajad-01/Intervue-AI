import { analyzeEmotion } from '../utils/huggingface.js';
import Session from '../models/Session.js';
import SessionSnapshot from '../models/SessionSnapshot.js';
import { sendApiError } from '../middleware/errorMiddleware.js';

export const analyzeEmotionFrame = async (req, res, next) => {
  try {
    const { imageBase64, sessionId } = req.body;
    if (!imageBase64) {
      return sendApiError(res, { statusCode: 422, code: 'IMAGE_REQUIRED', message: 'Allow camera access or continue without expression analysis.', requestId: req.requestId });
    }

    let session = null;
    if (sessionId) {
      session = await Session.findOne({ _id: sessionId, userId: req.user._id });
      if (!session) return sendApiError(res, { statusCode: 404, code: 'SESSION_NOT_FOUND', message: 'We could not find this interview session.', requestId: req.requestId });
      if (session.status === 'completed') return sendApiError(res, { statusCode: 409, code: 'SESSION_ALREADY_COMPLETED', message: 'This interview session has ended.', requestId: req.requestId });
    }

    const result = await analyzeEmotion(imageBase64);

    if (sessionId) {
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
    console.error(`[${req.requestId || 'no-request-id'}] Emotion analysis failed: ${error.message}`);
    sendApiError(res, {
      statusCode: 502,
      code: 'EMOTION_MODEL_UNAVAILABLE',
      message: 'Expression analysis is temporarily unavailable. Your interview can continue without it.',
      requestId: req.requestId,
      debug: process.env.NODE_ENV === 'production' ? undefined : { message: error.message }
    });
  }
};
