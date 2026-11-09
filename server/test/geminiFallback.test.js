import assert from 'node:assert/strict';
import test from 'node:test';
import { evaluateAnswer, generateInterviewQuestions } from '../utils/gemini.js';

test('Gemini evaluation returns local feedback without exposing provider details when no key is configured', async () => {
  const previousApiKey = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;

  try {
    const feedback = await evaluateAnswer({ question: 'What is a REST API?', transcript: 'A REST API exposes resources over HTTP.' });
    assert.equal(feedback.evaluationSource, 'fallback');
    assert.equal('error' in feedback, false);
    assert.equal(feedback.tips.length, 3);
  } finally {
    if (previousApiKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = previousApiKey;
  }
});

test('question generation returns bundled questions when no Gemini key is configured', async () => {
  const previousApiKey = process.env.GEMINI_API_KEY;
  delete process.env.GEMINI_API_KEY;

  try {
    const result = await generateInterviewQuestions({ type: 'HR', difficulty: 'Easy', totalQuestions: 3 });
    assert.equal(result.source, 'fallback');
    assert.equal(result.questions.length, 3);
    assert.ok(result.questions.every((question) => question.text && question.difficulty === 'Easy'));
  } finally {
    if (previousApiKey === undefined) delete process.env.GEMINI_API_KEY;
    else process.env.GEMINI_API_KEY = previousApiKey;
  }
});
