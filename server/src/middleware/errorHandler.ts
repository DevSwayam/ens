import { Request, Response, NextFunction } from 'express';
import { AppError } from '../utils/errors';
import { sendError, HttpStatus } from '../utils/response';
import { logger } from './logger';

/**
 * Global error handling middleware
 * Catches all errors and returns standardized error responses
 */
export function errorHandler(
  err: Error | AppError,
  _req: Request,
  res: Response,
  _next: NextFunction
): void {
  // Log error
  logger.error('Error occurred:', {
    error: err.message,
    stack: err.stack,
    name: err.name,
  });

  // Handle known AppError instances
  if (err instanceof AppError) {
    sendError(
      res,
      err.message,
      err.statusCode as HttpStatus,
      err.details,
      err.code
    );
    return;
  }

  // Handle unexpected errors
  const isDevelopment = process.env.NODE_ENV === 'development';
  sendError(
    res,
    'Internal server error',
    HttpStatus.INTERNAL_SERVER_ERROR,
    isDevelopment ? { message: err.message, stack: err.stack } : undefined,
    'INTERNAL_ERROR'
  );
}

/**
 * Async handler wrapper to catch errors in async route handlers
 */
export function asyncHandler<TRequest = unknown, TResponse = unknown>(
  fn: (req: Request, res: Response, next: NextFunction) => Promise<TResponse>
) {
  return (req: Request, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

