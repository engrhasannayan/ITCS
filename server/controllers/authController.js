import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { User } from '../models/User.js';
import { RefreshSession } from '../models/RefreshSession.js';

const ACCESS_SECRET  = process.env.JWT_ACCESS_SECRET;
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET;
const ACCESS_TTL     = process.env.ACCESS_TOKEN_TTL  || '15m';
const REFRESH_TTL    = process.env.REFRESH_TOKEN_TTL || '7d';

// sign short-lived access token
function signAccessToken(user) {
  return jwt.sign(
    { sub: user._id.toString(), name: user.fullName, email: user.email, role: user.role },
    ACCESS_SECRET,
    { expiresIn: ACCESS_TTL }
  );
}

// create a random refresh token string (not JWT)
function createRefreshTokenString() {
  return crypto.randomBytes(48).toString('hex'); // 96 chars
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function ttlToMs(ttl) {
  // supports 15m, 7d, 24h etc.
  const m = /^(\d+)([smhd])$/.exec(ttl);
  if (!m) return 7 * 24 * 60 * 60 * 1000;
  const n = Number(m[1]);
  const unit = m[2];
  return unit === 's' ? n*1000 : unit === 'm' ? n*60*1000 : unit === 'h' ? n*3600*1000 : n*24*3600*1000;
}

function setRefreshCookie(res, token) {
  // httpOnly cookie
  res.cookie('itcs_refresh', token, {
    httpOnly: true,
    sameSite: 'Lax',      // change to 'None' with secure:true if frontend is on a different domain in prod
    secure: false,        // set true in production with HTTPS
    maxAge: ttlToMs(REFRESH_TTL),
    path: '/api/auth',    // limit cookie path to auth endpoints
  });
}

/* ----------------- Controllers ----------------- */

export async function register(req, res, next) {
  try {
    const { fullName, email, password } = req.body || {};
    if (!fullName || !email || !password) {
      return res.status(400).json({ message: 'fullName, email, password are required' });
    }
    const existing = await User.findOne({ email: email.toLowerCase() });
    if (existing) return res.status(409).json({ message: 'Email already registered' });

    const passwordHash = await bcrypt.hash(password, 10);
    const user = await User.create({ fullName, email: email.toLowerCase(), passwordHash, role: 'desk' });

    res.status(201).json({ message: 'Registered', user: { id: user._id, fullName: user.fullName, email: user.email }});
  } catch (err) { next(err); }
}

export async function login(req, res, next) {
  try {
    const { email, password } = req.body || {};
    if (!email || !password) return res.status(400).json({ message: 'email and password are required' });

    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) return res.status(401).json({ message: 'Invalid email or password' });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(401).json({ message: 'Invalid email or password' });

    const accessToken = signAccessToken(user);
    const rawRefresh  = createRefreshTokenString();
    const tokenHash   = hashToken(rawRefresh);
    const expiresAt   = new Date(Date.now() + ttlToMs(REFRESH_TTL));

    await RefreshSession.create({
      userId: user._id,
      tokenHash,
      expiresAt,
      userAgent: req.headers['user-agent'],
      ip: req.ip,
    });

    setRefreshCookie(res, rawRefresh);
    res.json({ accessToken, user: { id: user._id, fullName: user.fullName, email: user.email, role: user.role }});
  } catch (err) { next(err); }
}

export async function refresh(req, res, next) {
  try {
    const raw = req.cookies?.itcs_refresh;
    if (!raw) return res.status(401).json({ message: 'No refresh token' });

    const tokenHash = hashToken(raw);
    const session = await RefreshSession.findOne({ tokenHash });
    if (!session || session.expiresAt < new Date()) {
      return res.status(401).json({ message: 'Invalid refresh' });
    }
    const user = await User.findById(session.userId);
    if (!user) return res.status(401).json({ message: 'User not found' });

    // rotate refresh
    await RefreshSession.deleteOne({ _id: session._id });
    const newRaw = createRefreshTokenString();
    const newHash = hashToken(newRaw);
    const expiresAt = new Date(Date.now() + ttlToMs(REFRESH_TTL));
    await RefreshSession.create({ userId: user._id, tokenHash: newHash, expiresAt, userAgent: req.headers['user-agent'], ip: req.ip });

    setRefreshCookie(res, newRaw);
    const accessToken = signAccessToken(user);
    res.json({ accessToken });
  } catch (err) { next(err); }
}

export async function logout(req, res, next) {
  try {
    const raw = req.cookies?.itcs_refresh;
    if (raw) await RefreshSession.deleteOne({ tokenHash: hashToken(raw) });
    res.clearCookie('itcs_refresh', { path: '/api/auth' });
    res.json({ message: 'Logged out' });
  } catch (err) { next(err); }
}

export function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || '';
    const token = header.startsWith('Bearer ') ? header.slice(7) : null;
    if (!token) return res.status(401).json({ message: 'Missing access token' });
    const payload = jwt.verify(token, ACCESS_SECRET);
    req.user = { id: payload.sub, email: payload.email, name: payload.name, role: payload.role };
    next();
  } catch {
    return res.status(401).json({ message: 'Invalid/expired token' });
  }
}

export async function me(req, res) {
  res.json({ user: req.user });
}
