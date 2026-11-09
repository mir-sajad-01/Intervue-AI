import { body } from 'express-validator';

export const registerRules = [
  body('name')
    .isString().withMessage('Enter your name.').bail()
    .trim()
    .isLength({ min: 2, max: 80 }).withMessage('Name must be between 2 and 80 characters.')
    .bail()
    .matches(/^[\p{L}\p{M}][\p{L}\p{M}\s'.-]*$/u).withMessage('Use letters, spaces, apostrophes, periods, or hyphens.'),
  body('email')
    .isString().withMessage('Enter a valid email address.').bail()
    .trim()
    .isEmail().withMessage('Enter a valid email address.')
    .normalizeEmail({ gmail_remove_dots: false, gmail_remove_subaddress: false }),
  body('password')
    .isString().withMessage('Enter a password.').bail()
    .isLength({ min: 8, max: 72 }).withMessage('Use a password between 8 and 72 characters.')
    .bail()
    .custom((value) => Buffer.byteLength(value, 'utf8') <= 72).withMessage('Password can contain at most 72 UTF-8 bytes.')
    .bail()
    .matches(/[A-Za-z]/).withMessage('Include at least one letter.')
    .bail()
    .matches(/\d/).withMessage('Include at least one number.')
];

export const loginRules = [
  body('email')
    .isString().withMessage('Enter a valid email address.').bail()
    .trim()
    .isEmail().withMessage('Enter a valid email address.')
    .normalizeEmail({ gmail_remove_dots: false, gmail_remove_subaddress: false }),
  body('password')
    .isString().withMessage('Enter your password.').bail()
    .notEmpty().withMessage('Enter your password.')
    .bail()
    .custom((value) => Buffer.byteLength(value, 'utf8') <= 72).withMessage('Password is too long.')
];

export const refreshRules = [body('refreshToken').optional().isString().notEmpty().withMessage('Refresh token is invalid.')];

export const profileRules = [
  body('name')
    .isString().withMessage('Enter your name.').bail()
    .trim()
    .isLength({ min: 2, max: 80 }).withMessage('Name must be between 2 and 80 characters.')
    .bail()
    .matches(/^[\p{L}\p{M}][\p{L}\p{M}\s'.-]*$/u).withMessage('Use letters, spaces, apostrophes, periods, or hyphens.'),
  body('email')
    .isString().withMessage('Enter a valid email address.').bail()
    .trim()
    .isEmail().withMessage('Enter a valid email address.')
    .normalizeEmail({ gmail_remove_dots: false, gmail_remove_subaddress: false })
];

const passwordRules = (field) => body(field)
  .isString().withMessage('Enter a password.').bail()
  .isLength({ min: 8, max: 72 }).withMessage('Use a password between 8 and 72 characters.')
  .bail()
  .custom((value) => Buffer.byteLength(value, 'utf8') <= 72).withMessage('Password can contain at most 72 UTF-8 bytes.')
  .bail()
  .matches(/[A-Za-z]/).withMessage('Include at least one letter.')
  .bail()
  .matches(/\d/).withMessage('Include at least one number.');

export const changePasswordRules = [
  body('oldPassword').isString().withMessage('Enter your current password.').bail().notEmpty().withMessage('Enter your current password.'),
  passwordRules('newPassword')
];
