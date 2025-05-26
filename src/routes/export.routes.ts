import express from 'express';
import { exportTickets } from '../controllers/export.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';

const router = express.Router();

/**
 * @route GET /api/export/tickets/:eventId
 * @desc Export tickets for an event as CSV
 * @access Protected
 */
router.get('/tickets/:eventId', authenticateJWT, exportTickets);

export default router;
