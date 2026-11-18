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
 * 1. PAGINATED, SEARCHABLE & FILTERABLE ANIME CATALOG (Day 7 Deliverable)
 * GET /api/anime
 * Supports: search, genre, status, type, year, season, sort, page, limit
 */
router.get('/', optionalAuth, (req, res) => {
  try {
    const {
      page = '1',
      limit = '20',
      genre,
      status,
      type,
      sort = 'rating',
      search,
      q,
      year,
      season,
      dub
    } = req.query;

    const pageNumber = Math.max(1, parseInt(page, 10) || 1);
    const pageSize = Math.min(60, Math.max(1, parseInt(limit, 10) || 20));
    const offset = (pageNumber - 1) * pageSize;

    let conditions = [];
    let params = [];

    // Search query matching English title, Japanese title, slug, or synopsis
    const searchQuery = (search || q || '').trim();
    if (searchQuery) {
      conditions.push('(a.title LIKE ? OR a.title_jp LIKE ? OR a.slug LIKE ? OR a.description LIKE ?)');
      params.push(`%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`, `%${searchQuery}%`);
    }

    if (status) {
      conditions.push('a.status = ?');
      params.push(status);
    }

    if (type) {
      conditions.push('a.type = ?');
      params.push(type);
    }

    if (dub === 'hindi' || dub === '1' || dub === 'true') {
      conditions.push('a.has_hindi_dub = 1');
    }

    if (year) {
      conditions.push('a.release_year = ?');
      params.push(parseInt(year, 10));
    }

    if (season) {
      conditions.push('a.season = ?');
      params.push(season);
    }

    // Join with related Genres entity when genre filter is specified
    let joinClause = '';
    if (genre) {
      joinClause = 'JOIN anime_genres ag ON a.id = ag.anime_id JOIN genres g ON ag.genre_id = g.id';
      conditions.push('(g.slug = ? OR g.name = ?)');
      params.push(genre.toLowerCase(), genre);
    }

    const whereClause = conditions.length > 0 ? 'WHERE ' + conditions.join(' AND ') : '';

    const sortMap = {
      rating: 'a.rating DESC, a.views DESC',
      latest: 'a.release_year DESC, a.id DESC',
      title: 'a.title ASC',
      views: 'a.views DESC',
      episodes: 'a.episodes_count DESC'
    };
    const orderBy = sortMap[sort] || sortMap.rating;

    // Total count query for pagination
    const countQuery = `SELECT COUNT(DISTINCT a.id) as total FROM anime a ${joinClause} ${whereClause}`;
    const total = db.prepare(countQuery).get(...params).total;

    // Paginated list query
    const listQuery = `
      SELECT DISTINCT a.* FROM anime a
      ${joinClause}
      ${whereClause}
      ORDER BY ${orderBy}
      LIMIT ? OFFSET ?
    `;
    const animeList = db.prepare(listQuery).all(...params, pageSize, offset);

    // Prepare genre enrichment for each anime in result
    const getGenres = db.prepare(`
      SELECT g.id, g.name, g.slug FROM genres g
      JOIN anime_genres ag ON g.id = ag.genre_id
      WHERE ag.anime_id = ?
      ORDER BY g.name ASC
    `);

    const enriched = animeList.map(item => ({
      ...item,
      genres: getGenres.all(item.id)
    }));

    res.json({
      success: true,
      data: {
        anime: enriched,
        pagination: {
          page: pageNumber,
          limit: pageSize,
          total,
          totalPages: Math.ceil(total / pageSize)
        }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 2. RELATED ENTITY API: ALL GENRES WITH ANIME COUNTS
 * GET /api/anime/meta/genres (and /api/genres)
 */
router.get('/meta/genres', (req, res) => {
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

/**
 * 3. RELATED ENTITY API: EPISODES FOR AN ANIME
 * GET /api/anime/:id/episodes
 */
router.get('/:id/episodes', (req, res) => {
  try {
    const param = req.params.id;
    let anime = /^\d+$/.test(param)
      ? db.prepare('SELECT id, title, slug FROM anime WHERE id = ?').get(parseInt(param, 10))
      : db.prepare('SELECT id, title, slug FROM anime WHERE slug = ?').get(param);

    if (!anime) {
      return res.status(404).json({ success: false, error: 'Anime not found' });
    }

    const episodes = db.prepare(`
      SELECT * FROM episodes
      WHERE anime_id = ?
      ORDER BY number ASC
    `).all(anime.id);

    res.json({
      success: true,
      data: {
        anime: { id: anime.id, title: anime.title, slug: anime.slug },
        episodes_count: episodes.length,
        episodes
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 4. READ SINGLE ANIME WITH GENRES & EPISODES
 * GET /api/anime/:id
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

    // Increment view count on single view
    db.prepare('UPDATE anime SET views = views + 1 WHERE id = ?').run(anime.id);

    // Fetch related genres
    const genres = db.prepare(`
      SELECT g.id, g.name, g.slug FROM genres g
      JOIN anime_genres ag ON g.id = ag.genre_id
      WHERE ag.anime_id = ?
      ORDER BY g.name ASC
    `).all(anime.id);

    // Fetch related episodes
    const episodes = db.prepare(`
      SELECT * FROM episodes
      WHERE anime_id = ?
      ORDER BY number ASC
    `).all(anime.id);

    res.json({
      success: true,
      data: {
        ...anime,
        genres,
        episodes
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 5. CREATE (POST /api/anime) - Protected by authMiddleware
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
      has_hindi_dub = 0,
      genre_ids = []
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

    const newAnimeId = result.lastInsertRowid;

    // Link genres if provided
    if (Array.isArray(genre_ids) && genre_ids.length > 0) {
      const linkGenre = db.prepare('INSERT OR IGNORE INTO anime_genres (anime_id, genre_id) VALUES (?, ?)');
      for (const gId of genre_ids) {
        linkGenre.run(newAnimeId, gId);
      }
    }

    const newAnime = db.prepare('SELECT * FROM anime WHERE id = ?').get(newAnimeId);

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
 * 6. UPDATE (PUT /api/anime/:id) - Protected by authMiddleware
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

    db.prepare(`
      UPDATE anime SET
        title = ?, title_jp = ?, description = ?, type = ?, status = ?,
        rating = ?, episodes_count = ?, release_year = ?, season = ?,
        studio = ?, cover_image = ?, banner_image = ?, has_hindi_dub = ?
      WHERE id = ?
    `).run(
      title, title_jp, description, type, status,
      Number(rating), Number(episodes_count), release_year ? Number(release_year) : null,
      season, studio, cover_image, banner_image, has_hindi_dub ? 1 : 0, id
    );

    const updated = db.prepare('SELECT * FROM anime WHERE id = ?').get(id);
    res.json({ success: true, message: 'Anime updated successfully', data: updated });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

/**
 * 7. DELETE (DELETE /api/anime/:id) - Protected by authMiddleware
 */
router.delete('/:id', authMiddleware, (req, res) => {
  try {
    const id = parseInt(req.params.id, 10);
    const existing = db.prepare('SELECT id, title FROM anime WHERE id = ?').get(id);

    if (!existing) {
      return res.status(404).json({ success: false, error: 'Anime not found' });
    }

    db.prepare('DELETE FROM anime WHERE id = ?').run(id);
    res.json({ success: true, message: `Anime '${existing.title}' deleted successfully` });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

module.exports = router;
