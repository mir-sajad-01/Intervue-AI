import assert from 'node:assert/strict';
import test from 'node:test';
import { parseClientOrigins, validateEnvironment } from '../config/env.js';

const validProductionEnv = {
  NODE_ENV: 'production',
  PORT: '10000',
  MONGODB_URI: 'mongodb+srv://example.invalid/app',
  JWT_SECRET: 'a'.repeat(64),
  JWT_REFRESH_SECRET: 'b'.repeat(64),
  CLIENT_URL: 'https://app.example.com'
};

test('production configuration accepts HTTPS origins and distinct strong secrets', () => {
  assert.deepEqual(validateEnvironment(validProductionEnv), []);
});

test('production configuration rejects weak secrets and non-HTTPS origins', () => {
  const errors = validateEnvironment({
    ...validProductionEnv,
    JWT_SECRET: 'short',
    JWT_REFRESH_SECRET: 'short',
    CLIENT_URL: 'http://localhost:5173'
  });

  assert.equal(errors.some((error) => error.includes('32 characters')), true);
  assert.equal(errors.some((error) => error.includes('HTTPS origin')), true);
});

test('production configuration rejects the same access and refresh secret', () => {
  const errors = validateEnvironment({
    ...validProductionEnv,
    JWT_REFRESH_SECRET: validProductionEnv.JWT_SECRET
  });

  assert.equal(errors.some((error) => error.includes('must be different')), true);
});

test('port and origin parsing are bounded and normalized', () => {
  assert.equal(validateEnvironment({ ...validProductionEnv, PORT: '70000' }).some((error) => error.includes('PORT')), true);
  assert.deepEqual(parseClientOrigins('https://app.example.com/, https://admin.example.com'), [
    'https://app.example.com',
    'https://admin.example.com'
  ]);
});
