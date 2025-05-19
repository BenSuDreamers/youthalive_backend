"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.notFoundHandler = exports.errorHandler = void 0;
const logger_1 = __importDefault(require("../utils/logger"));
const config_1 = __importDefault(require("../config"));
/**
 * Global error handler middleware
 */
const errorHandler = (err, req, res, next) => {
    // Determine status code
    const statusCode = err.statusCode || err.status || 500;
    // Log the error
    logger_1.default.error(`${statusCode} - ${err.message}`, {
        method: req.method,
        url: req.originalUrl,
        ip: req.ip,
        error: err.stack,
        body: config_1.default.nodeEnv === 'development' ? req.body : undefined,
    });
    // Send error response
    res.status(statusCode).json({
        success: false,
        message: err.message || 'Internal Server Error',
        stack: config_1.default.nodeEnv === 'development' ? err.stack : undefined,
    });
};
exports.errorHandler = errorHandler;
/**
 * Middleware to handle 404 Not Found errors
 */
const notFoundHandler = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    error.statusCode = 404;
    next(error);
};
exports.notFoundHandler = notFoundHandler;
//# sourceMappingURL=error.middleware.js.map