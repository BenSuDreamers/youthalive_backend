import { Request, Response } from 'express';
import { User } from '../models/user.model';
import { hashPassword, comparePassword, generateToken, verifyToken } from '../services/auth.service';
import { emailService } from '../services/email.service';
import config from '../config';
import logger from '../utils/logger';

/**
 * Register a new user
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, registrationSecret } = req.body;
    
    // Validate input
    if (!email || !password || !registrationSecret) {
      res.status(400).json({ 
        success: false, 
        message: 'Email, password, and registration secret are required' 
      });
      return;
    }
    
    // Verify registration secret
    if (registrationSecret !== config.registrationSecret) {
      res.status(403).json({ 
        success: false, 
        message: 'Invalid registration secret' 
      });
      return;
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(409).json({ 
        success: false, 
        message: 'User already exists' 
      });
      return;
    }
    
    // Hash password and create user
    const passwordHash = await hashPassword(password);
    const newUser = new User({
      email,
      passwordHash,
      createdAt: new Date()
    });
    
    await newUser.save();
    
    // Generate JWT token
    const token = generateToken({ userId: (newUser._id as any).toString() });
    
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: newUser._id,
        email: newUser.email,
        createdAt: newUser.createdAt
      }
    });
  } catch (error) {
    logger.error('Registration error', { error });
    res.status(500).json({ 
      success: false, 
      message: 'Registration failed' 
    });
  }
};

/**
 * Login user
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;
    
    // Validate input
    if (!email || !password) {
      res.status(400).json({ 
        success: false, 
        message: 'Email and password are required' 
      });
      return;
    }
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
      return;
    }
    
    // Verify password
    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {
      res.status(401).json({ 
        success: false, 
        message: 'Invalid credentials' 
      });
      return;
    }
    
    // Generate JWT token
    const token = generateToken({ userId: (user._id as any).toString() });
    
    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id,
        email: user.email,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    logger.error('Login error', { error });
    res.status(500).json({ 
      success: false, 
      message: 'Login failed' 
    });
  }
};

/**
 * Send password reset email
 */
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;
    
    if (!email) {
      res.status(400).json({ 
        success: false, 
        message: 'Email is required' 
      });
      return;
    }
    
    // Find user
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if user exists or not
      res.status(200).json({ 
        success: true, 
        message: 'If the email exists, a password reset link has been sent' 
      });
      return;
    }
    
    // Generate reset token (valid for 1 hour)
    const resetToken = generateToken({ userId: (user._id as any).toString() });
    
    // Save reset token to user (optional, for additional security)
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
    await user.save();
    
    // Send reset email
    const resetUrl = `${config.frontendUrl}/reset-password?token=${resetToken}`;
    
    try {
      await emailService.sendPasswordResetEmail(user.email, resetUrl);
      logger.info('Password reset email sent', { email: user.email });
    } catch (emailError) {
      logger.error('Failed to send reset email', { error: emailError });
      // Don't fail the request if email fails
    }
    
    res.status(200).json({ 
      success: true, 
      message: 'If the email exists, a password reset link has been sent' 
    });
  } catch (error) {
    logger.error('Forgot password error', { error });
    res.status(500).json({ 
      success: false, 
      message: 'Password reset request failed' 
    });
  }
};

/**
 * Reset password with token
 */
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, newPassword } = req.body;
    
    if (!token || !newPassword) {
      res.status(400).json({ 
        success: false, 
        message: 'Token and new password are required' 
      });
      return;
    }

    // Verify the reset token
    const decoded = verifyToken(token);
    
    // Find user and check if reset token is still valid
    const user = await User.findById(decoded.userId);
    if (!user) {
      res.status(404).json({ success: false, message: 'User not found' });
      return;
    }

    // Check if token matches and hasn't expired
    if (user.resetPasswordToken !== token || 
        !user.resetPasswordExpires || 
        user.resetPasswordExpires < new Date()) {
      res.status(400).json({ 
        success: false, 
        message: 'Invalid or expired reset token' 
      });
      return;
    }

    // Hash new password and save
    user.passwordHash = await hashPassword(newPassword);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    res.status(200).json({ 
      success: true, 
      message: 'Password reset successful' 
    });
  } catch (error) {
    logger.error('Password reset error', { error });
    res.status(400).json({ 
      success: false, 
      message: 'Invalid or expired token' 
    });
  }
};