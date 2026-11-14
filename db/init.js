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
  checkDatabaseHealth
};
