import { Request, Response, NextFunction } from 'express';
import logger from '../utils/logger';
import config from '../config';

// Interface to represent errors with status codes
interface ErrorWithStatus extends Error {
  statusCode?: number;
  status?: number;
}

/**
 * Global error handler middleware
 */
export const errorHandler = (
  err: ErrorWithStatus,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Determine status code
  const statusCode = err.statusCode || err.status || 500;
  
  // Log the error
  logger.error(`${statusCode} - ${err.message}`, {
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    error: err.stack,
    body: config.nodeEnv === 'development' ? req.body : undefined,
  });
  
  // Send error response
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal Server Error',
    stack: config.nodeEnv === 'development' ? err.stack : undefined,
  });
};

/**
 * Middleware to handle 404 Not Found errors
 */
export const notFoundHandler = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const error = new Error(`Not Found - ${req.originalUrl}`) as ErrorWithStatus;
  error.statusCode = 404;
  next(error);
};