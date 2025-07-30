"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
// Load environment variables from .env file
dotenv_1.default.config({ path: path_1.default.resolve(__dirname, '../../.env') });
// Define which environment variables are required
const requiredEnvVars = [
    'MONGODB_URI',
    'JWT_SECRET',
    'REGISTRATION_SECRET',
    'JOTFORM_API_KEY',
    'GMAIL_USER',
    'GMAIL_PASSWORD',
    'FROM_EMAIL',
    'FROM_NAME'
];
// Validate required environment variables
for (const envVar of requiredEnvVars) {
    if (!process.env[envVar]) {
        throw new Error(`Missing required environment variable: ${envVar}`);
    }
}
// Create and export the config object
const config = {
    // Server config
    port: parseInt(process.env.PORT || '3000', 10),
    nodeEnv: process.env.NODE_ENV || 'development',
    // Database config
    mongodb: {
        uri: process.env.MONGODB_URI,
    },
    // Auth config
    jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRES_IN || '1d',
    },
    registrationSecret: process.env.REGISTRATION_SECRET,
    // Jotform config
    jotform: {
        apiKey: process.env.JOTFORM_API_KEY,
    },
    // Email config
    email: {
        user: process.env.GMAIL_USER,
        password: process.env.GMAIL_PASSWORD,
        fromEmail: process.env.FROM_EMAIL,
        fromName: process.env.FROM_NAME,
    },
    // Frontend URL
    frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
};
exports.default = config;
//# sourceMappingURL=index.js.map