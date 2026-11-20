const express = require('express');
const { db } = require('../db/init');
const { authMiddleware } = require('../middleware/auth');

const router = express.Router();
const VALID_STATUSES = new Set(['watching', 'completed', 'plan_to_watch', 'dropped', 'on_hold']);

// All user routes require valid JWT authentication
router.use(authMiddleware);

// ===================================================================
// 1. WATCHLIST CRUD (Day 10 Core Deliverable)
// ===================================================================

/**
 * READ Watchlist
 * GET /api/user/watchlist?status=watching
 */
router.get('/watchlist', (req, res) => {
  try {
    const { status } = req.query;
    let query = `
      SELECT w.*, 
             a.title, a.title_jp, a.slug, a.cover_image, a.banner_image, 
             a.type, a.status as anime_status, a.rating, a.episodes_count,
             a.release_year, a.has_hindi_dub
      FROM watchlist w
      JOIN anime a ON w.anime_id = a.id
      WHERE w.user_id = ?
    `;
    const params = [req.user.id];

    if (status && VALID_STATUSES.has(status)) {
      query += ' AND w.status = ?';
      params.push(status);
    }

    query += ' ORDER BY w.updated_at DESC';
    const list = db.prepare(query).all(...params);

    // Attach genres to each watchlist entry
    const getGenres = db.prepare(`
      SELECT g.id, g.name, g.slug FROM genres g
      JOIN anime_genres ag ON g.id = ag.genre_id 
      WHERE ag.anime_id = ?
    `);

    const enriched = list.map(item => ({
      ...item,
      genres: getGenres.all(item.anime_id)
    }));

    res.json({
      success: true,
      count: enriched.length,
      data: enriched
    });
  } catch (err) {
    console.error('Watchlist fetch error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * CREATE Watchlist Entry
 * POST /api/user/watchlist
 */
router.post('/watchlist', (req, res) => {
  try {
    const { anime_id, status = 'watching', current_episode = 0 } = req.body;

    const animeId = parseInt(anime_id, 10);
    if (isNaN(animeId) || animeId < 1) {
      return res.status(400).json({ success: false, error: 'A valid anime_id is required' });
    }

    if (!VALID_STATUSES.has(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status. Must be one of: watching, completed, plan_to_watch, dropped, on_hold' });
    }

    const anime = db.prepare('SELECT id, episodes_count FROM anime WHERE id = ?').get(animeId);
    if (!anime) {
      return res.status(404).json({ success: false, error: 'Anime not found in catalogue' });
    }

    const episodeNum = Math.max(0, parseInt(current_episode, 10) || 0);

    // Check if already in watchlist
    const existing = db.prepare('SELECT id FROM watchlist WHERE user_id = ? AND anime_id = ?').get(req.user.id, animeId);
    if (existing) {
      db.prepare(`
        UPDATE watchlist 
        SET status = ?, current_episode = ?, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ?
      `).run(status, episodeNum, existing.id);

      return res.json({
        success: true,
        message: 'Watchlist entry updated',
        data: { id: existing.id, anime_id: animeId, status, current_episode: episodeNum }
      });
    }

    // Insert new watchlist record
    const result = db.prepare(`
      INSERT INTO watchlist (user_id, anime_id, status, current_episode, updated_at) 
      VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
    `).run(req.user.id, animeId, status, episodeNum);

    res.status(201).json({
      success: true,
      message: 'Anime added to your watchlist',
      data: {
        id: result.lastInsertRowid,
        user_id: req.user.id,
        anime_id: animeId,
        status,
        current_episode: episodeNum
      }
    });
  } catch (err) {
    console.error('Watchlist create error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * UPDATE Watchlist Entry
 * PUT /api/user/watchlist/:id
 */
router.put('/watchlist/:id', (req, res) => {
  try {
    const entryId = parseInt(req.params.id, 10);
    const { status, current_episode } = req.body;

    const entry = db.prepare('SELECT * FROM watchlist WHERE id = ? AND user_id = ?').get(entryId, req.user.id);
    if (!entry) {
      return res.status(404).json({ success: false, error: 'Watchlist entry not found' });
    }

    if (status !== undefined && !VALID_STATUSES.has(status)) {
      return res.status(400).json({ success: false, error: 'Invalid status' });
    }

    const updates = [];
    const params = [];

    if (status) {
      updates.push('status = ?');
      params.push(status);
    }

    if (current_episode !== undefined) {
      const ep = Math.max(0, parseInt(current_episode, 10) || 0);
      updates.push('current_episode = ?');
      params.push(ep);
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(entryId, req.user.id);

    db.prepare(`UPDATE watchlist SET ${updates.join(', ')} WHERE id = ? AND user_id = ?`).run(...params);

    const updatedEntry = db.prepare('SELECT * FROM watchlist WHERE id = ?').get(entryId);

    res.json({
      success: true,
      message: 'Watchlist updated successfully',
      data: updatedEntry
    });
  } catch (err) {
    console.error('Watchlist update error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * DELETE Watchlist Entry
 * DELETE /api/user/watchlist/:id
 */
router.delete('/watchlist/:id', (req, res) => {
  try {
    const entryId = parseInt(req.params.id, 10);
    const result = db.prepare('DELETE FROM watchlist WHERE id = ? AND user_id = ?').run(entryId, req.user.id);

    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Watchlist entry not found' });
    }

    res.json({
      success: true,
      message: 'Anime removed from your watchlist',
      data: { id: entryId }
    });
  } catch (err) {
    console.error('Watchlist delete error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

// ===================================================================
// 2. FAVORITES & HISTORY
// ===================================================================

router.get('/favorites', (req, res) => {
  try {
    const favs = db.prepare(`
      SELECT f.*, a.title, a.slug, a.cover_image, a.rating, a.type
      FROM favorites f
      JOIN anime a ON f.anime_id = a.id
      WHERE f.user_id = ?
      ORDER BY f.created_at DESC
    `).all(req.user.id);

    res.json({ success: true, count: favs.length, data: favs });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/favorites', (req, res) => {
  try {
    const animeId = parseInt(req.body.anime_id, 10);
    if (isNaN(animeId) || animeId < 1) {
      return res.status(400).json({ success: false, error: 'A valid anime_id is required' });
    }

    const existing = db.prepare('SELECT id FROM favorites WHERE user_id = ? AND anime_id = ?').get(req.user.id, animeId);
    if (existing) {
      return res.status(400).json({ success: false, error: 'Already in favorites' });
    }

    const result = db.prepare('INSERT INTO favorites (user_id, anime_id) VALUES (?, ?)').run(req.user.id, animeId);
    res.status(201).json({ success: true, message: 'Added to favorites', data: { id: result.lastInsertRowid } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.delete('/favorites/:animeId', (req, res) => {
  try {
    const animeId = parseInt(req.params.animeId, 10);
    const result = db.prepare('DELETE FROM favorites WHERE user_id = ? AND anime_id = ?').run(req.user.id, animeId);
    if (result.changes === 0) {
      return res.status(404).json({ success: false, error: 'Not found in favorites' });
    }
    res.json({ success: true, message: 'Removed from favorites' });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
