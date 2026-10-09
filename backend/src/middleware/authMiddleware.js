const prisma = require('../config/db');
const { verifyToken } = require('../utils/jwt');

/**
 * Authentication Middleware: Protects endpoints by verifying JWT token
 */
const authenticate = async (req, res, next) => {
  try {
    let token;

    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Access denied. No authentication token provided.',
      });
    }

    // Verify token
    const decoded = verifyToken(token);

    // Fetch user from database
    const user = await prisma.user.findUnique({
      where: { id: decoded.userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        collegeId: true,
        phone: true,
        avatar: true,
        campus: true,
        bio: true,
        isVerified: true,
      },
    });

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'The user belonging to this token no longer exists.',
      });
    }

    // Attach user to request object
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: 'Invalid or expired authentication token. Please log in again.',
      error: error.message,
    });
  }
};

/**
 * Optional Authentication: Attaches user if token is present, but doesn't block if missing
 */
const optionalAuth = async (req, res, next) => {
  try {
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith('Bearer ')
    ) {
      const token = req.headers.authorization.split(' ')[1];
      const decoded = verifyToken(token);
      const user = await prisma.user.findUnique({
        where: { id: decoded.userId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          avatar: true,
        },
      });
      if (user) req.user = user;
    }
    next();
  } catch (err) {
    // Continue as guest
    next();
  }
};

/**
 * Admin Authorization Middleware: Ensures only users with role === 'ADMIN' can access
 */
const authorizeAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'ADMIN') {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Requires Campus Administrator privileges.',
    });
  }
  next();
};

module.exports = {
  authenticate,
  authenticateUser: authenticate,
  authorizeAdmin,
  optionalAuth,
};
