import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema(
  {
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
    transcript: { type: String, default: '' },
    relevanceScore: { type: Number, min: 0, max: 10, default: 0 },
    fluencyScore: { type: Number, min: 0, max: 10, default: 0 },
    clarityScore: { type: Number, min: 0, max: 10, default: 0 },
    tips: [{ type: String }],
    sampleAnswer: { type: String, default: '' }
  },
  { _id: true }
);

const emotionTimelineSchema = new mongoose.Schema(
  {
    emotion: { type: String, required: true },
    confidence: { type: Number, min: 0, max: 1, required: true },
    timestamp: { type: Date, default: Date.now }
  },
  { _id: false }
);

const sessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['HR', 'Technical', 'Behavioural', 'Mixed', 'Custom'], required: true },
  topic: { type: String, default: '' },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
  totalQuestions: { type: Number, min: 1, max: 30, required: true },
  expressionScore: { type: Number, default: 0 },
  speechScore: { type: Number, default: 0 },
  contentScore: { type: Number, default: 0 },
  finalScore: { type: Number, default: 0 },
  grade: { type: String, enum: ['A', 'B', 'C', 'D', 'F'], default: 'F' },
  emotionTimeline: [emotionTimelineSchema],
  answers: [answerSchema],
  duration: { type: Number, default: 0 },
  status: { type: String, enum: ['in-progress', 'completed'], default: 'in-progress' },
  createdAt: { type: Date, default: Date.now }
});

const Session = mongoose.model('Session', sessionSchema);
export default Session;
