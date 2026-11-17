const express = require('express');
const { db } = require('../db/init');
const { authMiddleware, optionalAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * Helper to generate URL-safe slugs from title
 */
function slugify(text) {
  return text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/[\s\W-]+/g, '-');
}

/**
 * 1. READ ALL (GET /api/anime)
 * Returns paginated catalog of anime
 */
router.get('/', optionalAuth, (req, res) => {
  try {
    const page = Math.max(1, parseInt(req.query.page, 10) || 1);
    const limit = Math.min(60, Math.max(1, parseInt(req.query.limit, 10) || 20));
    const offset = (page - 1) * limit;

    const total = db.prepare('SELECT COUNT(*) as count FROM anime').get().count;
    const animeList = db.prepare(`
      SELECT * FROM anime
      ORDER BY rating DESC, id DESC
      LIMIT ? OFFSET ?
    `).all(limit, offset);

    res.json({
      success: true,
      data: {
        anime: animeList,
        pagination: {
          page,
          limit,
          total,
          totalPages: Math.ceil(total / limit)
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 2. READ SINGLE (GET /api/anime/:id)
 * Fetches an anime by its ID or slug
 */
router.get('/:id', optionalAuth, (req, res) => {
  try {
    const param = req.params.id;
    let anime = null;

    if (/^\d+$/.test(param)) {
      anime = db.prepare('SELECT * FROM anime WHERE id = ?').get(parseInt(param, 10));
    } else {
      anime = db.prepare('SELECT * FROM anime WHERE slug = ?').get(param);
    }

    if (!anime) {
      return res.status(404).json({ success: false, error: 'Anime not found' });
    }

    res.json({
      success: true,
      data: anime
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 3. CREATE (POST /api/anime) - Protected by authMiddleware
 * Creates a new anime entry in the catalog
 */
router.post('/', authMiddleware, (req, res) => {
  try {
    const {
      title,
      title_jp,
      description,
      type = 'TV',
      status = 'Airing',
      rating = 0,
      episodes_count = 0,
      release_year,
      season,
      studio,
      cover_image,
      banner_image,
      has_hindi_dub = 0
    } = req.body;

    if (!title || typeof title !== 'string' || !title.trim()) {
      return res.status(400).json({ success: false, error: 'Title is required' });
    }

    const baseSlug = slugify(title);
    let uniqueSlug = baseSlug;
    let counter = 1;
    while (db.prepare('SELECT id FROM anime WHERE slug = ?').get(uniqueSlug)) {
      uniqueSlug = `${baseSlug}-${counter++}`;
    }

    const insertStmt = db.prepare(`
      INSERT INTO anime (
        title, title_jp, slug, description, type, status, rating,
        episodes_count, release_year, season, studio,
        cover_image, banner_image, has_hindi_dub
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const result = insertStmt.run(
      title.trim(),
      title_jp || null,
      uniqueSlug,
      description || null,
      type,
      status,
      Number(rating) || 0,
      Number(episodes_count) || 0,
      release_year ? Number(release_year) : null,
      season || null,
      studio || null,
      cover_image || null,
      banner_image || null,
      has_hindi_dub ? 1 : 0
    );

    const newAnime = db.prepare('SELECT * FROM anime WHERE id = ?').get(result.lastInsertRowid);

    res.status(201).json({
      success: true,
      message: 'Anime created successfully',
      data: newAnime
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 4. UPDATE (PUT /api/anime/:id) - Protected by authMiddleware
 * Updates metadata for an existing anime
 */
router.put('/:id', authMiddleware, (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const existing = db.prepare('SELECT * FROM anime WHERE id = ?').get(id);

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Anime not found' });
    }

    const {
      title = existing.title,
      title_jp = existing.title_jp,
      description = existing.description,
      type = existing.type,
      status = existing.status,
      rating = existing.rating,
      episodes_count = existing.episodes_count,
      release_year = existing.release_year,
      season = existing.season,
      studio = existing.studio,
      cover_image = existing.cover_image,
      banner_image = existing.banner_image,
      has_hindi_dub = existing.has_hindi_dub
    } = req.body;

    const updateStmt = db.prepare(`
      UPDATE anime SET
        title = ?, title_jp = ?, description = ?, type = ?, status = ?,
        rating = ?, episodes_count = ?, release_year = ?, season = ?,
        studio = ?, cover_image = ?, banner_image = ?, has_hindi_dub = ?
      WHERE id = ?
    `);

    updateStmt.run(
      title,
      title_jp,
      description,
      type,
      status,
      Number(rating),
      Number(episodes_count),
      release_year ? Number(release_year) : null,
      season,
      studio,
      cover_image,
      banner_image,
      has_hindi_dub ? 1 : 0,
      id
    );

    const updatedAnime = db.prepare('SELECT * FROM anime WHERE id = ?').get(id);

    res.json({
      success: true,
      message: 'Anime updated successfully',
      data: updatedAnime
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 5. DELETE (DELETE /api/anime/:id) - Protected by authMiddleware
 * Removes an anime entry from the catalog
 */
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const existing = db.prepare('SELECT id, title FROM anime WHERE id = ?').get(id);

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Anime not found' });
    }

    db.prepare('DELETE FROM anime WHERE id = ?').run(id);

    res.json({
      success: true,
      message: `Anime '${existing.title}' deleted successfully`,
      data: { id }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
