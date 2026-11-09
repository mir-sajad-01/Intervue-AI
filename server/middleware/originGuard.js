import { sendApiError } from './errorMiddleware.js';
import { parseClientOrigins } from '../config/env.js';

const localDevelopmentOrigin = /^http:\/\/(localhost|127\.0\.0\.1):517\d$/;

export const isAllowedOrigin = (origin) => {
  if (!origin) return true;

  let normalizedOrigin;
  try {
    normalizedOrigin = new URL(origin).origin;
  } catch {
    return false;
  }

  if (parseClientOrigins().includes(normalizedOrigin)) return true;
  return process.env.NODE_ENV !== 'production' && localDevelopmentOrigin.test(normalizedOrigin);
};

export const requireTrustedBrowserOrigin = (req, res, next) => {
  const origin = req.get('origin');
  const fetchSite = req.get('sec-fetch-site');

  // A configured frontend may be hosted on a different site from the API
  // (for example, separate Vercel and Render domains). Trust the explicit
  // Origin allowlist in that case; reject cross-site requests only when the
  // browser did not provide an allowlisted Origin.
  if ((origin && !isAllowedOrigin(origin)) || (!origin && fetchSite === 'cross-site')) {
    return sendApiError(res, {
      statusCode: 403,
      code: 'UNTRUSTED_ORIGIN',
      message: 'This request came from an untrusted website. Reload the app and try again.',
      requestId: req.requestId
    });
  }

  return next();
};
