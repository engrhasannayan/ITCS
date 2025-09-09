// server/routes/tickets.js
import { Router } from 'express';
import { receiveTicket, listTickets, getTicket } from '../controllers/ticketsController.js';

export const ticketsRouter = Router();

// POST /api/tickets/receive
ticketsRouter.post('/tickets/receive', receiveTicket);

// GET /api/tickets
ticketsRouter.get('/tickets', listTickets);

// GET /api/tickets/:id
ticketsRouter.get('/tickets/:id', getTicket);
