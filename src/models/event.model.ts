import { Schema, model, Document, Model } from 'mongoose';

// Event interface
export interface IEvent extends Document {
  formId: string;
  title: string;
  startTime: Date;
  endTime: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Event schema
const eventSchema = new Schema<IEvent>({
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
eventSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  next();
});

// Create and export the Event model
const Event: Model<IEvent> = model<IEvent>('Event', eventSchema);

export default Event;