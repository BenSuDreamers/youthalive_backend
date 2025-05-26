import express from 'express';
import multer from 'multer';
import { webhookHandler } from '../controllers/event.controller';

const router = express.Router();
const upload = multer();

// Jotform webhook endpoint (no auth required, handles multipart/form-data)
router.post('/jotform', upload.none(), webhookHandler);

export default router;