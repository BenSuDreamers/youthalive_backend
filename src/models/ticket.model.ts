import { Schema, model, Document, Model, Types } from 'mongoose';
import { IUser } from './user.model';
import { IEvent } from './event.model';

// Ticket interface
export interface ITicket extends Document {
  invoiceNo: string;
  checkedIn: boolean;
  user: Types.ObjectId | IUser;
  event: Types.ObjectId | IEvent;
  name?: string;
  email?: string;
  phone?: string;
  church?: string;
  youthMinistry?: string;
  quantity?: number;
  productDetails?: string;
  totalAmount?: number;
  eventDate?: string;  // Added for Stadium 25 Friday/Saturday selection
  chooseYour?: string; // Added for parsed day selection
  checkInTime?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Ticket schema
const ticketSchema = new Schema<ITicket>({
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
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  event: {
    type: Schema.Types.ObjectId,
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
  },  youthMinistry: {
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
ticketSchema.pre('save', function(next) {
  this.updatedAt = new Date();
  if (this.isModified('checkedIn') && this.checkedIn) {
    this.checkInTime = new Date();
  }
  next();
});

// Create and export the Ticket model
const Ticket: Model<ITicket> = model<ITicket>('Ticket', ticketSchema);

// Export the model and interface
export { Ticket };