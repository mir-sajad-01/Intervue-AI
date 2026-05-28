import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema(
  {
    text: { type: String, required: true, trim: true },
    category: { type: String, enum: ['HR', 'Technical', 'Behavioural', 'Mixed', 'Custom'], required: true },
    difficulty: { type: String, enum: ['Easy', 'Medium', 'Hard'], required: true },
    tags: [{ type: String, trim: true }]
  },
  { timestamps: true }
);

questionSchema.index({ text: 1, category: 1 }, { unique: true });

const Question = mongoose.model('Question', questionSchema);
export default Question;
