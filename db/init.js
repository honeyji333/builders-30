const Database = require('better-sqlite3');
const path = require('path');
const fs = require('fs');

const DB_PATH = process.env.DATABASE_PATH || path.join(__dirname, '..', 'data', 'anime.db');

// Ensure data directory exists
const dataDir = path.dirname(DB_PATH);
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

// Initialize SQLite database instance
const db = new Database(DB_PATH);

// Enable Write-Ahead Logging (WAL) and foreign keys
db.pragma('journal_mode = WAL');
db.pragma('foreign_keys = ON');

function initializeDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      avatar_url TEXT DEFAULT '/images/default-avatar.png',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
    CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);

    -- Main Entity Table (Day 6)
    CREATE TABLE IF NOT EXISTS anime (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      title_jp TEXT,
      slug TEXT UNIQUE NOT NULL,
      description TEXT,
      cover_image TEXT,
      banner_image TEXT,
      type TEXT CHECK(type IN ('TV','Movie','OVA','ONA','Special')) DEFAULT 'TV',
      status TEXT CHECK(status IN ('Airing','Completed','Upcoming')) DEFAULT 'Airing',
      rating REAL DEFAULT 0,
      episodes_count INTEGER DEFAULT 0,
      release_year INTEGER,
      season TEXT,
      studio TEXT,
      duration TEXT DEFAULT '24 min',
      views INTEGER DEFAULT 0,
      has_hindi_dub INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    CREATE INDEX IF NOT EXISTS idx_anime_slug ON anime(slug);
    CREATE INDEX IF NOT EXISTS idx_anime_status ON anime(status);
    CREATE INDEX IF NOT EXISTS idx_anime_type ON anime(type);
    CREATE INDEX IF NOT EXISTS idx_anime_rating ON anime(rating);
  `);
}

function checkDatabaseHealth() {
  try {
    const row = db.prepare('SELECT 1 as connected').get();
    return {
      connected: row && row.connected === 1,
      dbPath: DB_PATH
    };
  } catch (error) {
    return {
      connected: false,
      error: error.message
    };
  }
}

module.exports = {
  db,
  initializeDatabase,
  checkDatabaseHealth
};
