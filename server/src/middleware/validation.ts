import { Request, Response, NextFunction } from 'express';
import { ZodSchema, ZodError } from 'zod';
import { sendValidationError } from '../utils/response';

/**
 * Request validation middleware using Zod schemas
 */
export function validateRequest<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validated = schema.parse(req.body);
      // Attach validated data to request
      (req as Request & { validatedBody: T }).validatedBody = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        sendValidationError(res, error.errors);
        return;
      }
      next(error);
    }
  };
}

/**
 * Query parameter validation middleware
 */
export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction): void => {
    try {
      const validated = schema.parse(req.query);
      (req as Request & { validatedQuery: T }).validatedQuery = validated;
      next();
    } catch (error) {
      if (error instanceof ZodError) {
        sendValidationError(res, error.errors);
        return;
      }
      next(error);
    }
  };
}

