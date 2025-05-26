import { Request, Response } from 'express';
import { Ticket } from '../models/ticket.model';
import logger from '../utils/logger';

/**
 * Export tickets for an event as CSV
 * @route GET /api/export/tickets/:eventId
 */
export const exportTickets = async (req: Request, res: Response): Promise<void> => {
  try {
    const { eventId } = req.params;

    // Validate eventId
    if (!eventId) {
      res.status(400).json({
        success: false,
        message: 'Event ID is required',
      });
      return;
    }

    // Get all tickets for the event
    const tickets = await Ticket.find({ event: eventId })
      .populate('event', 'title')
      .sort({ name: 1 });

    // Transform data for CSV
    type TicketRow = {
      'Invoice Number': string;
      'Name': string;
      'Email': string;
      'Phone': string;
      'Church': string;
      'Youth Ministry': string;
      'Check-in Status': string;
      'Check-in Time': string;
      'Registration Date': string;
    };

    const csvData: TicketRow[] = tickets.map(ticket => ({
      'Invoice Number': ticket.invoiceNo,
      'Name': ticket.name || '',
      'Email': ticket.email || '',
      'Phone': ticket.phone || '',
      'Church': ticket.church || '',
      'Youth Ministry': ticket.youthMinistry || '',
      'Check-in Status': ticket.checkedIn ? 'Checked In' : 'Not Checked In',
      'Check-in Time': ticket.checkInTime ? new Date(ticket.checkInTime).toLocaleString() : '',
      'Registration Date': new Date(ticket.createdAt).toLocaleString()
    }));

    // Convert to CSV string
    const headers = Object.keys(csvData[0]) as (keyof TicketRow)[];
    const csv = [
      headers.join(','),
      ...csvData.map(row => headers.map(header => JSON.stringify(row[header])).join(','))
    ].join('\n');

    // Set response headers for CSV download
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=tickets-${eventId}-${new Date().toISOString()}.csv`);
    
    // Send CSV data
    res.send(csv);
  } catch (error) {
    logger.error('Error exporting tickets', { error });
    res.status(500).json({
      success: false,
      message: 'Error exporting tickets',
    });
  }
};
