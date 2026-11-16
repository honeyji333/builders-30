require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { db, initializeDatabase, checkDatabaseHealth } = require('./db/init');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Database Schema (creates users table on startup)
initializeDatabase();

// Core Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Root Welcome Endpoint
app.get('/', (req, res) => {
  res.json({
    project: 'AnimeVault API',
    version: '1.0.0',
    description: 'Full-stack anime streaming platform backend',
    status: 'online',
    endpoints: {
      health: 'GET /health',
      signup: 'POST /api/auth/register',
      login: 'POST /api/auth/login',
      me: 'GET /api/auth/me (Protected - requires JWT)',
      logout: 'POST /api/auth/logout'
    }
  });
});

// Health Check API
app.get(['/health', '/api/health'], (req, res) => {
  const dbHealth = checkDatabaseHealth();
  
  if (dbHealth.connected) {
    return res.status(200).json({
      status: 'OK',
      message: 'AnimeVault server is running smoothly',
      database: 'Connected',
      dbEngine: 'SQLite3 (better-sqlite3)',
      timestamp: new Date().toISOString()
    });
  }

  return res.status(500).json({
    status: 'Error',
    message: 'Database connection failed',
    database: 'Disconnected',
    error: dbHealth.error,
    timestamp: new Date().toISOString()
  });
});

// Authentication Routes (Day 4: Register | Day 5: Login, Protected /me, Logout)
app.use('/api/auth', require('./routes/auth'));

// Start Server
app.listen(PORT, () => {
  console.log(`\n🚀 AnimeVault Server running on http://localhost:${PORT}`);
  console.log(`🩺 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Signup API : POST http://localhost:${PORT}/api/auth/register`);
  console.log(`🔑 Login API  : POST http://localhost:${PORT}/api/auth/login`);
  console.log(`🛡️  Protected  : GET  http://localhost:${PORT}/api/auth/me (Requires JWT)\n`);
});

module.exports = app;
