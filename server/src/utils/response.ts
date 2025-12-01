import { Response } from 'express';
import { ApiSuccessResponse, ApiErrorResponse, HttpStatus } from '../types/api';

/**
 * Send a successful API response
 */
export function sendSuccess<T>(
  res: Response<ApiSuccessResponse<T>>,
  data: T,
  statusCode: HttpStatus = HttpStatus.OK,
  message?: string
): void {
  const response: ApiSuccessResponse<T> = {
    success: true,
    data,
  };
  if (message !== undefined) {
    response.message = message;
  }
  res.status(statusCode).json(response);
}

/**
 * Send an error API response
 */
export function sendError(
  res: Response<ApiErrorResponse>,
  error: string,
  statusCode: HttpStatus = HttpStatus.INTERNAL_SERVER_ERROR,
  details?: unknown,
  code?: string
): void {
  const response: ApiErrorResponse = {
    success: false,
    error,
  };
  if (details !== undefined) {
    response.details = details;
  }
  if (code !== undefined) {
    response.code = code;
  }
  res.status(statusCode).json(response);
}

/**
 * Send validation error response
 */
export function sendValidationError(
  res: Response<ApiErrorResponse>,
  details: unknown
): void {
  sendError(
    res,
    'Invalid request data',
    HttpStatus.BAD_REQUEST,
    details,
    'VALIDATION_ERROR'
  );
}

/**
 * Send not found error response
 */
export function sendNotFound(
  res: Response<ApiErrorResponse>,
  resource: string = 'Resource'
): void {
  sendError(
    res,
    `${resource} not found`,
    HttpStatus.NOT_FOUND,
    undefined,
    'NOT_FOUND'
  );
}

/**
 * Send conflict error response
 */
export function sendConflict(
  res: Response<ApiErrorResponse>,
  message: string
): void {
  sendError(res, message, HttpStatus.CONFLICT, undefined, 'CONFLICT');
}

