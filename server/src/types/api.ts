/**
 * Strongly typed API response types
 */

export interface ApiSuccessResponse<T = unknown> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  details?: unknown;
  code?: string;
}

export type ApiResponse<T = unknown> = ApiSuccessResponse<T> | ApiErrorResponse;

import { Request, Response } from 'express';

/**
 * Typed Express Request with validated body
 */
export interface TypedRequest<T = unknown> extends Request {
  body: T;
}

/**
 * Typed Express Response
 */
export type TypedResponse<T = unknown> = Response<ApiResponse<T>>;

/**
 * Async route handler type
 */
export type AsyncRouteHandler<TRequest = unknown, TResponse = unknown> = (
  req: TypedRequest<TRequest>,
  res: TypedResponse<TResponse>
) => Promise<void>;

/**
 * HTTP Status codes enum
 */
export enum HttpStatus {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  CONFLICT = 409,
  INTERNAL_SERVER_ERROR = 500,
}

