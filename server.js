require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { db, initializeDatabase, checkDatabaseHealth } = require('./db/init');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Database Schema (creates users table on startup)
initializeDatabase();

// Core Middleware
app.use(cors());
app.use(express.json());

// Root Welcome Endpoint
app.get('/', (req, res) => {
  res.json({
    project: 'AnimeVault API',
    version: '1.0.0',
    description: 'Full-stack anime streaming platform backend',
    status: 'online',
    endpoints: {
      health: '/health',
      signup: 'POST /api/auth/register'
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

// Authentication Routes (Day 4: Signup / Register API)
app.use('/api/auth', require('./routes/auth'));

// Start Server
app.listen(PORT, () => {
  console.log(`\n🚀 AnimeVault Server running on http://localhost:${PORT}`);
  console.log(`🩺 Health check: http://localhost:${PORT}/health`);
  console.log(`🔐 Signup API : POST http://localhost:${PORT}/api/auth/register\n`);
});

module.exports = app;
