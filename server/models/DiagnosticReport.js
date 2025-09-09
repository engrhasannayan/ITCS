import mongoose from 'mongoose';

const partSchema = new mongoose.Schema(
  { name: String, qty: Number, estimatedCost: Number },
  { _id: false }
);

const diagnosticSchema = new mongoose.Schema(
  {
    ticketId:   { type: mongoose.Schema.Types.ObjectId, ref: 'Ticket', index: true, required: true },
    findings:   { type: String, required: true },
    parts:      { type: [partSchema], default: [] },
    estimatedCost: Number,
    estimatedTime: String,
    preparedBy: String,
    status:     { type: String, enum: ['proposed','approved','rejected'], default: 'proposed', index: true },
    preparedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

export const DiagnosticReport = mongoose.model('DiagnosticReport', diagnosticSchema);
