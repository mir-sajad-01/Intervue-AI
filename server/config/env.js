const requiredEnvironment = ['MONGODB_URI', 'JWT_SECRET', 'JWT_REFRESH_SECRET'];

const isPlaceholder = (value) => /^(your_|replace_|changeme|change_me|example)/i.test(value.trim());

export const parseClientOrigins = (value = process.env.CLIENT_URL || '') =>
  value.split(',').map((origin) => origin.trim().replace(/\/$/, '')).filter(Boolean);

export const validateEnvironment = (env = process.env) => {
  const errors = requiredEnvironment
    .filter((key) => !env[key]?.trim())
    .map((key) => `${key} must be configured.`);

  if (env.PORT && (!Number.isInteger(Number(env.PORT)) || Number(env.PORT) < 1 || Number(env.PORT) > 65_535)) {
    errors.push('PORT must be an integer between 1 and 65535.');
  }

  if (env.NODE_ENV === 'production') {
    for (const key of ['JWT_SECRET', 'JWT_REFRESH_SECRET']) {
      const value = env[key]?.trim() || '';
      if (value.length < 32 || isPlaceholder(value)) {
        errors.push(`${key} must be a unique, randomly generated secret of at least 32 characters in production.`);
      }
    }

    if (env.JWT_SECRET && env.JWT_SECRET === env.JWT_REFRESH_SECRET) {
      errors.push('JWT_SECRET and JWT_REFRESH_SECRET must be different in production.');
    }

    const origins = parseClientOrigins(env.CLIENT_URL || '');
    if (origins.length === 0) {
      errors.push('CLIENT_URL must contain at least one deployed frontend origin in production.');
    }

    for (const origin of origins) {
      try {
        const parsed = new URL(origin);
        if (parsed.protocol !== 'https:' || parsed.origin !== origin || parsed.hostname === 'localhost' || parsed.hostname === '127.0.0.1') {
          errors.push(`CLIENT_URL entry "${origin}" must be an HTTPS origin without a path in production.`);
        }
      } catch {
        errors.push(`CLIENT_URL entry "${origin}" is not a valid origin.`);
      }
    }
  }

  return errors;
};
