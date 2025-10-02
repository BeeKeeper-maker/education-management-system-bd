import { Request, Response, NextFunction } from 'express';
import { errorResponse } from '../utils/response';

export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('Error:', err);

  // Handle specific error types
  if (err.name === 'ValidationError') {
    return errorResponse(res, err.message, 422);
  }

  if (err.name === 'UnauthorizedError') {
    return errorResponse(res, 'Unauthorized', 401);
  }

  if (err.name === 'ForbiddenError') {
    return errorResponse(res, 'Forbidden', 403);
  }

  // Default error response
  return errorResponse(
    res,
    process.env.NODE_ENV === 'production'
      ? 'Internal server error'
      : err.message,
    500
  );
}

export function notFoundHandler(req: Request, res: Response) {
  return errorResponse(res, `Route ${req.originalUrl} not found`, 404);
}