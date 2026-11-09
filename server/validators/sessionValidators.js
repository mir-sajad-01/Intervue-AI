import { body, param, query } from 'express-validator';

const interviewTypes = ['HR', 'Technical', 'Behavioural', 'Mixed', 'Custom'];
const difficultyLevels = ['Easy', 'Medium', 'Hard'];

export const startSessionRules = [
  body('type').isIn(interviewTypes).withMessage('Choose a valid interview type.'),
  body('difficulty').isIn(difficultyLevels).withMessage('Choose an available difficulty level.'),
  body('totalQuestions').isInt({ min: 1, max: 30 }).withMessage('Question count must be between 1 and 30.'),
  body('topic')
    .if(body('type').equals('Custom'))
    .isString().withMessage('Describe your interview focus.').bail()
    .trim()
    .isLength({ min: 2, max: 120 }).withMessage('Describe your interview focus in 2–120 characters.')
];

export const submitAnswerRules = [
  param('id').isMongoId().withMessage('This interview session ID is invalid.'),
  body('questionId').isMongoId().withMessage('Choose a valid question.'),
  body('transcript')
    .isString().withMessage('Your answer must be text.').bail()
    .trim()
    .isLength({ min: 1, max: 12000 }).withMessage('Add an answer between 1 and 12,000 characters.')
];

export const endSessionRules = [
  param('id').isMongoId().withMessage('This interview session ID is invalid.'),
  body('duration').optional().isInt({ min: 0, max: 86400 }).withMessage('Session duration must be between 0 and 24 hours.').toInt()
];

export const sessionIdRules = [param('id').isMongoId().withMessage('This interview session ID is invalid.')];

export const sessionListRules = [
  query('page').optional().isInt({ min: 1, max: 100000 }).withMessage('Page must be a positive whole number.'),
  query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Page size must be between 1 and 100.'),
  query('type').optional({ checkFalsy: true }).isIn(interviewTypes).withMessage('Choose a valid interview type.'),
  query('difficulty').optional({ checkFalsy: true }).isIn(difficultyLevels).withMessage('Choose a valid difficulty level.'),
  query('from').optional().isISO8601().withMessage('Start date must be a valid date.'),
  query('to')
    .optional()
    .isISO8601().withMessage('End date must be a valid date.')
    .bail()
    .custom((to, { req }) => {
      const from = req.query.from || req.query.startDate;
      return !from || new Date(to) >= new Date(from);
    })
    .withMessage('End date must be on or after start date.'),
  query('startDate').optional().isISO8601().withMessage('Start date must be a valid date.'),
  query('endDate')
    .optional()
    .isISO8601().withMessage('End date must be a valid date.')
    .bail()
    .custom((endDate, { req }) => !req.query.startDate || new Date(endDate) >= new Date(req.query.startDate))
    .withMessage('End date must be on or after start date.'),
  query('sortBy').optional().isIn(['date', 'score']).withMessage('Choose a valid sort option.'),
  query('order').optional().isIn(['asc', 'desc']).withMessage('Choose a valid sort order.')
];
