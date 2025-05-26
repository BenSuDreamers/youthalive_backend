import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env file
dotenv.config({ path: path.resolve(__dirname, '../../.env') });

// Define interface for our configuration
interface Config {
  // Server
  port: number;
  nodeEnv: string;
  
  // Database
  mongodb: {
    uri: string;
  };
  
  // Authentication
  jwt: {
    secret: string;
    expiresIn: string;
  };
  registrationSecret: string;
  
  // Jotform
  jotform: {
    apiKey: string;
  };
    // Email
  email: {
    user: string;
    password: string;
    fromEmail: string;
    fromName: string;
  };
  
  // Frontend
  frontendUrl: string;
}

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
const config: Config = {
  // Server config
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  
  // Database config
  mongodb: {
    uri: process.env.MONGODB_URI!,
  },
  
  // Auth config
  jwt: {
    secret: process.env.JWT_SECRET!,
    expiresIn: process.env.JWT_EXPIRES_IN || '1d',
  },
  registrationSecret: process.env.REGISTRATION_SECRET!,
  
  // Jotform config
  jotform: {
    apiKey: process.env.JOTFORM_API_KEY!,
  },
    // Email config
  email: {
    user: process.env.GMAIL_USER!,
    password: process.env.GMAIL_PASSWORD!,
    fromEmail: process.env.FROM_EMAIL!,
    fromName: process.env.FROM_NAME!,
  },
  // Frontend URL
  frontendUrl: process.env.FRONTEND_URL || 'http://localhost:3000',
};

export default config;