"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Ticket = void 0;
const mongoose_1 = require("mongoose");
// Ticket schema
const ticketSchema = new mongoose_1.Schema({
    invoiceNo: {
        type: String,
        required: true,
        unique: true,
        trim: true,
    },
    checkedIn: {
        type: Boolean,
        default: false,
    },
    user: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    event: {
        type: mongoose_1.Schema.Types.ObjectId,
        ref: 'Event',
        required: true,
    },
    name: {
        type: String,
        trim: true,
    },
    email: {
        type: String,
        trim: true,
        lowercase: true,
    },
    phone: {
        type: String,
        trim: true,
    },
    church: {
        type: String,
        trim: true,
    }, youthMinistry: {
        type: String,
        trim: true,
    },
    quantity: {
        type: Number,
        min: 1,
        default: 1,
    },
    productDetails: {
        type: String,
        trim: true,
    },
    totalAmount: {
        type: Number,
        min: 0,
    },
    eventDate: {
        type: String,
        trim: true,
    },
    chooseYour: {
        type: String,
        trim: true,
    },
    checkInTime: {
        type: Date,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
    updatedAt: {
        type: Date,
        default: Date.now,
    },
});
// Update the updatedAt field and set checkInTime when checked in
ticketSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    if (this.isModified('checkedIn') && this.checkedIn) {
        this.checkInTime = new Date();
    }
    next();
});
// Add indexes for high-performance queries during check-in events
ticketSchema.index({ event: 1, checkedIn: 1 }); // Event-specific check-in queries
ticketSchema.index({ event: 1, email: 1 }); // Guest search by email within event
ticketSchema.index({ event: 1, name: 1 }); // Guest search by name within event
ticketSchema.index({ checkedIn: 1, checkInTime: 1 }); // Check-in status tracking
ticketSchema.index({ createdAt: 1 }); // Time-based queries for analytics
// Create and export the Ticket model
const Ticket = (0, mongoose_1.model)('Ticket', ticketSchema);
exports.Ticket = Ticket;
//# sourceMappingURL=ticket.model.js.map