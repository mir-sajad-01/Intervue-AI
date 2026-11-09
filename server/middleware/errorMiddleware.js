import { validationResult } from 'express-validator';

export const sendApiError = (res, {
  statusCode = 500,
  code = 'INTERNAL_ERROR',
  message = 'Something went wrong. Please try again.',
  requestId,
  fieldErrors,
  details,
  debug
} = {}) => {
  const error = {
    code,
    message,
    ...(fieldErrors && Object.keys(fieldErrors).length ? { fields: fieldErrors } : {}),
    ...(requestId ? { requestId } : {})
  };

  return res.status(statusCode).json({
    success: false,
    error,
    code,
    message,
    ...(requestId ? { requestId } : {}),
    ...(fieldErrors && Object.keys(fieldErrors).length ? { fieldErrors } : {}),
    ...(details?.length ? { errors: details } : {}),
    ...(debug ? { debug } : {})
  });
};

export const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const details = errors.array({ onlyFirstError: true }).map(({ location, msg, path }) => ({
      location,
      msg,
      path
    }));
    const fieldErrors = details.reduce((result, error) => {
      const field = error.path || error.param;
      if (field && !result[field]) result[field] = error.msg;
      return result;
    }, {});

    return sendApiError(res, {
      statusCode: 422,
      code: 'VALIDATION_ERROR',
      message: 'Please review the highlighted fields and try again.',
      requestId: req.requestId,
      fieldErrors,
      details
    });
  }
  next();
};

export const notFound = (req, res, next) => {
  const error = new Error(`Route not found: ${req.method} ${req.originalUrl}`);
  error.statusCode = 404;
  error.code = 'ROUTE_NOT_FOUND';
  next(error);
};

export const errorHandler = (err, req, res, next) => {
  if (res.headersSent) return next(err);

  let statusCode = err.statusCode || err.status || res.statusCode;
  if (statusCode < 400) statusCode = 500;
  if (err.name === 'ValidationError' || err.name === 'CastError') statusCode = 400;
  if (err.code === 11000) statusCode = 409;

  const isProduction = process.env.NODE_ENV === 'production';
  const mongooseFields = err.name === 'ValidationError'
    ? Object.fromEntries(Object.entries(err.errors || {}).map(([field, issue]) => [field, issue.message]))
    : undefined;
  const duplicateField = err.keyPattern ? Object.keys(err.keyPattern)[0] : undefined;
  const fieldErrors = mongooseFields || (duplicateField ? { [duplicateField]: 'This value is already in use.' } : undefined);
  const code = err.code === 11000 ? 'DUPLICATE_RESOURCE'
    : err.name === 'ValidationError' ? 'VALIDATION_ERROR'
      : err.name === 'CastError' ? 'INVALID_IDENTIFIER'
        : err.type === 'entity.parse.failed' ? 'INVALID_JSON'
          : statusCode === 413 ? 'PAYLOAD_TOO_LARGE'
            : statusCode === 429 ? 'RATE_LIMITED'
              : statusCode === 401 ? 'UNAUTHENTICATED'
                : statusCode === 403 ? 'FORBIDDEN'
                  : statusCode === 404 ? (err.code || 'NOT_FOUND')
                    : statusCode >= 500 ? 'INTERNAL_ERROR'
                      : err.code || 'REQUEST_ERROR';
  const message = err.code === 11000
    ? 'A record with those details already exists.'
    : err.name === 'ValidationError'
      ? 'Please review the highlighted fields and try again.'
      : err.name === 'CastError'
        ? 'The requested record could not be found.'
        : err.type === 'entity.parse.failed'
          ? 'The request could not be read. Please check the submitted data.'
          : statusCode === 413
            ? 'The submitted content is too large.'
            : statusCode === 429
              ? 'Too many requests. Please wait a moment and try again.'
              : statusCode >= 500 && isProduction
                ? 'Something went wrong on our side. Please try again.'
                : err.message || 'Something went wrong. Please try again.';

  if (statusCode >= 500) {
    console.error(`[${req.requestId || 'no-request-id'}] ${req.method} ${req.originalUrl}`, err.stack || err);
  }

  return sendApiError(res, {
    statusCode,
    code,
    message,
    requestId: req.requestId,
    fieldErrors,
    debug: !isProduction && statusCode >= 500 ? { stack: err.stack } : undefined
  });
};
