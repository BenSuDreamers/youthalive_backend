import express from 'express';
import { searchGuests, checkIn, lookupTicket } from '../controllers/checkin.controller';
import { authenticateJWT } from '../middlewares/auth.middleware';

const router = express.Router();

/**
 * @route GET /api/checkin/search
 * @desc Search for guests by name or email
 * @access Protected
 */
router.get('/search', authenticateJWT, searchGuests);

/**
 * @route POST /api/checkin/scan
 * @desc Check in a guest by ticket ID or invoice number
 * @access Protected
 */
router.post('/scan', authenticateJWT, checkIn);

/**
 * @route POST /api/checkin/lookup
 * @desc Look up ticket details without checking in
 * @access Protected
 */
router.post('/lookup', authenticateJWT, lookupTicket);

export default router;