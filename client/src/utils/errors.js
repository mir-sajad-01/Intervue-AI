export const getErrorMessage = (error, fallback = 'Something went wrong. Please try again.') => {
  const response = error?.response?.data;
  const firstFieldError = response?.errors?.[0]?.msg;
  const message = response?.error?.message || response?.message || firstFieldError;
  const status = error?.response?.status;
  const requestId = response?.requestId || response?.error?.requestId;

  if (message) {
    return status >= 500 && requestId ? `${message} Reference: ${requestId}` : message;
  }
  if (error?.code === 'ECONNABORTED' || error?.code === 'ETIMEDOUT') {
    return 'This request is taking longer than expected. Please try again.';
  }
  if (!error?.response && error?.request) return 'We could not reach the server. Check your connection and try again.';

  const messagesByStatus = {
    400: 'Some of the submitted details need attention.',
    401: 'Your session has expired. Please sign in again.',
    403: 'You do not have permission to do that.',
    404: 'We could not find what you requested.',
    409: 'These details are already in use.',
    413: 'The submitted content is too large.',
    422: 'Please review the highlighted details and try again.',
    429: 'Too many requests. Please wait a moment and try again.',
    500: 'Something went wrong on our side. Please try again.',
    502: 'A connected service is temporarily unavailable. Please try again.',
    503: 'The service is temporarily unavailable. Please try again shortly.',
    504: 'The service took too long to respond. Please try again.'
  };

  return messagesByStatus[status] || fallback;
};

export const getFieldErrors = (error) => {
  const response = error?.response?.data;
  const fieldErrors = response?.fieldErrors || response?.error?.fields;
  if (fieldErrors && typeof fieldErrors === 'object') return fieldErrors;

  const errors = response?.errors || response?.error?.details || [];
  return errors.reduce((fields, item) => {
    const field = item.path || item.param;
    if (field && !fields[field]) fields[field] = item.msg;
    return fields;
  }, {});
};
