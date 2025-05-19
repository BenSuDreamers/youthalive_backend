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
exports.checkIn = exports.searchGuests = void 0;
const ticket_model_1 = __importDefault(require("../models/ticket.model"));
const logger_1 = __importDefault(require("../utils/logger"));
const mongoose_1 = require("mongoose");
/**
 * Search for guests by name or email
 * @route GET /api/checkin/search
 */
const searchGuests = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
        const searchCriteria = {
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
        const tickets = yield ticket_model_1.default.find(searchCriteria)
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
    }
    catch (error) {
        logger_1.default.error('Error searching guests', { error });
        res.status(500).json({
            success: false,
            message: 'Error searching guests',
        });
    }
});
exports.searchGuests = searchGuests;
/**
 * Check in a guest by ticket ID or invoice number
 * @route POST /api/checkin/scan
 */
const checkIn = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
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
            if (!mongoose_1.Types.ObjectId.isValid(ticketId)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid ticket ID format',
                });
                return;
            }
            ticket = yield ticket_model_1.default.findById(ticketId);
        }
        else {
            ticket = yield ticket_model_1.default.findOne({ invoiceNo });
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
        yield ticket.save();
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
    }
    catch (error) {
        logger_1.default.error('Error checking in guest', { error });
        res.status(500).json({
            success: false,
            message: 'Error checking in guest',
        });
    }
});
exports.checkIn = checkIn;
//# sourceMappingURL=checkin.controller.js.map