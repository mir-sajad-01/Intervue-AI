import mongoose from 'mongoose';

const answerSchema = new mongoose.Schema(
  {
    questionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Question', required: true },
    transcript: { type: String, default: '', maxlength: 12000 },
    evaluationSource: {
      type: String,
      enum: ['gemini', 'fallback'],
      default: 'fallback'
    },
    relevanceScore: { type: Number, min: 0, max: 10, default: 0 },
    fluencyScore: { type: Number, min: 0, max: 10, default: 0 },
    clarityScore: { type: Number, min: 0, max: 10, default: 0 },
    tips: [{ type: String, maxlength: 300 }],
    sampleAnswer: { type: String, default: '', maxlength: 5000 }
  },
  { _id: true }
);

const emotionTimelineSchema = new mongoose.Schema(
  {
    emotion: { type: String, required: true, maxlength: 50 },
    confidence: { type: Number, min: 0, max: 1, required: true },
    timestamp: { type: Date, default: Date.now }
  },
  { _id: false }
);

const questionSnapshotSchema = new mongoose.Schema(
  {
    questionId: { type: mongoose.Schema.Types.ObjectId, required: true },
    text: { type: String, required: true, maxlength: 1000 },
    category: { type: String, enum: ['HR', 'Technical', 'Behavioural', 'Mixed', 'Custom'], required: true },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
    tags: [{ type: String, trim: true, maxlength: 60 }]
  },
  { _id: false }
);

const sessionSchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  type: { type: String, enum: ['HR', 'Technical', 'Behavioural', 'Mixed', 'Custom'], required: true },
  topic: { type: String, default: '', trim: true, maxlength: 120 },
  difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
  totalQuestions: { type: Number, min: 1, max: 30, required: true },
  questionIds: { type: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Question' }], validate: { validator(items) { return items.length <= this.totalQuestions && items.length <= 30; }, message: 'A session cannot include more questions than requested.' } },
  questions: { type: [questionSnapshotSchema], validate: { validator(items) { return items.length <= this.totalQuestions && items.length <= 30; }, message: 'A session cannot include more question snapshots than requested.' } },
  expressionScore: { type: Number, default: 0 },
  speechScore: { type: Number, default: 0 },
  contentScore: { type: Number, default: 0 },
  finalScore: { type: Number, default: 0 },
  grade: { type: String, enum: ['A', 'B', 'C', 'D', 'F'], default: 'F' },
  emotionTimeline: [emotionTimelineSchema],
  answers: { type: [answerSchema], validate: { validator(items) { return items.length <= this.totalQuestions && items.length <= 30; }, message: 'A session cannot include more answers than requested questions.' } },
  duration: { type: Number, min: 0, max: 86400, default: 0 },
  status: { type: String, enum: ['in-progress', 'completed'], default: 'in-progress' },
  createdAt: { type: Date, default: Date.now }
}, { strict: 'throw' });

sessionSchema.index({ userId: 1, status: 1, createdAt: -1 });
sessionSchema.index({ userId: 1, status: 1, finalScore: -1 });

const Session = mongoose.model('Session', sessionSchema);
export default Session;
