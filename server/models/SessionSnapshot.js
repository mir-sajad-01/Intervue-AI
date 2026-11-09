import mongoose from 'mongoose';

const emotionScoreSchema = new mongoose.Schema(
  {
    label: { type: String, trim: true, maxlength: 50 },
    confidence: { type: Number, min: 0, max: 1, required: true }
  },
  { _id: false }
);

const sessionSnapshotSchema = new mongoose.Schema({
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
  emotion: { type: String, required: true, maxlength: 50 },
  confidence: { type: Number, required: true, min: 0, max: 1 },
  allEmotions: [emotionScoreSchema],
  timestamp: { type: Date, default: Date.now }
});

sessionSnapshotSchema.index({ sessionId: 1, timestamp: -1 });

const SessionSnapshot = mongoose.model('SessionSnapshot', sessionSnapshotSchema);
export default SessionSnapshot;
