import bcrypt from 'bcryptjs';
import jwt, { SignOptions } from 'jsonwebtoken';
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
    logger.error('Error comparing password', { error });
    throw new Error('Password comparison failed');
  }
};

/**
 * Generate a JWT token
 */
export const generateToken = (payload: { userId: string }): string => {  try {
    const options: SignOptions = {
      expiresIn: config.jwt.expiresIn 
    } as SignOptions;
    
    return jwt.sign(payload, config.jwt.secret, options);
  } catch (error) {
    logger.error('Error generating token', { error });
    throw new Error('Token generation failed');
  }
};

/**
 * Verify a JWT token
 */
export const verifyToken = (token: string): JwtPayload => {
  try {
    const decoded = jwt.verify(token, config.jwt.secret) as JwtPayload;
    return decoded;
  } catch (error) {
    logger.error('Error verifying token', { error });
    throw new Error('Token verification failed');
  }
};