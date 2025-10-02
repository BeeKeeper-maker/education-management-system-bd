import { Response } from 'express';

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  errors?: Record<string, string[]>;
}

export function successResponse<T>(
  res: Response,
  data: T,
  message?: string,
  statusCode: number = 200
): Response {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  } as ApiResponse<T>);
}

export function errorResponse(
  res: Response,
  error: string,
  statusCode: number = 400,
  errors?: Record<string, string[]>
): Response {
  return res.status(statusCode).json({
    success: false,
    error,
    errors,
  } as ApiResponse);
}

export function validationErrorResponse(
  res: Response,
  errors: Record<string, string[]>
): Response {
  return res.status(422).json({
    success: false,
    error: 'Validation failed',
    errors,
  } as ApiResponse);
}

export function unauthorizedResponse(
  res: Response,
  message: string = 'Unauthorized'
): Response {
  return res.status(401).json({
    success: false,
    error: message,
  } as ApiResponse);
}

export function forbiddenResponse(
  res: Response,
  message: string = 'Forbidden'
): Response {
  return res.status(403).json({
    success: false,
    error: message,
  } as ApiResponse);
}

export function notFoundResponse(
  res: Response,
  message: string = 'Resource not found'
): Response {
  return res.status(404).json({
    success: false,
    error: message,
  } as ApiResponse);
}