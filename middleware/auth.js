const { clerkClient } = require('@clerk/clerk-sdk-node');
const ApiError = require('../utils/ApiError');

const ADMIN_USER_ID = process.env.CLERK_ADMIN_USER_ID || 'user_3F2Nq8Lyzx9fVq2qhQGsnv6Sjjd';

async function verifyClerkSession(sessionToken) {
  const decoded = JSON.parse(Buffer.from(sessionToken.split('.')[1], 'base64url').toString());
  const sessionId = decoded.sid;
  if (!sessionId) return null;
  const session = await clerkClient.sessions.verifySession(sessionId, sessionToken);
  return session;
}

function buildUser(clerkUser) {
  return {
    clerkId: clerkUser.id,
    email: clerkUser.emailAddresses?.[0]?.emailAddress || '',
    firstName: clerkUser.firstName,
    lastName: clerkUser.lastName,
    avatar: clerkUser.imageUrl,
    isAdmin: clerkUser.id === ADMIN_USER_ID,
  };
}

const authenticate = async (req, res, next) => {
  try {
    const sessionToken = req.cookies?.__session || req.headers?.authorization?.replace('Bearer ', '');

    if (!sessionToken) {
      return next(ApiError.notFound());
    }

    const session = await verifyClerkSession(sessionToken);

    if (!session) {
      return next(ApiError.notFound());
    }

    const clerkUser = await clerkClient.users.getUser(session.userId);

    req.user = buildUser(clerkUser);
    req.clerkUserId = session.userId;
    next();
  } catch (error) {
    return next(ApiError.notFound());
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const sessionToken = req.cookies?.__session || req.headers?.authorization?.replace('Bearer ', '');
    if (!sessionToken) return next();

    const session = await verifyClerkSession(sessionToken);

    if (session) {
      const clerkUser = await clerkClient.users.getUser(session.userId);
      req.user = buildUser(clerkUser);
      req.clerkUserId = session.userId;
    }
  } catch (_) {
    // continue as guest
  }
  next();
};

const requireAdmin = (req, res, next) => {
  if (!req.user || req.clerkUserId !== ADMIN_USER_ID) {
    return next(ApiError.notFound());
  }
  next();
};

module.exports = { authenticate, optionalAuth, requireAdmin };
