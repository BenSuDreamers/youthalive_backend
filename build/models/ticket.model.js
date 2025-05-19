"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
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
    },
    youthMinistry: {
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
// Create and export the Ticket model
const Ticket = (0, mongoose_1.model)('Ticket', ticketSchema);
exports.default = Ticket;
//# sourceMappingURL=ticket.model.js.map