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
exports.lookupTicket = exports.checkIn = exports.searchGuests = void 0;
const ticket_model_1 = require("../models/ticket.model");
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
        const tickets = yield ticket_model_1.Ticket.find(searchCriteria)
            .sort({ name: 1 })
            .limit(50); // Limit results to prevent large queries    // Return results
        res.status(200).json({
            success: true,
            count: tickets.length, data: tickets.map((ticket) => ({
                id: ticket._id,
                invoiceNo: ticket.invoiceNo,
                name: ticket.name,
                email: ticket.email,
                quantity: ticket.quantity,
                productDetails: ticket.productDetails,
                totalAmount: ticket.totalAmount,
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
    var _a;
    try {
        const { ticketId, invoiceNo, eventId } = req.body;
        // Validate that at least one identifier is provided
        if (!ticketId && !invoiceNo) {
            res.status(400).json({
                success: false,
                message: 'Ticket ID or invoice number is required',
            });
            return;
        }
        // Build query for optimized database lookup
        let query = {};
        if (ticketId) {
            // Ensure valid MongoDB ID
            if (!mongoose_1.Types.ObjectId.isValid(ticketId)) {
                res.status(400).json({
                    success: false,
                    message: 'Invalid ticket ID format',
                });
                return;
            }
            query._id = ticketId;
        }
        else {
            // Clean invoice number to match database format
            let cleanInvoiceNo = invoiceNo;
            if (typeof cleanInvoiceNo === 'string') {
                if (cleanInvoiceNo.startsWith('# INV-')) {
                    cleanInvoiceNo = cleanInvoiceNo.substring(6);
                }
                else if (cleanInvoiceNo.startsWith('INV-')) {
                    cleanInvoiceNo = cleanInvoiceNo.substring(4);
                }
                else if (cleanInvoiceNo.startsWith('# ')) {
                    cleanInvoiceNo = cleanInvoiceNo.substring(2);
                }
            }
            query.invoiceNo = cleanInvoiceNo;
        }
        // Add event filter if provided
        if (eventId) {
            query.event = eventId;
        }
        // Use findOneAndUpdate for atomic operation to prevent race conditions
        const ticket = yield ticket_model_1.Ticket.findOneAndUpdate(Object.assign(Object.assign({}, query), { checkedIn: { $ne: true } }), // Only update if not already checked in
        {
            checkedIn: true,
            checkInTime: new Date(),
        }, {
            new: true, // Return the updated document
            runValidators: true, // Run schema validators
        });
        // Check if ticket exists and was updated
        if (!ticket) {
            // Check if ticket exists but is already checked in
            const existingTicket = yield ticket_model_1.Ticket.findOne(query);
            if (existingTicket) {
                if (existingTicket.checkedIn) {
                    res.status(400).json({
                        success: false,
                        message: `${existingTicket.name} has already been checked in at ${(_a = existingTicket.checkInTime) === null || _a === void 0 ? void 0 : _a.toLocaleString()}`,
                    });
                    return;
                }
            }
            const message = eventId
                ? 'Ticket not found for this event. This QR code may be for a different event.'
                : 'Ticket not found';
            res.status(404).json({
                success: false,
                message,
            });
            return;
        }
        // Log successful check-in for monitoring
        logger_1.default.info('Guest checked in successfully', {
            invoiceNo: ticket.invoiceNo,
            name: ticket.name,
            checkInTime: ticket.checkInTime
        });
        // Return updated ticket
        res.status(200).json({
            success: true,
            message: `Welcome ${ticket.name}! Check-in successful.`,
            data: {
                id: ticket._id,
                invoiceNo: ticket.invoiceNo,
                name: ticket.name,
                email: ticket.email,
                quantity: ticket.quantity,
                productDetails: ticket.productDetails,
                totalAmount: ticket.totalAmount,
                checkedIn: ticket.checkedIn,
                checkInTime: ticket.checkInTime,
            },
        });
    }
    catch (error) {
        logger_1.default.error('Error checking in guest', { error, body: req.body });
        res.status(500).json({
            success: false,
            message: 'Error checking in guest. Please try again.',
        });
    }
});
exports.checkIn = checkIn;
/**
 * Get ticket details by invoice number without checking in
 * @route POST /api/checkin/lookup
 */
const lookupTicket = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { invoiceNo, eventId } = req.body;
        // Validate required fields
        if (!invoiceNo) {
            res.status(400).json({
                success: false,
                message: 'Invoice number is required',
            });
            return;
        }
        // Clean invoice number to match database format
        let cleanInvoiceNo = invoiceNo;
        if (typeof cleanInvoiceNo === 'string') {
            if (cleanInvoiceNo.startsWith('# INV-')) {
                cleanInvoiceNo = cleanInvoiceNo.substring(6);
            }
            else if (cleanInvoiceNo.startsWith('INV-')) {
                cleanInvoiceNo = cleanInvoiceNo.substring(4);
            }
            else if (cleanInvoiceNo.startsWith('# ')) {
                cleanInvoiceNo = cleanInvoiceNo.substring(2);
            }
        }
        // Create search criteria
        const searchCriteria = { invoiceNo: cleanInvoiceNo };
        // Filter by event if provided
        if (eventId) {
            searchCriteria.event = eventId;
        }
        // Find the ticket
        const ticket = yield ticket_model_1.Ticket.findOne(searchCriteria);
        // Check if ticket exists
        if (!ticket) {
            res.status(404).json({
                success: false,
                message: eventId
                    ? 'Ticket not found for this event. Please verify the QR code and event.'
                    : 'Ticket not found',
            });
            return;
        }
        // Return ticket details
        res.status(200).json({
            success: true,
            message: 'Ticket found',
            data: { id: ticket._id,
                invoiceNo: ticket.invoiceNo,
                name: ticket.name,
                email: ticket.email,
                phone: ticket.phone,
                church: ticket.church,
                quantity: ticket.quantity,
                productDetails: ticket.productDetails,
                totalAmount: ticket.totalAmount,
                checkedIn: ticket.checkedIn,
                checkInTime: ticket.checkInTime,
                event: ticket.event,
            },
        });
    }
    catch (error) {
        logger_1.default.error('Error looking up ticket', { error });
        res.status(500).json({
            success: false,
            message: 'Error looking up ticket',
        });
    }
});
exports.lookupTicket = lookupTicket;
//# sourceMappingURL=checkin.controller.js.map