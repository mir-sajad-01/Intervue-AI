import assert from 'node:assert/strict';
import test from 'node:test';
import { registerRules } from '../validators/authValidators.js';
import { validate } from '../middleware/errorMiddleware.js';

const createResponse = () => ({
  statusCode: null,
  body: null,
  status(code) {
    this.statusCode = code;
    return this;
  },
  json(body) {
    this.body = body;
    return this;
  }
});

test('register validation returns field errors in the API envelope', async () => {
  const req = { body: { name: 'A', email: 'bad-email', password: 'weak' }, requestId: 'test-request' };
  const res = createResponse();
  let nextCalled = false;

  await Promise.all(registerRules.map((rule) => rule.run(req)));
  validate(req, res, () => { nextCalled = true; });

  assert.equal(res.statusCode, 422);
  assert.equal(res.body.error.code, 'VALIDATION_ERROR');
  assert.equal(res.body.requestId, 'test-request');
  assert.equal(typeof res.body.fieldErrors.email, 'string');
  assert.equal(typeof res.body.fieldErrors.password, 'string');
  assert.equal(nextCalled, false);
});
