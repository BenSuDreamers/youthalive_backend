import { Request, Response } from 'express';
import bcrypt from 'bcrypt';
import { getLiveEvents, parseWebhook } from '../services/jotform.service';
import { generateQrCode } from '../services/qr.service';
import { emailService } from '../services/email.service';
import { Event } from '../models/event.model';
import { User } from '../models/user.model';
import { Ticket } from '../models/ticket.model';
import logger from '../utils/logger';

/**
 * Get all live events
 * @route GET /api/events
 */
export const listEvents = async (req: Request, res: Response): Promise<void> => {
  try {
    // Get events from Jotform API
    const jotformEvents = await getLiveEvents();    // Ensure all events exist in our database
    for (const jotformEvent of jotformEvents) {
      // Additional validation before saving to database
      const startTime = jotformEvent.startTime && !isNaN(jotformEvent.startTime.getTime()) 
        ? jotformEvent.startTime 
        : new Date();
      
      const endTime = jotformEvent.endTime && !isNaN(jotformEvent.endTime.getTime()) 
        ? jotformEvent.endTime 
        : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);

      await Event.findOneAndUpdate(
        { formId: jotformEvent.formId },
        {
          formId: jotformEvent.formId,
          title: jotformEvent.title,
          startTime,
          endTime,
        },
        { upsert: true, new: true }
      );
    }

    // Get events from our database (with additional fields if needed)
    const events = await Event.find(
      { formId: { $in: jotformEvents.map(e => e.formId) } }
    ).sort({ startTime: 1 });

    // Return events
    res.status(200).json({
      success: true,
      count: events.length,
      data: events,
    });
  } catch (error) {
    logger.error('Error fetching events', { error });
    res.status(500).json({
      success: false,
      message: 'Error fetching events',
    });
  }
};

/**
 * Handle webhook from Jotform submissions
 * @route POST /api/events/webhook
 */
export const webhookHandler = async (req: Request, res: Response): Promise<void> => {
  try {
    // Log the entire request for debugging
    logger.info('Full webhook request details', { 
      headers: req.headers,
      body: req.body,
      query: req.query,
      params: req.params,
      method: req.method,
      url: req.url,
      rawBody: JSON.stringify(req.body)
    });
    
    logger.info('Received webhook payload', { body: req.body });

    // Parse the webhook data
    const submissionData = parseWebhook(req.body);
    logger.info('Parsed submission data', { submissionData });
    
    // Validate required fields
    if (!submissionData.email || !submissionData.formId || !submissionData.invoiceNo) {
      logger.warn('Missing required fields', { 
        email: submissionData.email,
        formId: submissionData.formId, 
        invoiceNo: submissionData.invoiceNo 
      });
      res.status(400).json({
        success: false,
        message: 'Invalid webhook data: missing required fields',
        received: { 
          email: submissionData.email,
          formId: submissionData.formId, 
          invoiceNo: submissionData.invoiceNo 
        }
      });
      return;
    }

    // Find or create the event
    let event = await Event.findOne({ formId: submissionData.formId });
    if (!event) {
      // Create a new event if it doesn't exist
      event = new Event({
        formId: submissionData.formId,
        title: submissionData.eventName || 'Youth Alive Event',
        startTime: new Date(),  // Default values
        endTime: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),  // 7 days from now
      });
      await event.save();
    }    // Find or create the user
    let user = await User.findOne({ email: submissionData.email });
    if (!user) {
      // Create a user with a random password (they can use password reset to set their own)
      const bcrypt = require('bcrypt');
      const tempPassword = Math.random().toString(36).slice(-8);
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(tempPassword, saltRounds);
      
      user = new User({
        email: submissionData.email,
        passwordHash: hashedPassword,
      });
      await user.save();
      
      logger.info('Created new user for ticket', { 
        email: submissionData.email, 
        tempPassword: tempPassword // Log temp password for debugging (remove in production)
      });
    }    // Check if ticket already exists
    let ticket = await Ticket.findOne({ invoiceNo: submissionData.invoiceNo });
    if (!ticket) {      // Create a new ticket      
      ticket = new Ticket({
        invoiceNo: submissionData.invoiceNo,
        user: user._id,
        event: event._id,
        name: submissionData.name,
        email: submissionData.email,
        phone: submissionData.phone,
        church: submissionData.church,
        youthMinistry: submissionData.youthMinistry,
        quantity: submissionData.quantity || 1,
        productDetails: submissionData.productDetails,
        totalAmount: submissionData.totalAmount,
        eventDate: submissionData.eventDate, // Save the full event date
        chooseYour: submissionData.chooseYour // Save the parsed day selection
      });
      await ticket.save();      
      
      logger.info('Created new ticket with complete data', { 
        invoiceNo: ticket.invoiceNo,
        eventDate: ticket.eventDate,
        chooseYour: ticket.chooseYour
      });

      // Generate QR code
      const qrDataUrl = await generateQrCode(submissionData.invoiceNo);

      // Send confirmation email with QR code
      await emailService.sendTicketEmail({
        to: submissionData.email,
        name: submissionData.name,
        eventTitle: event.title,
        eventDate: submissionData.eventDate || event.startTime.toLocaleDateString(),
        invoiceNo: submissionData.invoiceNo,
        qrDataUrl: qrDataUrl,
        chooseYour: submissionData.chooseYour
      });
    }

    // Return success response
    res.status(200).json({
      success: true,
      message: 'Webhook processed successfully',
      ticketId: ticket._id,
    });
  } catch (error) {
    logger.error('Error processing webhook', { error });
    res.status(500).json({
      success: false,
      message: 'Error processing webhook',
    });
  }
};