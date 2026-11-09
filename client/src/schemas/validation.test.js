import assert from 'node:assert/strict';
import test from 'node:test';
import { interviewSetupSchema, registerSchema, reportRangeSchema } from './validation.js';

test('registration schema accepts valid data and rejects mismatched passwords', () => {
  const base = { name: 'Mir Sajad', email: 'mir@example.com', password: 'strongpass8' };
  assert.equal(registerSchema.safeParse({ ...base, confirmPassword: base.password }).success, true);
  assert.equal(registerSchema.safeParse({ ...base, confirmPassword: 'different8' }).success, false);
});

test('custom interview requires a topic while standard interviews do not', () => {
  assert.equal(interviewSetupSchema.safeParse({ type: 'HR', difficulty: 'Easy', totalQuestions: 5, topic: '' }).success, true);
  assert.equal(interviewSetupSchema.safeParse({ type: 'Custom', difficulty: 'Easy', totalQuestions: 5, topic: '' }).success, false);
});

test('custom report date range rejects invalid dates and reversed ranges', () => {
  assert.equal(reportRangeSchema.safeParse({ preset: 'custom', from: '2026-02-30', to: '2026-03-01' }).success, false);
  assert.equal(reportRangeSchema.safeParse({ preset: 'custom', from: '2026-03-02', to: '2026-03-01' }).success, false);
});
