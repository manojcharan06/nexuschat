import { validationResult } from 'express-validator';
import { ApiError } from '../utils/apiError.util.js';

export const validateRequest = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const formattedErrors = errors.array().map((err) => ({
      field: err.path,
      message: err.msg,
    }));
    return next(ApiError.badRequest('Validation failed', 'INVALID_INPUT', formattedErrors));
  }
  next();
};
