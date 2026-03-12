const Database = require('better-sqlite3');

console.log("Initializing database...");

const db = new Database('datastam.db');

db.prepare(`
CREATE TABLE IF NOT EXISTS stories (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    story_id TEXT UNIQUE,
    url TEXT,
    title TEXT,
    description TEXT,
    sections_json TEXT,
    total_charts INTEGER,
    captured_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
`).run();

db.prepare(`
CREATE TABLE IF NOT EXISTS posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    story_id INTEGER,
    platform TEXT,
    content TEXT,
    hashtags TEXT,
    chart_index INTEGER,
    section_index INTEGER,
    status TEXT DEFAULT 'draft'
)
`).run();

module.exports = db;