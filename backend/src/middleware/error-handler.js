import { errorLogger, logger } from '../utils/logger.js';
import { config } from '../config/env.js';

export class AppError extends Error {
  constructor(message, statusCode = 500, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

// Centralized error handling middleware
export const errorHandler = (err, req, res, next) => {
  // Log error
  errorLogger(err, req);

  // Default error
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';

  // Validation errors
  if (err.name === 'ValidationError' || err.validationErrors) {
    statusCode = 400;
    message = err.message;
    // #region agent log
    errorLogger(err, req);
    logger.error('Validation error details', {
      validationErrors: err.validationErrors,
      body: req.body,
      method: req.method,
      url: req.url
    });
    // #endregion
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid token';
  }

  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Token expired';
  }

  // Ethers.js errors
  if (err.code === 'CALL_EXCEPTION' || err.code === 'INVALID_ARGUMENT') {
    statusCode = 400;
    message = `Blockchain error: ${err.reason || err.message}`;
  }

  // Response
  const errorResponse = {
    success: false,
    error: {
      message,
      ...(err.validationErrors && {
        validationErrors: err.validationErrors,
      }),
      ...(config.logging.env === 'development' && {
        stack: err.stack,
        details: err,
      }),
    },
  };

  // Always log validation errors for debugging
  if (err.validationErrors) {
    console.error('Validation errors:', err.validationErrors);
    // #region agent log
    logger.error('Validation errors in error handler', {
      validationErrors: err.validationErrors,
      body: req.body,
      method: req.method,
      url: req.url,
    });
    // #endregion
  }

  // #region agent log
  // Log all 500 errors with full details
  if (statusCode === 500) {
    logger.error('500 error in error handler', {
      errorMessage: err.message,
      errorStack: err.stack,
      errorName: err.name,
      errorCode: err.code,
      body: req.body,
      method: req.method,
      url: req.url,
      validationErrors: err.validationErrors,
    });
  }
  // #endregion

  res.status(statusCode).json(errorResponse);
};

// Async error wrapper
export const asyncHandler = (fn) => {
  return (req, res, next) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

// 404 handler
export const notFoundHandler = (req, res, next) => {
  const error = new AppError(`Route ${req.originalUrl} not found`, 404);
  next(error);
};

