const Database = require("better-sqlite3");

const db = new Database("datastam.db");

// Create tables automatically
db.exec(`

CREATE TABLE IF NOT EXISTS stories (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 story_id TEXT UNIQUE,
 url TEXT,
 title TEXT,
 description TEXT,
 sections_json TEXT,
 total_charts INTEGER,
 captured_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS posts (
 id INTEGER PRIMARY KEY AUTOINCREMENT,
 story_id INTEGER,
 platform TEXT,
 content TEXT,
 hashtags TEXT,
 chart_index INTEGER,
 section_index INTEGER,
 status TEXT DEFAULT 'draft',
 thread_position INTEGER DEFAULT 0,
 buffer_update_id TEXT,
 posted_at DATETIME,
 created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
 updated_at DATETIME
);

`);

module.exports = db;