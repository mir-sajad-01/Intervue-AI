import assert from 'node:assert/strict';
import test from 'node:test';
import mongoose from 'mongoose';
import Question from '../models/Question.js';
import Session from '../models/Session.js';
import SessionSnapshot from '../models/SessionSnapshot.js';
import User from '../models/User.js';

test('user schema accepts normalized valid account data and rejects weak passwords', () => {
  const validUser = new User({ name: 'Mir Sajad', email: 'MIR@example.com', password: 'strongpass8' });
  assert.equal(validUser.validateSync(), undefined);
  assert.equal(validUser.email, 'mir@example.com');

  const invalidUser = new User({ name: 'M', email: 'invalid', password: 'password' });
  const error = invalidUser.validateSync();
  assert.ok(error?.errors.name);
  assert.ok(error?.errors.email);
  assert.ok(error?.errors.password);
});

test('question schema rejects an unsupported difficulty', () => {
  const question = new Question({
    text: 'Describe how you approach a difficult problem.',
    category: 'Technical',
    difficulty: 'Extreme'
  });

  assert.ok(question.validateSync()?.errors.difficulty);
});

test('session schema limits answer and question arrays to the requested count', () => {
  const questionId = new mongoose.Types.ObjectId();
  const session = new Session({
    userId: new mongoose.Types.ObjectId(),
    type: 'HR',
    difficulty: 'Easy',
    totalQuestions: 1,
    questionIds: [questionId, new mongoose.Types.ObjectId()]
  });

  assert.ok(session.validateSync()?.errors.questionIds);
});

test('snapshot schema rejects confidence values outside the supported range', () => {
  const snapshot = new SessionSnapshot({
    sessionId: new mongoose.Types.ObjectId(),
    emotion: 'happy',
    confidence: 1.5
  });

  assert.ok(snapshot.validateSync()?.errors.confidence);
});
