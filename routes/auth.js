const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../db/init');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_alta_builder_30';

// Cookie options for secure session handling
const cookieOptions = {
  httpOnly: true,
  maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  sameSite: 'lax',
  secure: process.env.NODE_ENV === 'production',
  path: '/'
};

// Email validation regex (RFC 5322 pattern)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,24}$/;

/**
 * POST /api/auth/register (or /signup)
 * Day 4: User registration with input validation & bcrypt hashing
 */
router.post(['/register', '/signup'], async (req, res) => {
  try {
    const username = typeof req.body.username === 'string' ? req.body.username.trim() : '';
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';

    if (!username || !email || !password) {
      return res.status(400).json({ success: false, error: 'Validation Error: Username, email, and password are required' });
    }

    if (!USERNAME_REGEX.test(username)) {
      return res.status(400).json({ success: false, error: 'Validation Error: Username must be 3-24 characters (alphanumeric & underscore only)' });
    }

    if (!EMAIL_REGEX.test(email) || email.length > 254) {
      return res.status(400).json({ success: false, error: 'Validation Error: Please provide a valid email address' });
    }

    if (password.length < 8 || password.length > 128) {
      return res.status(400).json({ success: false, error: 'Validation Error: Password must be between 8 and 128 characters' });
    }

    const existingUser = db.prepare('SELECT id, username, email FROM users WHERE username = ? OR email = ?').get(username, email);
    if (existingUser) {
      const fieldConflict = existingUser.username.toLowerCase() === username.toLowerCase() ? 'Username' : 'Email';
      return res.status(409).json({ success: false, error: `Conflict: ${fieldConflict} is already registered` });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const avatarUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(username)}`;
    const result = db.prepare(
      'INSERT INTO users (username, email, password_hash, avatar_url) VALUES (?, ?, ?, ?)'
    ).run(username, email, passwordHash, avatarUrl);

    // Issue JWT token on signup
    const token = jwt.sign(
      { id: result.lastInsertRowid, username, email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    res.cookie('token', token, cookieOptions);

    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
      token,
      data: {
        id: result.lastInsertRowid,
        username,
        email,
        avatar_url: avatarUrl,
        created_at: new Date().toISOString()
      }
    });

  } catch (error) {
    console.error('Registration error:', error);
    return res.status(500).json({ success: false, error: 'Internal Server Error: Unable to complete registration' });
  }
});

/**
 * POST /api/auth/login
 * Day 5: User authentication, password comparison & JWT token issuance
 */
router.post('/login', async (req, res) => {
  try {
    const identifier = typeof req.body.username === 'string' ? req.body.username.trim() : (req.body.email || '');
    const password = typeof req.body.password === 'string' ? req.body.password : '';

    if (!identifier || !password) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error: Username/email and password are required'
      });
    }

    // Lookup user by either username or email
    const user = db.prepare('SELECT * FROM users WHERE username = ? OR email = ?').get(identifier, identifier.toLowerCase());
    if (!user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication failed: Invalid credentials'
      });
    }

    // Secure password comparison against bcrypt hash
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return res.status(401).json({
        success: false,
        error: 'Authentication failed: Invalid credentials'
      });
    }

    // Sign JWT token with 7-day expiration
    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      JWT_SECRET,
      { expiresIn: '7d' }
    );

    // Store in HTTP-Only cookie for CSRF/XSS resilience
    res.cookie('token', token, cookieOptions);

    return res.json({
      success: true,
      message: 'Logged in successfully',
      token,
      data: {
        id: user.id,
        username: user.username,
        email: user.email,
        avatar_url: user.avatar_url
      }
    });

  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ success: false, error: 'Internal Server Error: Unable to process login' });
  }
});

/**
 * GET /api/auth/me (PROTECTED ROUTE - Day 5 Deliverable)
 * Requires valid JWT. Returns 401 without token, returns user data with valid token.
 */
router.get('/me', authMiddleware, (req, res) => {
  const user = db.prepare('SELECT id, username, email, avatar_url, created_at FROM users WHERE id = ?').get(req.user.id);
  if (!user) {
    return res.status(404).json({ success: false, error: 'User profile not found' });
  }

  return res.json({
    success: true,
    message: 'Authorized: User profile retrieved',
    data: user
  });
});

/**
 * POST /api/auth/logout
 * Clears authentication session cookie
 */
router.post('/logout', (req, res) => {
  res.clearCookie('token', cookieOptions);
  return res.json({
    success: true,
    message: 'Logged out successfully'
  });
});

module.exports = router;
