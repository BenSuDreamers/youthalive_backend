import express from 'express';
import { listEvents, webhookHandler } from '../controllers/event.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';

const router = express.Router();

/**
 * @route GET /api/events
 * @desc Get all live events
 * @access Protected
 */
router.get('/', authenticateJWT, listEvents);

/**
 * @route POST /api/events/webhook
 * @desc Handle webhook from Jotform
 * @access Public
 */
router.post('/webhook', webhookHandler);

export default router;