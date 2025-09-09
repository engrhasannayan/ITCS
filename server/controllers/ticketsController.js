// server/controllers/ticketsController.js
import { Ticket } from '../models/Ticket.js';
import { nextSequence } from '../models/Counter.js';

function pad6(n) { return String(n).padStart(6, '0'); }

export async function receiveTicket(req, res, next) {
  try {
    const {
      department, ownerName, contactPhone,
      deviceType, deviceBrand, deviceModel, deviceSerial, accessories,
      problemSummary, receivedBy
    } = req.body || {};

    if (!department || !ownerName || !deviceType || !problemSummary) {
      return res.status(400).json({ message: 'Missing required fields (department, ownerName, deviceType, problemSummary).' });
    }

    // Generate human ticket number
    const seq = await nextSequence(`ticket-${new Date().getFullYear()}`);
    const ticketNo = `ITCS-${new Date().getFullYear()}-${pad6(seq)}`;

    const ticket = await Ticket.create({
      ticketNo,
      department,
      ownerName,
      contactPhone,
      device: { type: deviceType, brand: deviceBrand, model: deviceModel, serial: deviceSerial, accessories },
      problemSummary,
      receivedBy,
      status: 'received',
      history: [{ action: 'received', by: receivedBy, notes: 'Ticket created' }],
    });

    return res.status(201).json(ticket);
  } catch (err) {
    next(err);
  }
}

export async function listTickets(req, res, next) {
  try {
    const { status, q, page = 1, limit = 10 } = req.query;
    const filter = {};
    if (status) filter.status = status;
    if (q) {
      filter.$or = [
        { ticketNo: new RegExp(q, 'i') },
        { department: new RegExp(q, 'i') },
        { ownerName: new RegExp(q, 'i') },
        { 'device.type': new RegExp(q, 'i') },
      ];
    }
    const pageNum = Math.max(1, parseInt(page));
    const size = Math.min(50, Math.max(1, parseInt(limit)));

    const [items, total] = await Promise.all([
      Ticket.find(filter).sort({ receivedAt: -1 }).skip((pageNum - 1) * size).limit(size),
      Ticket.countDocuments(filter),
    ]);

    res.json({ items, total, page: pageNum, limit: size });
  } catch (err) {
    next(err);
  }
}

export async function getTicket(req, res, next) {
  try {
    const { id } = req.params;
    const ticket = await Ticket.findById(id);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });
    res.json(ticket);
  } catch (err) {
    next(err);
  }
}
