// server/routes/assignments.js
import { Router } from 'express';
import { createAssignment } from '../controllers/assignmentsController.js';

export const assignmentsRouter = Router();

// POST /api/assign
assignmentsRouter.post('/assign', createAssignment);
