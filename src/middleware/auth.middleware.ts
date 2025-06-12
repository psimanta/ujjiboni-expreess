import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User, UserRole } from '../models';
import config from '../config';

// Extend Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: any; // Using any for now to avoid TypeScript issues
    }
  }
}

export interface JWTPayload {
  userId: string;
  email: string;
  role: UserRole;
  iat?: number;
  exp?: number;
}

// Simple authentication middleware
export const authenticate = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Access denied. No token provided or invalid format.',
      });
      return;
    }

    const token = authHeader.substring(7); // Remove "Bearer " prefix
    console.log('token', token);

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.',
      });
      return;
    }

    // Verify the token
    const decoded = jwt.verify(token, config.jwt.secret as jwt.Secret) as JWTPayload;

    // Find the user
    const user = await User.findById(decoded.userId);
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Access denied. User not found.',
      });
      return;
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    if (error instanceof jwt.JsonWebTokenError) {
      res.status(401).json({
        success: false,
        message: 'Access denied. Invalid token.',
      });
      return;
    }

    if (error instanceof jwt.TokenExpiredError) {
      res.status(401).json({
        success: false,
        message: 'Access denied. Token expired.',
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error during authentication.',
    });
  }
};

// Middleware to check if user has admin role
export const requireAdmin = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required.',
    });
    return;
  }

  if (req.user.role !== UserRole.ADMIN) {
    res.status(403).json({
      success: false,
      message: 'Access denied. Admin privileges required.',
    });
    return;
  }

  next();
};

// Middleware to check if user has member or admin role
export const requireMember = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required.',
    });
    return;
  }

  if (req.user.role !== UserRole.MEMBER && req.user.role !== UserRole.ADMIN) {
    res.status(403).json({
      success: false,
      message: 'Access denied. Member privileges required.',
    });
    return;
  }

  next();
};

// Middleware to check if user has member role only (not admin)
export const requireMemberOnly = (req: Request, res: Response, next: NextFunction): void => {
  if (!req.user) {
    res.status(401).json({
      success: false,
      message: 'Authentication required.',
    });
    return;
  }

  if (req.user.role !== UserRole.MEMBER) {
    res.status(403).json({
      success: false,
      message: 'Access denied. Member-only privileges required.',
    });
    return;
  }

  next();
};
