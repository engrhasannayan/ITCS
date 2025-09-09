// server/models/Assignment.js
import mongoose from 'mongoose';

const assignmentSchema = new mongoose.Schema(
  {
    ticketId: { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', required: true, index: true },
    technician: { type: String, required: true },
    priority: { type: String, enum: ['low', 'medium', 'high', 'urgent'], default: 'medium', index: true },
    dueDate: Date,
    notes: String,
  },
  { timestamps: true }
);

export const Assignment = mongoose.model('Assignment', assignmentSchema);
