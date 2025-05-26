import express, { Request, Response, NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import multer from 'multer';
import config from './config';

// Import routes
import authRoutes from './routes/auth.routes';
import eventRoutes from './routes/event.routes';
import checkinRoutes from './routes/checkin.routes';
import webhookRoutes from './routes/webhook.routes';
import exportRoutes from './routes/export.routes';
import logger from './utils/logger';
import { errorHandler, notFoundHandler } from './middlewares/error.middleware';

// Initialize Express app
const app = express();

// Configure multer for multipart form data (used by Jotform webhooks)
const upload = multer();

// Apply middleware
app.use(helmet()); // Add security headers
app.use(cors({ origin: config.frontendUrl, credentials: true })); // Allow cross-origin requests from frontend
app.use(express.json()); // Parse JSON bodies
app.use(express.urlencoded({ extended: true })); // Parse URL-encoded bodies
app.use(morgan('combined')); // Log HTTP requests

// Health check endpoint
app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok', message: 'Server is running' });
});

// Import webhook controller for direct route
import { webhookHandler } from './controllers/event.controller';

// Direct Jotform webhook endpoint (handles multipart/form-data)
app.post('/jotform', upload.none(), webhookHandler);

// Mount API routes
app.use('/api/auth', authRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/checkin', checkinRoutes);
app.use('/api/export', exportRoutes); // Add export routes
app.use('/api/webhooks', webhookRoutes);

// Apply error handling middleware
app.use(notFoundHandler);
app.use(errorHandler);

export default app;