// server/server.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

// keep installed if used elsewhere
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

import { connectDB } from './db/mongoose.js';
import { authRouter } from './routes/auth.js';
import { ticketsRouter } from './routes/tickets.js';
import { assignmentsRouter } from './routes/assignments.js';

const app = express();

/* ───── ENV ───── */
const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:4200';

app.set('trust proxy', 1);

/* ───── MIDDLEWARE ───── */
app.use(
  cors({
    origin: CORS_ORIGIN,
    credentials: true,       // allow cookies/Authorization across origins
  })
);
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

/* ───── HEALTH ───── */
app.get('/api/health', (req, res) => {
  res.json({ ok: true, time: new Date().toISOString() });
});

/* ───── ROUTES (order matters) ───── */
app.use('/api', authRouter);        // auth first
app.use('/api', ticketsRouter);
app.use('/api', assignmentsRouter);

/* ───── 404 for unknown /api routes (keep LAST) ───── */
app.use('/api', (req, res) => {
  res.status(404).json({ message: 'API route not found' });
});

/* ───── Error handler ───── */
app.use((err, req, res, next) => {
  console.error('❌', err);
  if (res.headersSent) return next(err);
  const status =
    err.status ||
    (err.name === 'ValidationError' ? 400 :
     err.name === 'CastError' ? 400 : 500);
  res.status(status).json({ message: err.message || 'Internal Server Error' });
});

/* ───── Start ───── */
connectDB(MONGODB_URI)
  .then(() => {
    app.listen(PORT, () => {
      console.log(`🚀 API on http://localhost:${PORT}`);
      console.log(`✅ CORS origin: ${CORS_ORIGIN}`);
    });
  })
  .catch((e) => {
    console.error('Mongo connect failed:', e);
    process.exit(1);
  });

export default app;
