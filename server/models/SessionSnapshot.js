import mongoose from 'mongoose';

const sessionSnapshotSchema = new mongoose.Schema({
  sessionId: { type: mongoose.Schema.Types.ObjectId, ref: 'Session', required: true },
  emotion: { type: String, required: true },
  confidence: { type: Number, required: true, min: 0, max: 1 },
  allEmotions: [
    {
      label: String,
      confidence: { type: Number, min: 0, max: 1 }
    }
  ],
  timestamp: { type: Date, default: Date.now }
});

const SessionSnapshot = mongoose.model('SessionSnapshot', sessionSnapshotSchema);
export default SessionSnapshot;
