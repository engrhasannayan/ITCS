// server/controllers/assignmentsController.js
import { Assignment } from '../models/Assignment.js';
import { Ticket } from '../models/Ticket.js';

export async function createAssignment(req, res, next) {
  try {
    const { ticketId, technician, priority = 'medium', dueDate, notes } = req.body || {};
    if (!ticketId || !technician) {
      return res.status(400).json({ message: 'ticketId and technician are required' });
    }

    const ticket = await Ticket.findById(ticketId);
    if (!ticket) return res.status(404).json({ message: 'Ticket not found' });

    const assignment = await Assignment.create({ ticketId, technician, priority, dueDate, notes });

    // Update ticket status + history
    ticket.status = 'assigned';
    ticket.history.push({ action: 'assigned', by: technician, notes: `Assigned (priority: ${priority})` });
    await ticket.save();

    res.status(201).json({ assignment, ticket });
  } catch (err) {
    next(err);
  }
}
