"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = require("mongoose");
// Event schema
const eventSchema = new mongoose_1.Schema({
    formId: {
        type: String,
        required: true,
        unique: true,
    },
    title: {
        type: String,
        required: true,
        trim: true,
    },
    startTime: {
        type: Date,
        required: true,
    },
    endTime: {
        type: Date,
        required: true,
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
// Update the updatedAt field on save
eventSchema.pre('save', function (next) {
    this.updatedAt = new Date();
    next();
});
// Create and export the Event model
const Event = (0, mongoose_1.model)('Event', eventSchema);
exports.default = Event;
//# sourceMappingURL=event.model.js.map