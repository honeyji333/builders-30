const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_alta_builder_30';

/**
 * Authentication Middleware (Day 5 Deliverable)
 * Blocks unauthorized requests and verifies JWT tokens.
 * Returns 401 Unauthorized if token is missing or invalid.
 */
function authMiddleware(req, res, next) {
  // Extract token from Bearer Authorization header or cookie
  const authHeader = req.get('authorization') || '';
  const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/i);
  const token = req.cookies?.token || bearerMatch?.[1];

  if (!token) {
    return res.status(401).json({
      success: false,
      error: 'Authentication required: Token missing',
      code: 'UNAUTHORIZED'
    });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      error: 'Authentication failed: Invalid or expired token',
      code: 'INVALID_TOKEN'
    });
  }
}

/**
 * Optional Authentication Middleware
 * Populates req.user if token is present, but doesn't block requests if missing.
 */
function optionalAuth(req, res, next) {
  const authHeader = req.get('authorization') || '';
  const bearerMatch = authHeader.match(/^Bearer\s+(.+)$/i);
  const token = req.cookies?.token || bearerMatch?.[1];

  if (token) {
    try {
      const decoded = jwt.verify(token, JWT_SECRET);
      req.user = decoded;
    } catch (error) {
      // Ignore token errors for optional routes
    }
  }
  next();
}

module.exports = {
  authMiddleware,
  optionalAuth
};
