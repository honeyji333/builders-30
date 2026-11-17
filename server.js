require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { db, initializeDatabase, checkDatabaseHealth } = require('./db/init');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Database Schema (users & anime tables)
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
      auth: {
        signup: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        me: 'GET /api/auth/me (Protected)',
        logout: 'POST /api/auth/logout'
      },
      anime_crud: {
        read_all: 'GET /api/anime',
        read_one: 'GET /api/anime/:id',
        create: 'POST /api/anime (Protected - requires auth)',
        update: 'PUT /api/anime/:id (Protected - requires auth)',
        delete: 'DELETE /api/anime/:id (Protected - requires auth)'
      }
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

// Authentication Routes (Day 4 & Day 5)
app.use('/api/auth', require('./routes/auth'));

// Main Entity: Anime CRUD Routes (Day 6)
app.use('/api/anime', require('./routes/anime'));

// Start Server
app.listen(PORT, () => {
  console.log(`\n🚀 AnimeVault Server running on http://localhost:${PORT}`);
  console.log(`🩺 Health check: http://localhost:${PORT}/health`);
  console.log(`🎬 Anime CRUD  : /api/anime (GET, POST, PUT, DELETE)\n`);
});

module.exports = app;
