"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.forgotPassword = exports.login = exports.register = void 0;
const user_model_1 = require("../models/user.model");
const auth_service_1 = require("../services/auth.service");
const email_service_1 = require("../services/email.service");
const config_1 = __importDefault(require("../config"));
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Register a new user
 */
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        if (registrationSecret !== config_1.default.registrationSecret) {
            res.status(403).json({
                success: false,
                message: 'Invalid registration secret'
            });
            return;
        }
        // Check if user already exists
        const existingUser = yield user_model_1.User.findOne({ email });
        if (existingUser) {
            res.status(409).json({
                success: false,
                message: 'User already exists'
            });
            return;
        }
        // Hash password and create user
        const passwordHash = yield (0, auth_service_1.hashPassword)(password);
        const newUser = new user_model_1.User({
            email,
            passwordHash,
            createdAt: new Date()
        });
        yield newUser.save();
        // Generate JWT token
        const token = (0, auth_service_1.generateToken)({ userId: newUser._id.toString() });
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
    }
    catch (error) {
        logger_1.default.error('Registration error', { error });
        res.status(500).json({
            success: false,
            message: 'Registration failed'
        });
    }
});
exports.register = register;
/**
 * Login user
 */
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const user = yield user_model_1.User.findOne({ email });
        if (!user) {
            res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
            return;
        }
        // Verify password
        const isPasswordValid = yield (0, auth_service_1.comparePassword)(password, user.passwordHash);
        if (!isPasswordValid) {
            res.status(401).json({
                success: false,
                message: 'Invalid credentials'
            });
            return;
        }
        // Generate JWT token
        const token = (0, auth_service_1.generateToken)({ userId: user._id.toString() });
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
    }
    catch (error) {
        logger_1.default.error('Login error', { error });
        res.status(500).json({
            success: false,
            message: 'Login failed'
        });
    }
});
exports.login = login;
/**
 * Send password reset email
 */
const forgotPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const user = yield user_model_1.User.findOne({ email });
        if (!user) {
            // Don't reveal if user exists or not
            res.status(200).json({
                success: true,
                message: 'If the email exists, a password reset link has been sent'
            });
            return;
        }
        // Generate reset token (valid for 1 hour)
        const resetToken = (0, auth_service_1.generateToken)({ userId: user._id.toString() });
        // Save reset token to user (optional, for additional security)
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
        yield user.save();
        // Send reset email
        const resetUrl = `${config_1.default.frontendUrl}/reset-password?token=${resetToken}`;
        try {
            yield email_service_1.emailService.sendPasswordResetEmail(user.email, resetUrl);
            logger_1.default.info('Password reset email sent', { email: user.email });
        }
        catch (emailError) {
            logger_1.default.error('Failed to send reset email', { error: emailError });
            // Don't fail the request if email fails
        }
        res.status(200).json({
            success: true,
            message: 'If the email exists, a password reset link has been sent'
        });
    }
    catch (error) {
        logger_1.default.error('Forgot password error', { error });
        res.status(500).json({
            success: false,
            message: 'Password reset request failed'
        });
    }
});
exports.forgotPassword = forgotPassword;
/**
 * Reset password with token
 */
const resetPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const decoded = (0, auth_service_1.verifyToken)(token);
        // Find user and check if reset token is still valid
        const user = yield user_model_1.User.findById(decoded.userId);
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
        user.passwordHash = yield (0, auth_service_1.hashPassword)(newPassword);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        yield user.save();
        res.status(200).json({
            success: true,
            message: 'Password reset successful'
        });
    }
    catch (error) {
        logger_1.default.error('Password reset error', { error });
        res.status(400).json({
            success: false,
            message: 'Invalid or expired token'
        });
    }
});
exports.resetPassword = resetPassword;
//# sourceMappingURL=auth.controller.js.map