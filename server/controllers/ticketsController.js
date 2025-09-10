// server/controllers/ticketsController.js
import mongoose from 'mongoose';
import { Ticket } from '../models/Ticket.js';
import { nextSequence } from '../models/Counter.js';

function pad(n, len = 4) { return String(n).padStart(len, '0'); }
function buildTicketNo(seq) { const y = new Date().getFullYear(); return `ITCS-${y}-${pad(seq, 4)}`; }

/**
 * POST /api/tickets/receive
 * Body: { customer:{...}, device:{ type, inventoryId, brand?, model?, serial?, accessories? }, problemSummary, receivedBy? }
 */
export async function receiveTicket(req, res, next) {
  try {
    const { customer = {}, device = {}, problemSummary = '', receivedBy = 'desk' } = req.body;

    if (!device?.type) {
      const err = new Error('device.type is required'); err.status = 400; throw err;
    }
    if (!device?.inventoryId) {
      const err = new Error('device.inventoryId is required'); err.status = 400; throw err;
    }
    if (!problemSummary || String(problemSummary).trim().length < 3) {
      const err = new Error('problemSummary is required'); err.status = 400; throw err;
    }

    const seq = await nextSequence('ticket');
    const ticketNo = buildTicketNo(seq);

    const ticket = new Ticket({
      ticketNo,
      status: 'received',
      problemSummary,
      customer,
      device,
      receivedBy,
      history: [{ action: 'received', by: receivedBy, notes: 'Item received at desk' }],
    });

    await ticket.save();
    res.status(201).json(ticket);
  } catch (err) { next(err); }
}

/** GET /api/tickets?status=&q=&page=&limit= */
export async function listTickets(req, res, next) {
  try {
    const { status, q, page = 1, limit = 20 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (q) {
      filter.$or = [
        { ticketNo: new RegExp(q, 'i') },
        { 'customer.name': new RegExp(q, 'i') },
        { 'customer.department': new RegExp(q, 'i') },
        { 'device.inventoryId': new RegExp(q, 'i') },
        { problemSummary: new RegExp(q, 'i') },
      ];
    }
    const skip = (Math.max(parseInt(page), 1) - 1) * Math.max(parseInt(limit), 1);
    const items = await Ticket.find(filter).sort({ receivedAt: -1 }).skip(skip).limit(parseInt(limit));
    const total = await Ticket.countDocuments(filter);
    res.json({ items, total, page: parseInt(page), limit: parseInt(limit) });
  } catch (err) { next(err); }
}

/** GET /api/tickets/:ref  (ObjectId or ticketNo) */
export async function getTicket(req, res, next) {
  try {
    const { ref } = req.params;
    let t = null;
    if (mongoose.Types.ObjectId.isValid(ref)) t = await Ticket.findById(ref);
    if (!t) t = await Ticket.findOne({ ticketNo: ref });
    if (!t) { const err = new Error('Ticket not found'); err.status = 404; throw err; }
    res.json(t);
  } catch (err) { next(err); }
}
