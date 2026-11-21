const express = require('express');
const { db } = require('../db/init');
const { authMiddleware, optionalAuth } = require('../middleware/auth');

const router = express.Router();

/**
 * 1. STREAM SOURCE & SERVER RESOLVER (Heavy Feature Core)
 * GET /api/stream/resolve/:episodeId
 * Resolves multi-server streaming URLs, video sources, audio tracks & resume timestamp.
 */
router.get('/resolve/:episodeId', optionalAuth, (req, res) => {
  try {
    const episodeId = parseInt(req.params.episodeId, 10);
    if (isNaN(episodeId) || episodeId < 1) {
      return res.status(400).json({ success: false, error: 'Valid episode ID required' });
    }

    const episode = db.prepare(`
      SELECT e.*, 
             a.id as anime_id, a.title as anime_title, a.title_jp, a.slug as anime_slug, 
             a.cover_image as anime_cover, a.type as anime_type, a.episodes_count as total_episodes,
             a.has_hindi_dub
      FROM episodes e
      JOIN anime a ON e.anime_id = a.id
      WHERE e.id = ?
    `).get(episodeId);

    if (!episode) {
      return res.status(404).json({ success: false, error: 'Episode not found' });
    }

    // Next and Previous episode navigation pointers
    const prevEp = db.prepare(`
      SELECT id, number, title FROM episodes 
      WHERE anime_id = ? AND number < ? 
      ORDER BY number DESC LIMIT 1
    `).get(episode.anime_id, episode.number);

    const nextEp = db.prepare(`
      SELECT id, number, title FROM episodes 
      WHERE anime_id = ? AND number > ? 
      ORDER BY number ASC LIMIT 1
    `).get(episode.anime_id, episode.number);

    // Resolve Multiple Streaming Servers & Mirrors
    const ytId = episode.youtube_video_id || 'W81XCKkTez8';
    const servers = [
      {
        id: 'hd-vault',
        name: 'HD Vault (Fast CDN)',
        quality: '1080p HD',
        embed_url: `https://www.youtube-nocookie.com/embed/${ytId}?autoplay=1&enablejsapi=1&rel=0&modestbranding=1`,
        direct_stream_url: episode.source_url || `https://www.youtube.com/watch?v=${ytId}`,
        type: 'embed',
        preferred: true
      },
      {
        id: 'mirror-stream',
        name: 'AnimeStream Mirror (Sub/Dub)',
        quality: '720p Multi',
        embed_url: `https://www.youtube.com/embed/${ytId}?autoplay=1&fs=1`,
        type: 'embed',
        preferred: false
      },
      {
        id: 'server-3',
        name: 'Official Partner Feed',
        quality: '1080p Auto',
        source_name: episode.source_name || 'Official Licensor',
        direct_stream_url: episode.source_url || `https://www.youtube.com/watch?v=${ytId}`,
        type: 'external',
        preferred: false
      }
    ];

    // Check user resume timestamp if logged in
    let resumeProgress = 0;
    if (req.user) {
      const historyRow = db.prepare(`
        SELECT progress_seconds FROM watch_history 
        WHERE user_id = ? AND episode_id = ?
      `).get(req.user.id, episodeId);
      if (historyRow && historyRow.progress_seconds) {
        resumeProgress = historyRow.progress_seconds;
      }
    }

    res.json({
      success: true,
      data: {
        episode: {
          id: episode.id,
          number: episode.number,
          title: episode.title,
          thumbnail: episode.thumbnail || episode.anime_cover,
          duration: episode.duration || '24 min',
          audio_language: episode.audio_language || (episode.has_hindi_dub ? 'Hindi Dub Available' : 'Japanese Audio (EN Sub)'),
          anime: {
            id: episode.anime_id,
            title: episode.anime_title,
            title_jp: episode.title_jp,
            slug: episode.anime_slug,
            total_episodes: episode.total_episodes
          }
        },
        servers,
        playback: {
          resume_seconds: resumeProgress,
          has_saved_progress: resumeProgress > 0,
          prev_episode: prevEp || null,
          next_episode: nextEp || null
        }
      }
    });

  } catch (err) {
    console.error('Stream resolver error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 2. REAL-TIME WATCH PROGRESS & PLAYBACK SYNC (Heavy Feature Core)
 * POST /api/stream/sync
 * Syncs exact video progress seconds, automatically advances Watchlist status.
 */
router.post('/sync', optionalAuth, (req, res) => {
  try {
    const { episode_id, progress_seconds = 0, duration_seconds = 1440 } = req.body;
    const episodeId = parseInt(episode_id, 10);
    const progress = Math.max(0, parseInt(progress_seconds, 10) || 0);
    const duration = Math.max(1, parseInt(duration_seconds, 10) || 1440);

    if (isNaN(episodeId) || episodeId < 1) {
      return res.status(400).json({ success: false, error: 'Valid episode_id is required' });
    }

    const episode = db.prepare(`
      SELECT e.id, e.number, e.anime_id, a.episodes_count 
      FROM episodes e 
      JOIN anime a ON e.anime_id = a.id 
      WHERE e.id = ?
    `).get(episodeId);

    if (!episode) {
      return res.status(404).json({ success: false, error: 'Episode not found' });
    }

    const percentWatched = Math.min(100, Math.round((progress / duration) * 100));
    const isCompleted = percentWatched >= 85;

    // If authenticated, sync with watch_history and watchlist
    if (req.user) {
      // 1. Update watch_history
      const existingHistory = db.prepare(`
        SELECT id FROM watch_history WHERE user_id = ? AND episode_id = ?
      `).get(req.user.id, episodeId);

      if (existingHistory) {
        db.prepare(`
          UPDATE watch_history 
          SET progress_seconds = ?, watched_at = CURRENT_TIMESTAMP 
          WHERE id = ?
        `).run(progress, existingHistory.id);
      } else {
        db.prepare(`
          INSERT INTO watch_history (user_id, episode_id, progress_seconds, watched_at) 
          VALUES (?, ?, ?, CURRENT_TIMESTAMP)
        `).run(req.user.id, episodeId, progress);
      }

      // 2. Synchronize with Watchlist
      const wlEntry = db.prepare(`
        SELECT id, status, current_episode FROM watchlist 
        WHERE user_id = ? AND anime_id = ?
      `).get(req.user.id, episode.anime_id);

      let wlStatus = 'watching';
      const isFinalEpisode = episode.number >= episode.episodes_count;

      if (wlEntry) {
        // If final episode watched, advance status to completed!
        if (isFinalEpisode && isCompleted) {
          wlStatus = 'completed';
        } else if (wlEntry.status === 'completed') {
          wlStatus = 'completed';
        }

        const nextCurrentEp = Math.max(wlEntry.current_episode || 0, episode.number);

        db.prepare(`
          UPDATE watchlist 
          SET status = ?, current_episode = ?, updated_at = CURRENT_TIMESTAMP 
          WHERE id = ?
        `).run(wlStatus, nextCurrentEp, wlEntry.id);
      } else {
        // Automatically add to watchlist as 'watching'
        if (isFinalEpisode && isCompleted) wlStatus = 'completed';

        db.prepare(`
          INSERT INTO watchlist (user_id, anime_id, status, current_episode, updated_at) 
          VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        `).run(req.user.id, episode.anime_id, wlStatus, episode.number);
      }
    }

    res.json({
      success: true,
      message: 'Watch progress synchronized',
      data: {
        episode_id: episodeId,
        progress_seconds: progress,
        duration_seconds: duration,
        percent_watched: percentWatched,
        is_completed: isCompleted,
        authenticated: !!req.user
      }
    });

  } catch (err) {
    console.error('Stream sync error:', err);
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 3. RESUME POSITION & LAST WATCHED FOR ANIME
 * GET /api/stream/resume/:animeId
 */
router.get('/resume/:animeId', optionalAuth, (req, res) => {
  try {
    const animeId = parseInt(req.params.animeId, 10);
    if (isNaN(animeId)) {
      return res.status(400).json({ success: false, error: 'Valid anime ID required' });
    }

    if (!req.user) {
      // Return first episode for guests
      const firstEp = db.prepare('SELECT id, number, title FROM episodes WHERE anime_id = ? ORDER BY number ASC LIMIT 1').get(animeId);
      return res.json({
        success: true,
        data: {
          has_resume: false,
          episode: firstEp || null,
          resume_seconds: 0
        }
      });
    }

    // Find latest watch_history entry for this anime
    const latest = db.prepare(`
      SELECT wh.episode_id, wh.progress_seconds, wh.watched_at,
             e.number as episode_number, e.title as episode_title
      FROM watch_history wh
      JOIN episodes e ON wh.episode_id = e.id
      WHERE wh.user_id = ? AND e.anime_id = ?
      ORDER BY wh.watched_at DESC
      LIMIT 1
    `).get(req.user.id, animeId);

    if (latest) {
      return res.json({
        success: true,
        data: {
          has_resume: true,
          episode_id: latest.episode_id,
          episode_number: latest.episode_number,
          episode_title: latest.episode_title,
          resume_seconds: latest.progress_seconds,
          last_watched: latest.watched_at
        }
      });
    }

    // Fallback to first episode
    const firstEp = db.prepare('SELECT id, number, title FROM episodes WHERE anime_id = ? ORDER BY number ASC LIMIT 1').get(animeId);
    res.json({
      success: true,
      data: {
        has_resume: false,
        episode: firstEp || null,
        resume_seconds: 0
      }
    });

  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

/**
 * 4. HTTP 206 RANGE PARTIAL CONTENT DEMO STREAM (RFC 7233)
 * GET /api/stream/range-demo
 * Demonstrates HTTP range streaming headers for chunked media streaming.
 */
router.get('/range-demo', (req, res) => {
  const simulatedSize = 10485760; // 10MB simulated media stream
  const range = req.headers.range;

  if (range) {
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : Math.min(start + 524288, simulatedSize - 1); // 512KB chunk
    const chunksize = (end - start) + 1;

    res.writeHead(206, {
      'Content-Range': `bytes ${start}-${end}/${simulatedSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'video/mp4'
    });
    // Send simulated buffer chunk
    res.end(Buffer.alloc(chunksize));
  } else {
    res.writeHead(200, {
      'Content-Length': simulatedSize,
      'Content-Type': 'video/mp4',
      'Accept-Ranges': 'bytes'
    });
    res.end(Buffer.alloc(Math.min(524288, simulatedSize)));
  }
});

/**
 * 5. EPISODE COMMENTS & DISCUSSION FEED
 * GET /api/stream/episode/:id/comments
 * POST /api/stream/episode/:id/comments
 */
router.get('/episode/:id/comments', (req, res) => {
  try {
    const episodeId = parseInt(req.params.id, 10);
    const comments = db.prepare(`
      SELECT c.*, u.username, u.avatar_url 
      FROM comments c 
      JOIN users u ON c.user_id = u.id 
      WHERE c.episode_id = ? 
      ORDER BY c.created_at DESC 
      LIMIT 50
    `).all(episodeId);

    res.json({ success: true, count: comments.length, data: comments });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

router.post('/episode/:id/comments', optionalAuth, (req, res) => {
  try {
    const episodeId = parseInt(req.params.id, 10);
    const content = typeof req.body.content === 'string' ? req.body.content.trim() : '';

    if (!content) {
      return res.status(400).json({ success: false, error: 'Comment text is required' });
    }

    const userId = req.user?.id || 1;
    const result = db.prepare(`
      INSERT INTO comments (user_id, episode_id, content, created_at) 
      VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `).run(userId, episodeId, content);

    const createdComment = db.prepare(`
      SELECT c.*, u.username, u.avatar_url 
      FROM comments c 
      JOIN users u ON c.user_id = u.id 
      WHERE c.id = ?
    `).get(result.lastInsertRowid);

    res.status(201).json({ success: true, message: 'Comment posted', data: createdComment });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

module.exports = router;
