import { Ticket } from '../models/Ticket.js';
import { DiagnosticReport } from '../models/DiagnosticReport.js';

export async function createDiagnostic(req, res, next) {
  try {
    const { ticketId, findings, parts = [], estimatedCost, estimatedTime, preparedBy } = req.body || {};
    if (!ticketId || !findings) return res.status(400).json({ message: 'ticketId and findings are required' });

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    const report = await DiagnosticReport.create({
      ticketId, findings, parts, estimatedCost, estimatedTime, preparedBy
    });

    ticket.status = 'diagnosing';
    ticket.history.push({ action: 'diagnosing', by: preparedBy, notes: 'Diagnostic started' });
    await ticket.save();

    res.status(201).json({ report, ticket });
  } catch (err) { next(err); }
}

export async function decisionDiagnostic(req, res, next) {
  try {
    const { id } = req.params;
    const { decision, decidedBy } = req.body || {};
    if (!decision || !['approve','reject'].includes(decision)) {
      return res.status(400).json({ message: "decision must be 'approve' or 'reject'" });
    }

    const report = await DiagnosticReport.findById(id);
    if (!report) return res.status(404).json({ message: 'Diagnostic report not found' });

    const ticket = await Ticket.findById(report.ticketId);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    report.status = decision === 'approve' ? 'approved' : 'rejected';
    await report.save();

    if (decision === 'approve') {
      ticket.status = 'approved';
      ticket.history.push({ action: 'approved', by: decidedBy, notes: 'Diagnostic approved' });
    } else {
      ticket.status = 'received'; // or keep diagnosing, your policy
      ticket.history.push({ action: 'rejected', by: decidedBy, notes: 'Diagnostic rejected' });
    }
    await ticket.save();

    res.json({ report, ticket });
  } catch (err) { next(err); }
}
