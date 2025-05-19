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
exports.verifyToken = exports.generateToken = exports.comparePassword = exports.hashPassword = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const config_1 = __importDefault(require("../config"));
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Hash a password using bcrypt
 */
const hashPassword = (plainPassword) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const salt = yield bcryptjs_1.default.genSalt(10);
        return yield bcryptjs_1.default.hash(plainPassword, salt);
    }
    catch (error) {
        logger_1.default.error('Error hashing password', { error });
        throw new Error('Password hashing failed');
    }
});
exports.hashPassword = hashPassword;
/**
 * Compare a plain password with a hash
 */
const comparePassword = (plainPassword, hash) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        return yield bcryptjs_1.default.compare(plainPassword, hash);
    }
    catch (error) {
        logger_1.default.error('Error comparing passwords', { error });
        throw new Error('Password comparison failed');
    }
});
exports.comparePassword = comparePassword;
/**
 * Generate a JWT token for authentication
 */
const generateToken = (payload) => {
    try { // Need to use Buffer.from to convert to a format jwt.sign accepts
        const secret = Buffer.from(config_1.default.jwt.secret, 'utf8');
        const options = {
            expiresIn: '1d' // Fixed to 1 day
        };
        return jsonwebtoken_1.default.sign(payload, secret, options);
    }
    catch (error) {
        logger_1.default.error('Error generating JWT token', { error });
        throw new Error('Token generation failed');
    }
};
exports.generateToken = generateToken;
/**
 * Verify and decode a JWT token
 */
const verifyToken = (token) => {
    try {
        const secret = Buffer.from(config_1.default.jwt.secret, 'utf8');
        const decoded = jsonwebtoken_1.default.verify(token, secret);
        return decoded;
    }
    catch (error) {
        logger_1.default.error('Invalid token', { error });
        throw new Error('Invalid token');
    }
};
exports.verifyToken = verifyToken;
//# sourceMappingURL=auth.service.js.map