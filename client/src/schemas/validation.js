import { z } from 'zod';

const emailSchema = z
  .string()
  .trim()
  .min(1, 'Enter your email address.')
  .max(254, 'Email addresses can be up to 254 characters.')
  .email('Enter a valid email address.')
  .transform((email) => email.toLowerCase());

const passwordSchema = z
  .string()
  .min(8, 'Use at least 8 characters.')
  .max(72, 'Use no more than 72 characters.')
  .refine((password) => new TextEncoder().encode(password).length <= 72, 'Password is too long after encoding.')
  .refine((password) => /[A-Za-z]/.test(password), 'Include at least one letter.')
  .refine((password) => /\d/.test(password), 'Include at least one number.');

const nameSchema = z
  .string()
  .trim()
  .min(2, 'Enter at least 2 characters.')
  .max(80, 'Use no more than 80 characters.')
  .regex(/^[\p{L}\p{M}][\p{L}\p{M}\s'.-]*$/u, 'Use letters, spaces, apostrophes, periods, or hyphens.');

export const loginSchema = z.object({
  email: emailSchema,
  password: z
    .string()
    .min(1, 'Enter your password.')
    .max(72, 'Password is too long.')
    .refine((password) => new TextEncoder().encode(password).length <= 72, 'Password is too long.')
});

export const registerSchema = z
  .object({
    name: nameSchema,
    email: emailSchema,
    password: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirm your password.')
  })
  .refine((values) => values.password === values.confirmPassword, {
    path: ['confirmPassword'],
    message: 'Passwords do not match.'
  });

export const profileSchema = z.object({ name: nameSchema, email: emailSchema });

export const changePasswordSchema = z
  .object({
    oldPassword: z.string().min(1, 'Enter your current password.'),
    newPassword: passwordSchema,
    confirmPassword: z.string().min(1, 'Confirm your new password.')
  })
  .superRefine((values, context) => {
    if (values.newPassword !== values.confirmPassword) {
      context.addIssue({ code: 'custom', path: ['confirmPassword'], message: 'Passwords do not match.' });
    }
    if (values.newPassword === values.oldPassword) {
      context.addIssue({ code: 'custom', path: ['newPassword'], message: 'Choose a password different from your current one.' });
    }
  });

export const interviewSetupSchema = z
  .object({
    type: z.enum(['HR', 'Technical', 'Behavioural', 'Mixed', 'Custom']),
    difficulty: z.enum(['Easy', 'Medium', 'Hard']),
    totalQuestions: z.coerce.number().int('Enter a whole number of questions.').min(1, 'Choose at least 1 question.').max(30, 'Choose no more than 30 questions.'),
    topic: z.string().trim().max(120, 'Use no more than 120 characters.')
  })
  .superRefine((values, context) => {
    if (values.type === 'Custom' && values.topic.length < 2) {
      context.addIssue({ code: 'custom', path: ['topic'], message: 'Describe the interview topic in at least 2 characters.' });
    }
  });

export const answerSchema = z.object({
  transcript: z
    .string()
    .max(12000, 'Answers can be up to 12,000 characters.')
    .transform((transcript) => transcript.trim() || 'No answer provided.')
});

const isDateInputValue = (value) => {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false;
  const parsed = new Date(`${value}T00:00:00.000Z`);
  return !Number.isNaN(parsed.getTime()) && parsed.toISOString().slice(0, 10) === value;
};

export const reportRangeSchema = z
  .object({
    preset: z.enum(['7d', '30d', '3m', 'all', 'custom']),
    from: z.string(),
    to: z.string()
  })
  .superRefine(({ preset, from, to }, context) => {
    if (preset !== 'custom') return;
    if (!from || !isDateInputValue(from)) {
      context.addIssue({ code: 'custom', path: ['from'], message: 'Choose a valid start date.' });
    }
    if (!to || !isDateInputValue(to)) {
      context.addIssue({ code: 'custom', path: ['to'], message: 'Choose a valid end date.' });
    }
    if (isDateInputValue(from) && isDateInputValue(to) && from > to) {
      context.addIssue({ code: 'custom', path: ['to'], message: 'End date must be on or after the start date.' });
    }
  });

export const getZodFieldErrors = (error) => {
  if (!error?.issues) return {};
  return error.issues.reduce((fields, issue) => {
    const field = issue.path[0];
    if (field && !fields[field]) fields[field] = issue.message;
    return fields;
  }, {});
};
