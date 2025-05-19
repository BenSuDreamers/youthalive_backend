import express from 'express';
import { webhookHandler } from '../controllers/event.controller';

const router = express.Router();

/**
 * @route POST /api/webhooks
 * @desc Process webhooks from Jotform
 * @access Public
 */
router.post('/', webhookHandler);

export default router;
