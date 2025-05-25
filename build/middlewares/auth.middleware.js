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
exports.authenticateJWT = void 0;
const auth_service_1 = require("../services/auth.service");
const user_model_1 = require("../models/user.model");
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Middleware to authenticate requests using JWT
 */
const authenticateJWT = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
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
        const decoded = (0, auth_service_1.verifyToken)(token);
        // Check if userId exists
        if (!decoded || !decoded.userId) {
            res.status(401).json({
                success: false,
                message: 'Invalid token',
            });
            return;
        }
        // Find the user
        const user = yield user_model_1.User.findById(decoded.userId);
        if (!user) {
            res.status(401).json({
                success: false,
                message: 'User not found',
            });
            return;
        } // Add user to request object
        req.user = {
            id: String(user._id),
            email: user.email
        };
        // Continue to the next middleware
        next();
    }
    catch (error) {
        logger_1.default.error('Authentication error', { error });
        res.status(401).json({
            success: false,
            message: 'Authentication failed',
        });
    }
});
exports.authenticateJWT = authenticateJWT;
//# sourceMappingURL=auth.middleware.js.map