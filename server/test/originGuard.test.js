import assert from 'node:assert/strict';
import test from 'node:test';
import { isAllowedOrigin, requireTrustedBrowserOrigin } from '../middleware/originGuard.js';

const withEnvironment = (values, callback) => {
  const previous = Object.fromEntries(Object.keys(values).map((key) => [key, process.env[key]]));
  Object.assign(process.env, values);
  try {
    callback();
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key];
      else process.env[key] = value;
    }
  }
};

const makeResponse = () => ({
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

test('configured cross-site frontend origin is trusted for browser auth requests', () => {
  withEnvironment({ NODE_ENV: 'production', CLIENT_URL: 'https://app.example.com' }, () => {
    const req = {
      requestId: 'origin-test',
      get: (header) => ({ origin: 'https://app.example.com', 'sec-fetch-site': 'cross-site' }[header])
    };
    const res = makeResponse();
    let nextCalled = false;

    requireTrustedBrowserOrigin(req, res, () => { nextCalled = true; });

    assert.equal(nextCalled, true);
    assert.equal(res.statusCode, null);
  });
});

test('untrusted origins and anonymous cross-site browser requests are rejected', () => {
  withEnvironment({ NODE_ENV: 'production', CLIENT_URL: 'https://app.example.com' }, () => {
    assert.equal(isAllowedOrigin('https://app.example.com'), true);
    assert.equal(isAllowedOrigin('https://app.example.com.attacker.test'), false);

    const req = { requestId: 'origin-test', get: (header) => ({ 'sec-fetch-site': 'cross-site' }[header]) };
    const res = makeResponse();
    let nextCalled = false;
    requireTrustedBrowserOrigin(req, res, () => { nextCalled = true; });

    assert.equal(nextCalled, false);
    assert.equal(res.statusCode, 403);
    assert.equal(res.body.error.code, 'UNTRUSTED_ORIGIN');
  });
});
