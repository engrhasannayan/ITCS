// server/server.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';

import { connectDB } from './db/mongoose.js';
import { authRouter } from './routes/auth.js';
import { ticketsRouter } from './routes/tickets.js';
import { assignmentsRouter } from './routes/assignments.js';
import { diagnosticsRouter } from './routes/diagnostics.js';

const app = express();

const PORT = process.env.PORT || 4000;
const MONGODB_URI = process.env.MONGODB_URI;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:4200';

app.set('trust proxy', 1);

app.use(cors({ origin: CORS_ORIGIN, credentials: true }));
app.use(express.json({ limit: '1mb' }));
app.use(cookieParser());

app.get('/api/health', (_req, res) => res.json({ ok: true, time: new Date().toISOString() }));

// ✅ Mount routers (order matters)
app.use('/api', authRouter);
app.use('/api', ticketsRouter);
app.use('/api', assignmentsRouter);
app.use('/api', diagnosticsRouter);

// ❗ Keep this LAST
app.use('/api', (_req, res) => res.status(404).json({ message: 'API route not found' }));

// Error handler
app.use((err, _req, res, _next) => {
  console.error('❌', err);
  res.status(err.status || 500).json({ message: err.message || 'Internal Server Error' });
});

connectDB(MONGODB_URI).then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 API on http://localhost:${PORT}`);
    console.log(`✅ CORS origin: ${CORS_ORIGIN}`);
  });
}).catch(e => {
  console.error('Mongo connect failed:', e);
  process.exit(1);
});

export default app;
