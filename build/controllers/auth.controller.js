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
const auth_service_1 = require("../services/auth.service");
const user_model_1 = __importDefault(require("../models/user.model"));
const config_1 = __importDefault(require("../config"));
const logger_1 = __importDefault(require("../utils/logger"));
const crypto_1 = __importDefault(require("crypto"));
/**
 * Register a new user
 * @route POST /api/auth/register
 */
const register = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password, name, registrationSecret } = req.body;
        // Validate required fields
        if (!email || !password) {
            res.status(400).json({ success: false, message: 'Email and password are required' });
            return;
        }
        // Validate registration secret
        if (registrationSecret !== config_1.default.registrationSecret) {
            res.status(403).json({ success: false, message: 'Invalid registration secret' });
            return;
        }
        // Check if user already exists
        const existingUser = yield user_model_1.default.findOne({ email });
        if (existingUser) {
            res.status(409).json({ success: false, message: 'Email is already registered' });
            return;
        }
        // Hash password and create user
        const passwordHash = yield (0, auth_service_1.hashPassword)(password);
        const newUser = new user_model_1.default({
            email,
            passwordHash,
            name,
        }); // Save user to database
        yield newUser.save();
        // Generate token for the new user
        const token = (0, auth_service_1.generateToken)({ userId: String(newUser._id) });
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
    }
    catch (error) {
        logger_1.default.error('Registration error', { error });
        res.status(500).json({ success: false, message: 'Error registering user' });
    }
});
exports.register = register;
/**
 * Login a user
 * @route POST /api/auth/login
 */
const login = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email, password } = req.body;
        // Validate required fields
        if (!email || !password) {
            res.status(400).json({ success: false, message: 'Email and password are required' });
            return;
        }
        // Find user by email
        const user = yield user_model_1.default.findOne({ email });
        if (!user) {
            res.status(401).json({ success: false, message: 'Invalid email or password' });
            return;
        }
        // Verify password
        const isPasswordValid = yield (0, auth_service_1.comparePassword)(password, user.passwordHash);
        if (!isPasswordValid) {
            res.status(401).json({ success: false, message: 'Invalid email or password' });
            return;
        }
        // Generate token
        const token = (0, auth_service_1.generateToken)({ userId: String(user._id) });
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
    }
    catch (error) {
        logger_1.default.error('Login error', { error });
        res.status(500).json({ success: false, message: 'Error during login' });
    }
});
exports.login = login;
/**
 * Request password reset
 * @route POST /api/auth/forgot-password
 */
const forgotPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { email } = req.body;
        // Validate email
        if (!email) {
            res.status(400).json({ success: false, message: 'Email is required' });
            return;
        }
        // Find user by email
        const user = yield user_model_1.default.findOne({ email });
        if (!user) {
            // For security reasons, don't reveal if email exists or not
            res.status(200).json({
                success: true,
                message: 'If a matching account was found, a password reset link has been sent',
            });
            return;
        }
        // Generate reset token (valid for 1 hour)
        const resetToken = crypto_1.default.randomBytes(32).toString('hex');
        user.resetPasswordToken = resetToken;
        user.resetPasswordExpires = new Date(Date.now() + 3600000); // 1 hour
        yield user.save();
        // Create reset URL
        const resetUrl = `${config_1.default.frontendUrl}/reset-password/${resetToken}`;
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
        logger_1.default.debug('Password reset link', { resetUrl, email });
        // Return success response
        res.status(200).json({
            success: true,
            message: 'If a matching account was found, a password reset link has been sent',
        });
    }
    catch (error) {
        logger_1.default.error('Password reset request error', { error });
        res.status(500).json({ success: false, message: 'Error processing password reset request' });
    }
});
exports.forgotPassword = forgotPassword;
/**
 * Reset password with token
 * @route POST /api/auth/reset-password
 */
const resetPassword = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { token, newPassword } = req.body;
        // Validate required fields
        if (!token || !newPassword) {
            res.status(400).json({ success: false, message: 'Token and new password are required' });
            return;
        }
        // Find user by reset token and check expiration
        const user = yield user_model_1.default.findOne({
            resetPasswordToken: token,
            resetPasswordExpires: { $gt: Date.now() },
        });
        if (!user) {
            res.status(400).json({ success: false, message: 'Password reset token is invalid or has expired' });
            return;
        }
        // Update password
        user.passwordHash = yield (0, auth_service_1.hashPassword)(newPassword);
        user.resetPasswordToken = undefined;
        user.resetPasswordExpires = undefined;
        yield user.save();
        // Return success response
        res.status(200).json({
            success: true,
            message: 'Password has been reset successfully',
        });
    }
    catch (error) {
        logger_1.default.error('Password reset error', { error });
        res.status(500).json({ success: false, message: 'Error resetting password' });
    }
});
exports.resetPassword = resetPassword;
//# sourceMappingURL=auth.controller.js.map