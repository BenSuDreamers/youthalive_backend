import { Request, Response, NextFunction } from 'express';
import { verifyToken, JwtPayload } from '../services/auth.service';
import User from '../models/user.model';
import logger from '../utils/logger';
import mongoose from 'mongoose';

// Extend Express Request interface to include user
declare global {
  namespace Express {
    interface Request {
      user?: {
        id: string;
        email: string;
        name?: string;
      };
    }
  }
}

/**
 * Middleware to authenticate requests using JWT
 */
export const authenticateJWT = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    // Get the authorization header
    const authHeader = req.headers.authorization;
    
    // Check if header exists and has the right format
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      res.status(401).json({
        success: false,
        message: 'Authorization required',
      });
      return;
    }

    // Extract the token
    const token = authHeader.split(' ')[1];
    
    // Verify the token
    const decoded = verifyToken(token);
    
    // Check if userId exists
    if (!decoded || !decoded.userId) {
      res.status(401).json({
        success: false,
        message: 'Invalid token',
      });
      return;
    }
    
    // Find the user
    const user = await User.findById(decoded.userId);
    if (!user) {
      res.status(401).json({
        success: false,
        message: 'User not found',
      });
      return;
    }      // Add user to request object
    req.user = {
      id: String(user._id),
      email: user.email,
      name: user.name,
    };
    
    // Continue to the next middleware
    next();
  } catch (error) {
    logger.error('Authentication error', { error });
    res.status(401).json({
      success: false,
      message: 'Authentication failed',
    });
  }
};