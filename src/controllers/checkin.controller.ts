import { Request, Response } from 'express';
import Ticket from '../models/ticket.model';
import logger from '../utils/logger';
import { Types } from 'mongoose';

/**
 * Search for guests by name or email
 * @route GET /api/checkin/search
 */
export const searchGuests = async (req: Request, res: Response): Promise<void> => {
  try {
    const { eventId, query } = req.query;

    // Validate required fields
    if (!eventId) {
      res.status(400).json({
        success: false,
        message: 'Event ID is required',
      });
      return;
    }

    // Create search criteria
    const searchCriteria: any = {
      event: eventId,
    };
    
    // Add name/email search if query is provided
    if (query) {
      const searchRegex = new RegExp(String(query), 'i');
      searchCriteria.$or = [
        { name: searchRegex },
        { email: searchRegex },
      ];
    }

    // Find tickets matching criteria
    const tickets = await Ticket.find(searchCriteria)
      .sort({ name: 1 })
      .limit(50); // Limit results to prevent large queries

    // Return results
    res.status(200).json({
      success: true,
      count: tickets.length,
      data: tickets.map(ticket => ({
        id: ticket._id,
        invoiceNo: ticket.invoiceNo,
        name: ticket.name,
        email: ticket.email,
        checkedIn: ticket.checkedIn,
        checkInTime: ticket.checkInTime,
      })),
    });
  } catch (error) {
    logger.error('Error searching guests', { error });
    res.status(500).json({
      success: false,
      message: 'Error searching guests',
    });
  }
};

/**
 * Check in a guest by ticket ID or invoice number
 * @route POST /api/checkin/scan
 */
export const checkIn = async (req: Request, res: Response): Promise<void> => {
  try {
    const { ticketId, invoiceNo } = req.body;

    // Validate that at least one identifier is provided
    if (!ticketId && !invoiceNo) {
      res.status(400).json({
        success: false,
        message: 'Ticket ID or invoice number is required',
      });
      return;
    }

    // Find the ticket by ID or invoice number
    let ticket;
    if (ticketId) {
      // Ensure valid MongoDB ID
      if (!Types.ObjectId.isValid(ticketId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid ticket ID format',
        });
        return;
      }
      ticket = await Ticket.findById(ticketId);
    } else {
      ticket = await Ticket.findOne({ invoiceNo });
    }

    // Check if ticket exists
    if (!ticket) {
      res.status(404).json({
        success: false,
        message: 'Ticket not found',
      });
      return;
    }

    // Update check-in status
    ticket.checkedIn = true;
    ticket.checkInTime = new Date();
    await ticket.save();

    // Return updated ticket
    res.status(200).json({
      success: true,
      message: 'Check-in successful',
      data: {
        id: ticket._id,
        invoiceNo: ticket.invoiceNo,
        name: ticket.name,
        email: ticket.email,
        checkedIn: ticket.checkedIn,
        checkInTime: ticket.checkInTime,
      },
    });
  } catch (error) {
    logger.error('Error checking in guest', { error });
    res.status(500).json({
      success: false,
      message: 'Error checking in guest',
    });
  }
};