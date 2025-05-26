import express from 'express';
import { webhookHandler } from '../controllers/event.controller';

const router = express.Router();

// Jotform webhook endpoint (no auth required)
router.post('/jotform', webhookHandler);

// MailerSend webhook endpoint to track email delivery status
router.post('/mailersend', (req, res) => {
  try {
    console.log('📧 MailerSend webhook received:', JSON.stringify(req.body, null, 2));
    
    // Process the webhook data
    const events = req.body;
    if (Array.isArray(events)) {
      events.forEach(event => {
        console.log(`📧 Email ${event.type}: ${event.email} - ${event.subject || 'N/A'}`);
        if (event.type === 'activity.sent') {
          console.log('✅ Email successfully sent!');
        } else if (event.type === 'activity.hard_bounced' || event.type === 'activity.soft_bounced') {
          console.log('❌ Email bounced:', event.reason);
        }
      });
    }
    
    res.status(200).json({ success: true });  } catch (error) {
    console.error('❌ MailerSend webhook error:', error);
    res.status(500).json({ success: false, error: error instanceof Error ? error.message : 'Unknown error' });
  }
});

export default router;