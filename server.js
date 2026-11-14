require('dotenv').config();
const express = require('express');
const cors = require('cors');
const { db, checkDatabaseHealth } = require('./db/init');

const app = express();
const PORT = process.env.PORT || 3000;

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
    healthCheck: '/health'
  });
});

// Health Check API (Deliverable for Day 3)
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

// Start Server
app.listen(PORT, () => {
  console.log(`\n🚀 AnimeVault Server running on http://localhost:${PORT}`);
  console.log(`🩺 Health check available at: http://localhost:${PORT}/health\n`);
});

module.exports = app;
