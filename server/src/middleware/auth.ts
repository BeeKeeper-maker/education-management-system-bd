import { Request, Response, NextFunction } from 'express';
import { verifyToken, JWTPayload } from '../utils/jwt';
import { unauthorizedResponse, forbiddenResponse } from '../utils/response';

// Extend Express Request type to include user
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload;
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return unauthorizedResponse(res, 'No token provided');
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    const payload = verifyToken(token);

    req.user = payload;
    next();
  } catch (error) {
    return unauthorizedResponse(res, 'Invalid or expired token');
  }
}

export function authorize(...allowedRoles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user) {
      return unauthorizedResponse(res, 'Authentication required');
    }

    if (!allowedRoles.includes(req.user.role)) {
      return forbiddenResponse(
        res,
        'You do not have permission to access this resource'
      );
    }

    next();
  };
}

// Middleware to check if user is authenticated (for session-based auth)
export function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (req.session && req.session.userId) {
    next();
  } else {
    return unauthorizedResponse(res, 'Please login to continue');
  }
}