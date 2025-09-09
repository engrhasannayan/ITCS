// server/routes/auth.js
import { Router } from 'express';
import {
  register,
  login,
  refresh,
  logout,
  me,
  requireAuth,
} from '../controllers/authController.js';

export const authRouter = Router();

/* ───────── Preferred endpoints ───────── */
authRouter.post('/auth/register', register);
authRouter.post('/auth/login',    login);
authRouter.post('/auth/refresh',  refresh);
authRouter.post('/auth/logout',   logout);
authRouter.get('/auth/me',        requireAuth, me);

/* ───────── Aliases for older/front-end calls ─────────
   These make the API tolerant if the client calls /api/register, etc. */
authRouter.post('/register', register);
authRouter.post('/login',    login);
authRouter.post('/refresh',  refresh);
authRouter.post('/logout',   logout);
authRouter.get('/me',        requireAuth, me);
