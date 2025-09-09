import { Router } from 'express';
import { createDiagnostic, decisionDiagnostic } from '../controllers/diagnosticsController.js';

export const diagnosticsRouter = Router();

diagnosticsRouter.post('/diagnose', createDiagnostic);
diagnosticsRouter.post('/diagnose/:id/decision', decisionDiagnostic);
