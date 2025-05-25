import express from 'express';
import { webhookHandler } from '../controllers/event.controller';

const router = express.Router();

// Jotform webhook endpoint (no auth required)
router.post('/jotform', webhookHandler);

export default router;