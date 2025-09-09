// server/models/Ticket.js
import mongoose from 'mongoose';

const deviceSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['PC', 'Laptop', 'Printer', 'Other'], required: true },
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
    by: String,           // optional: user name/id
    action: String,       // e.g., 'received', 'assigned', 'diagnosing', ...
    notes: String,
  },
  { _id: false }
);

const ticketSchema = new mongoose.Schema(
  {
    ticketNo: { type: String, unique: true, index: true }, // ITCS-YYYY-000001
    department: { type: String, required: true },
    ownerName: { type: String, required: true },
    contactPhone: String,
    device: { type: deviceSchema, required: true },
    problemSummary: { type: String, required: true },

    status: {
      type: String,
      enum: ['received', 'assigned', 'diagnosing', 'approved', 'in_service', 'ready', 'delivered', 'closed'],
      default: 'received',
      index: true,
    },

    receivedBy: String,
    receivedAt: { type: Date, default: Date.now },

    history: { type: [historySchema], default: [] },
  },
  { timestamps: true }
);

export const Ticket = mongoose.model('Ticket', ticketSchema);
