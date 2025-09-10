import { Router } from 'express';
import { createDiagnostic, decisionDiagnostic, listDiagnostics } from '../controllers/diagnosticsController.js';

export const diagnosticsRouter = Router();

// Create diagnostic
diagnosticsRouter.post('/diagnose', createDiagnostic);

// Approve/Reject diagnostic
diagnosticsRouter.post('/diagnose/:id/decision', decisionDiagnostic);

// List diagnostics (optionally by ticketId)
diagnosticsRouter.get('/diagnose', listDiagnostics);
