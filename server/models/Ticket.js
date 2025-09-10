// server/models/Ticket.js
import mongoose from 'mongoose';

const customerSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true },
    department: { type: String, trim: true },
    phone: { type: String, trim: true },
    email: { type: String, trim: true },
  },
  { _id: false }
);

const deviceSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['PC', 'Laptop', 'Printer', 'Other'], required: true },
    inventoryId: { type: String, required: true, trim: true, index: true, unique: true }, // NEW required + unique
    brand: String,
    model: String,
    serial: String,
    accessories: String,
  },
  { _id: false }
);

const historySchema = new mongoose.Schema(
  {
    at: { type: Date, default: Date.now },
    by: String,
    action: String,
    notes: String,
  },
  { _id: false }
);

const ticketSchema = new mongoose.Schema(
  {
    ticketNo: { type: String, required: true, unique: true, index: true },
    status: {
      type: String,
      enum: ['received','assigned','diagnosing','approved','in_service','ready','delivered','closed'],
      default: 'received',
      index: true,
    },
    problemSummary: { type: String, trim: true },
    customer: customerSchema,
    device: deviceSchema,
    receivedAt: { type: Date, default: Date.now, index: true },
    receivedBy: String,
    history: [historySchema],
  },
  { timestamps: true }
);

ticketSchema.index({ status: 1, receivedAt: -1 });

export const Ticket = mongoose.model('Ticket', ticketSchema);
