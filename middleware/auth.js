const jwt = require('jsonwebtoken');
const ApiError = require('../utils/ApiError');

const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || '';
if (!ADMIN_PASSWORD) {
  console.error('FATAL: ADMIN_PASSWORD environment variable is not set. Admin login will be disabled.');
}
if (!process.env.JWT_SECRET && !ADMIN_PASSWORD) {
  console.error('FATAL: Neither JWT_SECRET nor ADMIN_PASSWORD is set. Server cannot secure admin sessions.');
}
const JWT_SECRET = process.env.JWT_SECRET || (ADMIN_PASSWORD ? require('crypto').createHash('sha256').update(ADMIN_PASSWORD).digest('hex') : '');
const SESSION_DURATION = '24h';

const COOKIE_NAME = 'admin_session';

function generateSession() {
  return jwt.sign({ role: 'admin', ts: Date.now() }, JWT_SECRET, { expiresIn: SESSION_DURATION });
}

const authenticate = (req, res, next) => {
  try {
    const token = req.cookies[COOKIE_NAME];
    if (!token) return next(ApiError.notFound());

    const decoded = jwt.verify(token, JWT_SECRET);
    if (!decoded || decoded.role !== 'admin') return next(ApiError.notFound());

    req.isAdmin = true;
    next();
  } catch {
    return next(ApiError.notFound());
  }
};

const requireAdmin = (req, res, next) => {
  if (!req.isAdmin) return next(ApiError.notFound());
  next();
};

const optionalAuth = (req, res, next) => {
  next();
};

module.exports = { authenticate, requireAdmin, optionalAuth, generateSession, COOKIE_NAME };
