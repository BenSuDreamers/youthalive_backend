import bcrypt from 'bcryptjs';
import jwt, { Secret, SignOptions } from 'jsonwebtoken';
import config from '../config';
import logger from '../utils/logger';

// Interface for JWT payload
export interface JwtPayload {
  userId: string;
  iat?: number;
  exp?: number;
}

/**
 * Hash a password using bcrypt
 */
export const hashPassword = async (plainPassword: string): Promise<string> => {
  try {
    const salt = await bcrypt.genSalt(10);
    return await bcrypt.hash(plainPassword, salt);
  } catch (error) {
    logger.error('Error hashing password', { error });
    throw new Error('Password hashing failed');
  }
};

/**
 * Compare a plain password with a hash
 */
export const comparePassword = async (
  plainPassword: string,
  hash: string
): Promise<boolean> => {
  try {
    return await bcrypt.compare(plainPassword, hash);
  } catch (error) {
    logger.error('Error comparing passwords', { error });
    throw new Error('Password comparison failed');
  }
};

/**
 * Generate a JWT token for authentication
 */
export const generateToken = (payload: JwtPayload): string => {
  try {    // Need to use Buffer.from to convert to a format jwt.sign accepts
    const secret = Buffer.from(config.jwt.secret, 'utf8');    const options: SignOptions = {
      expiresIn: '1d' // Fixed to 1 day
    };
    
    return jwt.sign(payload, secret, options);
  } catch (error) {
    logger.error('Error generating JWT token', { error });
    throw new Error('Token generation failed');
  }
};

/**
 * Verify and decode a JWT token
 */
export const verifyToken = (token: string): JwtPayload => {
  try {
    const secret = Buffer.from(config.jwt.secret, 'utf8');
    const decoded = jwt.verify(token, secret);
    return decoded as JwtPayload;
  } catch (error) {
    logger.error('Invalid token', { error });
    throw new Error('Invalid token');
  }
};