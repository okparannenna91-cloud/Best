const { clerkClient } = require('@clerk/clerk-sdk-node');
const User = require('../models/User');
const ApiError = require('../utils/ApiError');

async function verifyClerkSession(sessionToken) {
  const decoded = JSON.parse(Buffer.from(sessionToken.split('.')[1], 'base64url').toString());
  const sessionId = decoded.sid;
  if (!sessionId) return null;
  const session = await clerkClient.sessions.verifySession(sessionId, sessionToken);
  return session;
}

const authenticate = async (req, res, next) => {
  try {
    const sessionToken = req.cookies?.__session || req.headers?.authorization?.replace('Bearer ', '');

    if (!sessionToken) {
      return next(ApiError.unauthorized('No authentication token provided'));
    }

    const session = await verifyClerkSession(sessionToken);

    if (!session) {
      return next(ApiError.unauthorized('Invalid or expired session'));
    }

    const clerkUser = await clerkClient.users.getUser(session.userId);
    let user = await User.findOne({ clerkId: session.userId });

    if (!user) {
      user = await User.create({
        clerkId: session.userId,
        email: clerkUser.emailAddresses[0]?.emailAddress || '',
        firstName: clerkUser.firstName,
        lastName: clerkUser.lastName,
        avatar: clerkUser.imageUrl,
      });
    }

    req.user = user;
    req.clerkUserId = session.userId;
    next();
  } catch (error) {
    return next(ApiError.unauthorized('Authentication failed'));
  }
};

const optionalAuth = async (req, res, next) => {
  try {
    const sessionToken = req.cookies?.__session || req.headers?.authorization?.replace('Bearer ', '');
    if (!sessionToken) return next();

    const session = await verifyClerkSession(sessionToken);

    if (session) {
      const clerkUser = await clerkClient.users.getUser(session.userId);
      let user = await User.findOne({ clerkId: session.userId });
      if (!user) {
        user = await User.create({
          clerkId: session.userId,
          email: clerkUser.emailAddresses[0]?.emailAddress || '',
          firstName: clerkUser.firstName,
          lastName: clerkUser.lastName,
        });
      }
      req.user = user;
      req.clerkUserId = session.userId;
    }
  } catch (_) {
    // continue as guest
  }
  next();
};

const requireAdmin = (req, res, next) => {
  if (!req.user || !req.user.isAdmin) {
    return next(ApiError.forbidden('Admin access required'));
  }
  next();
};

module.exports = { authenticate, optionalAuth, requireAdmin };
