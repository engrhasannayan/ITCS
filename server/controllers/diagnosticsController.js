import mongoose from 'mongoose';
import { Ticket } from '../models/Ticket.js';
import { DiagnosticReport } from '../models/DiagnosticReport.js';

/** Resolve a ticket from either Mongo _id or human-readable ticketNo */
async function resolveTicket(ref) {
  if (!ref) return null;

  // If it looks like an ObjectId, try by _id first
  if (mongoose.Types.ObjectId.isValid(ref)) {
    const byId = await Ticket.findById(ref);
    if (byId) return byId;
  }

  // Fallback: treat as ticketNo (e.g., "ITCS-2025-0001")
  const byNo = await Ticket.findOne({ ticketNo: ref });
  return byNo;
}

/**
 * POST /api/diagnose
 * Accepts either:
 *   - { ticketId: '<MongoId>', ... }
 *   - { ticketNo: 'ITCS-2025-0001', ... }
 *   - { ticket: '<either id or no>', ... }
 * Body: { ticketId|ticketNo|ticket, findings, partsNeeded[], estimatedCost, estimatedTime, preparedBy }
 * Effect: create report, set ticket.status = 'diagnosing', push history
 */
export async function createDiagnostic(req, res, next) {
  try {
    const {
      ticketId,
      ticketNo,
      ticket, // generic field if you prefer
      findings,
      partsNeeded = [],
      estimatedCost,
      estimatedTime,
      preparedBy,
    } = req.body;

    const ref = ticket ?? ticketId ?? ticketNo;
    if (!ref || !findings) {
      const err = new Error('ticket (id or number) and findings are required');
      err.status = 400;
      throw err;
    }

    const t = await resolveTicket(ref);
    if (!t) {
      const err = new Error('Ticket not found');
      err.status = 404;
      throw err;
    }

    const report = new DiagnosticReport({
      ticketId: t._id, // always store the ObjectId
      findings,
      partsNeeded,
      estimatedCost,
      estimatedTime,
      preparedBy,
      status: 'proposed',
    });
    await report.save();

    t.status = 'diagnosing';
    t.history.push({
      action: 'diagnosing',
      by: preparedBy || 'system',
      notes: 'Diagnostic created',
    });
    await t.save();

    res.json(report);
  } catch (err) {
    next(err);
  }
}

/**
 * POST /api/diagnose/:id/decision
 * Body: { decision: 'approve' | 'reject', decidedBy }
 * Effect: update report.status, update ticket.status + history
 */
export async function decisionDiagnostic(req, res, next) {
  try {
    const { id } = req.params;
    const { decision, decidedBy } = req.body;

    if (!id || !decision) {
      const err = new Error('id and decision are required');
      err.status = 400;
      throw err;
    }
    if (!['approve', 'reject'].includes(decision)) {
      const err = new Error('decision must be approve or reject');
      err.status = 400;
      throw err;
    }

    const report = await DiagnosticReport.findById(id);
    if (!report) {
      const err = new Error('Diagnostic report not found');
      err.status = 404;
      throw err;
    }

    const ticket = await Ticket.findById(report.ticketId);
    if (!ticket) {
      const err = new Error('Parent ticket not found');
      err.status = 404;
      throw err;
    }

    report.status = decision === 'approve' ? 'approved' : 'rejected';
    await report.save();

    if (decision === 'approve') {
      ticket.status = 'approved';
      ticket.history.push({
        action: 'approved',
        by: decidedBy || 'system',
        notes: 'Diagnostic approved',
      });
    } else {
      // Policy: send back to received (or keep diagnosing if you prefer)
      ticket.status = 'received';
      ticket.history.push({
        action: 'rejected',
        by: decidedBy || 'system',
        notes: 'Diagnostic rejected',
      });
    }
    await ticket.save();

    res.json({ report, ticket });
  } catch (err) {
    next(err);
  }
}

/**
 * GET /api/diagnose?ticket=<idOrNo> OR &ticketId=... OR &ticketNo=...
 * returns { items: DiagnosticReport[] }
 */
export async function listDiagnostics(req, res, next) {
  try {
    const { ticket: generic, ticketId, ticketNo } = req.query;
    const ref = generic ?? ticketId ?? ticketNo;

    let filter = {};
    if (ref) {
      const t = await resolveTicket(ref);
      if (!t) return res.json({ items: [] }); // unknown ticket reference
      filter.ticketId = t._id;
    }

    const reports = await DiagnosticReport.find(filter)
      .sort({ createdAt: -1 })
      .lean();
    res.json({ items: reports });
  } catch (err) {
    next(err);
  }
}
