const express = require('express');
const bcrypt = require('bcryptjs');
const { db } = require('../db/init');

const router = express.Router();

// Email validation regex (RFC 5322 standard compliant pattern)
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
// Username validation: 3-24 alphanumeric characters or underscores
const USERNAME_REGEX = /^[a-zA-Z0-9_]{3,24}$/;

/**
 * POST /api/auth/register (or /signup)
 * Day 4 Deliverable: User registration with input validation & bcrypt password hashing
 */
router.post(['/register', '/signup'], async (req, res) => {
  try {
    const username = typeof req.body.username === 'string' ? req.body.username.trim() : '';
    const email = typeof req.body.email === 'string' ? req.body.email.trim().toLowerCase() : '';
    const password = typeof req.body.password === 'string' ? req.body.password : '';

    // 1. Mandatory Fields Validation
    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error: Username, email, and password are required'
      });
    }

    // 2. Username Format Validation
    if (!USERNAME_REGEX.test(username)) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error: Username must be 3-24 characters (letters, numbers, underscores only)'
      });
    }

    // 3. Email Format Validation
    if (!EMAIL_REGEX.test(email) || email.length > 254) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error: Please provide a valid email address'
      });
    }

    // 4. Password Strength Validation (Minimum 8 chars)
    if (password.length < 8 || password.length > 128) {
      return res.status(400).json({
        success: false,
        error: 'Validation Error: Password must be between 8 and 128 characters'
      });
    }

    // 5. Uniqueness Check (Check if username or email already exists)
    const existingUser = db.prepare('SELECT id, username, email FROM users WHERE username = ? OR email = ?').get(username, email);
    if (existingUser) {
      const fieldConflict = existingUser.username.toLowerCase() === username.toLowerCase() ? 'Username' : 'Email';
      return res.status(409).json({
        success: false,
        error: `Conflict: ${fieldConflict} is already registered`
      });
    }

    // 6. Secure Password Hashing with Bcrypt (Salt rounds = 10)
    // Never store plain-text passwords
    const saltRounds = 10;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 7. Insert new user into database
    const avatarUrl = `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(username)}`;
    const insertStmt = db.prepare(`
      INSERT INTO users (username, email, password_hash, avatar_url)
      VALUES (?, ?, ?, ?)
    `);
    const result = insertStmt.run(username, email, passwordHash, avatarUrl);

    // 8. Return sanitised response (excluding password_hash)
    return res.status(201).json({
      success: true,
      message: 'User registered successfully',
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
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error: Unable to complete registration',
      details: error.message
    });
  }
});

module.exports = router;
