import mongoose from 'mongoose';

const questionSchema = new mongoose.Schema(
  {
    text: { type: String, required: [true, 'Question text is required.'], trim: true, minlength: [8, 'Question text must be at least 8 characters.'], maxlength: [1000, 'Question text cannot exceed 1,000 characters.'] },
    category: { type: String, enum: { values: ['HR', 'Technical', 'Behavioural', 'Mixed', 'Custom'], message: 'Choose a valid question category.' }, required: [true, 'Question category is required.'] },
    difficulty: { type: String, enum: { values: ['Easy', 'Medium', 'Hard'], message: 'Choose a valid difficulty level.' }, required: [true, 'Question difficulty is required.'] },
    tags: [{ type: String, trim: true, maxlength: 60 }]
  },
  { timestamps: true, strict: 'throw' }
);

questionSchema.index({ text: 1, category: 1 }, { unique: true });
questionSchema.index({ category: 1, difficulty: 1 });

const Question = mongoose.model('Question', questionSchema);
export default Question;
