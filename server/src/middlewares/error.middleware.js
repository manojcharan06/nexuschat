import { ApiError } from '../utils/apiError.util.js';
import { logger } from '../utils/logger.util.js';

export const errorHandler = (err, req, res, next) => {
  let { statusCode, message, code, details } = err;

  if (!(err instanceof ApiError)) {
    statusCode = err.statusCode || 500;
    code = err.code || 'INTERNAL_ERROR';
    message = err.message || 'An unexpected error occurred';
    details = [];
  }

  logger.error(`${req.method} ${req.originalUrl} - ${statusCode} - ${message}`);

  res.status(statusCode).json({
    success: false,
    statusCode,
    error: {
      code,
      message,
      details,
    },
  });
};
