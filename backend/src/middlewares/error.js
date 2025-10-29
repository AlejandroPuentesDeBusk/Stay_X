// backend/src/middlewares/error.js
import logger from '../core/logger.js';

export class AppError extends Error {
  constructor(message, statusCode = 500, code = 'INTERNAL_ERROR', meta = null) {
    super(message);
    this.statusCode = statusCode;
    this.code = code;
    this.meta = meta;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const notFoundHandler = (req, res) => {
  res.status(404).json({
    success: false,
    error: {
      code: 'NOT_FOUND',
      message: `Route ${req.method} ${req.path} not found`,
    },
    timestamp: new Date().toISOString(),
    requestId: req.id,
  });
};

export const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const code = err.code || 'INTERNAL_ERROR';
  const message = err.isOperational ? err.message : 'Something went wrong';

  logger.error({
    requestId: req.id,
    error: {
      message: err.message,
      stack: err.stack,
      code,
      statusCode,
      meta: err.meta
    },
    url: req.url,
    method: req.method,
  }, 'Request error');

  const response = {
    success: false,
    error: {
      code,
      message,
    },
    timestamp: new Date().toISOString(),
    requestId: req.id,
  };

  if (err.meta) {
    response.error.meta = err.meta;
  }

  res.status(statusCode).json(response);
};