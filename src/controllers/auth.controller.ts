import { Request, Response } from 'express';
import { hashPassword, comparePassword, generateToken } from '../services/auth.service';
import User, { IUser } from '../models/user.model';
import { sendTicketEmail } from '../services/email.service';
import config from '../config';
import logger from '../utils/logger';
import crypto from 'crypto';
import mongoose from 'mongoose';

/**
 * Register a new user
 * @route POST /api/auth/register
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password, name, registrationSecret } = req.body;

    // Validate required fields
    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password are required' });
      return;
    }

    // Validate registration secret
    if (registrationSecret !== config.registrationSecret) {
      res.status(403).json({ success: false, message: 'Invalid registration secret' });
      return;
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      res.status(409).json({ success: false, message: 'Email is already registered' });
      return;
    }

    // Hash password and create user
    const passwordHash = await hashPassword(password);
    const newUser = new User({
      email,
      passwordHash,
      name,
    });    // Save user to database
    await newUser.save();
    
    // Generate token for the new user
    const token = generateToken({ userId: String(newUser._id) });

    // Return success response with token
    res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      user: {
        id: newUser._id.toString(),
        email: newUser.email,
        name: newUser.name,
      },
    });
  } catch (error) {
    logger.error('Registration error', { error });
    res.status(500).json({ success: false, message: 'Error registering user' });
  }
};

/**
 * Login a user
 * @route POST /api/auth/login
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    // Validate required fields
    if (!email || !password) {
      res.status(400).json({ success: false, message: 'Email and password are required' });
      return;
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      res.status(401).json({ success: false, message: 'Invalid email or password' });
      return;
    }

    // Verify password
    const isPasswordValid = await comparePassword(password, user.passwordHash);
    if (!isPasswordValid) {      res.status(401).json({ success: false, message: 'Invalid email or password' });
      return;
    }
    
    // Generate token
    const token = generateToken({ userId: String(user._id) });

    // Return success response with token
    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: {
        id: user._id.toString(),
        email: user.email,
        name: user.name,
      },
    });
  } catch (error) {
    logger.error('Login error', { error });
    res.status(500).json({ success: false, message: 'Error during login' });
  }
};

/**
 * Request password reset
 * @route POST /api/auth/forgot-password
 */
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    // Validate email
    if (!email) {
      res.status(400).json({ success: false, message: 'Email is required' });
      return;
    }

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      // For security reasons, don't reveal if email exists or not
      res.status(200).json({
        success: true,
        message: 'If a matching account was found, a password reset link has been sent',
      });
      return;
    }

    // Generate reset token (valid for 1 hour)
    const resetToken = crypto.randomBytes(32).toString('hex');
    user.resetPasswordToken = resetToken;
    user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
    await user.save();

    // Create reset URL
    const resetUrl = `${config.frontendUrl}/reset-password/${resetToken}`;

    // Send password reset email
    // This example uses a simplified email, you'd want to use your email service
    /*
    await sendPasswordResetEmail(
      user.email,
      user.name || 'User',
      resetUrl
    );
    */

    // Log the reset URL for development (remove in production)
    logger.debug('Password reset link', { resetUrl, email });

    // Return success response
    res.status(200).json({
      success: true,
      message: 'If a matching account was found, a password reset link has been sent',
    });
  } catch (error) {
    logger.error('Password reset request error', { error });
    res.status(500).json({ success: false, message: 'Error processing password reset request' });
  }
};

/**
 * Reset password with token
 * @route POST /api/auth/reset-password
 */
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, newPassword } = req.body;

    // Validate required fields
    if (!token || !newPassword) {
      res.status(400).json({ success: false, message: 'Token and new password are required' });
      return;
    }

    // Find user by reset token and check expiration
    const user = await User.findOne({
      resetPasswordToken: token,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      res.status(400).json({ success: false, message: 'Password reset token is invalid or has expired' });
      return;
    }

    // Update password
    user.passwordHash = await hashPassword(newPassword);
    user.resetPasswordToken = undefined;
    user.resetPasswordExpires = undefined;
    await user.save();

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Password has been reset successfully',
    });
  } catch (error) {
    logger.error('Password reset error', { error });
    res.status(500).json({ success: false, message: 'Error resetting password' });
  }
};