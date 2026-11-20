require('dotenv').config();
const path = require('path');
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { db, initializeDatabase, checkDatabaseHealth } = require('./db/init');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Database Schema (users, anime, genres, anime_genres, episodes)
initializeDatabase();

// Core Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(cookieParser());

// Serve static frontend assets (Day 8: Frontend setup)
app.use(express.static(path.join(__dirname, 'public')));

// API Directory & System Info Endpoint
app.get(['/api', '/api/info'], (req, res) => {
  res.json({
    project: 'AnimeVault API',
    version: '1.2.0',
    description: 'Full-stack anime streaming platform backend',
    status: 'online',
    frontend: 'Active (SPA loaded at /)',
    endpoints: {
      health: 'GET /health',
      auth: {
        signup: 'POST /api/auth/register',
        login: 'POST /api/auth/login',
        me: 'GET /api/auth/me (Protected)',
        logout: 'POST /api/auth/logout'
      },
      anime: {
        catalog_paginated_search: 'GET /api/anime?page=1&limit=20&search=naruto&genre=action',
        single_anime_with_episodes: 'GET /api/anime/:id',
        anime_episodes: 'GET /api/anime/:id/episodes',
        genres_taxonomy: 'GET /api/genres',
        create: 'POST /api/anime (Protected)',
        update: 'PUT /api/anime/:id (Protected)',
        delete: 'DELETE /api/anime/:id (Protected)'
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

// Genres Taxonomy API (Day 7)
app.get('/api/genres', (req, res) => {
  try {
    const genres = db.prepare(`
      SELECT g.*, COUNT(ag.anime_id) as anime_count
      FROM genres g
      LEFT JOIN anime_genres ag ON g.id = ag.genre_id
      GROUP BY g.id
      ORDER BY g.name ASC
    `).all();
    res.json({ success: true, data: genres });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Authentication Routes (Day 4 & Day 5)
app.use('/api/auth', require('./routes/auth'));

// Main Entity & Related Entities: Anime, Genres & Episodes (Day 6 & Day 7)
app.use('/api/anime', require('./routes/anime'));

// User Library & Watchlist CRUD Routes (Day 10: Create, Edit & Delete Flows)
app.use('/api/user', require('./routes/user'));

// SPA Fallback for client-side routing (Day 8: Frontend Routing)
app.get('*', (req, res, next) => {
  if (req.path.startsWith('/api') || req.path === '/health') {
    return next();
  }
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start Server
app.listen(PORT, () => {
  console.log(`\n🚀 AnimeVault Server running on http://localhost:${PORT}`);
  console.log(`🩺 Health check: http://localhost:${PORT}/health`);
  console.log(`🏷️  Genres API  : GET  http://localhost:${PORT}/api/genres`);
  console.log(`🔍 Anime Search : GET  http://localhost:${PORT}/api/anime?search=solo&genre=action\n`);
});

module.exports = app;
