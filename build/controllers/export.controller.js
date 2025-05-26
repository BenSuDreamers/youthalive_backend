"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.exportTickets = void 0;
const ticket_model_1 = require("../models/ticket.model");
const logger_1 = __importDefault(require("../utils/logger"));
/**
 * Export tickets for an event as CSV
 * @route GET /api/export/tickets/:eventId
 */
const exportTickets = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const tickets = yield ticket_model_1.Ticket.find({ event: eventId })
            .populate('event', 'title')
            .sort({ name: 1 });
        const csvData = tickets.map(ticket => ({
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
        const headers = Object.keys(csvData[0]);
        const csv = [
            headers.join(','),
            ...csvData.map(row => headers.map(header => JSON.stringify(row[header])).join(','))
        ].join('\n');
        // Set response headers for CSV download
        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename=tickets-${eventId}-${new Date().toISOString()}.csv`);
        // Send CSV data
        res.send(csv);
    }
    catch (error) {
        logger_1.default.error('Error exporting tickets', { error });
        res.status(500).json({
            success: false,
            message: 'Error exporting tickets',
        });
    }
});
exports.exportTickets = exportTickets;
//# sourceMappingURL=export.controller.js.map