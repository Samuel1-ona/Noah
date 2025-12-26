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

  // Always include validation errors in response (not just in development)
  if (err.validationErrors) {
    errorResponse.error.validationErrors = err.validationErrors;
  }

  // Always log validation errors for debugging
  if (err.validationErrors) {
    console.error('Validation errors:', err.validationErrors);
  }

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

