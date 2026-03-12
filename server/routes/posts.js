const express = require("express");
const router = express.Router();
const db = require("../db/database");


// Generate placeholder posts
router.post("/generate", (req, res) => {

  const { storyId, platforms } = req.body;

  const story = db.prepare(
    "SELECT * FROM stories WHERE id=?"
  ).get(storyId);

  if (!story) {
    return res.status(404).json({ error: "Story not found" });
  }

  const sections = JSON.parse(story.sections_json);

  let created = 0;

  sections.forEach((section, index) => {

    platforms.forEach(platform => {

      const content =
`📊 ${story.title}

${section.text.slice(0,120)}...

#data #analytics`;

      db.prepare(`
        INSERT INTO posts
        (story_id, platform, content, chart_index, section_index)
        VALUES (?, ?, ?, ?, ?)
      `).run(
        storyId,
        platform,
        content,
        section.charts?.[0]?.index || null,
        index
      );

      created++;

    });

  });

  res.json({ success: true, created });

});


// List posts
router.get("/", (req, res) => {

  const { platform, status, storyId } = req.query;

  let query = "SELECT * FROM posts WHERE 1=1";
  const params = [];

  if (platform) {
    query += " AND platform=?";
    params.push(platform);
  }

  if (status) {
    query += " AND status=?";
    params.push(status);
  }

  if (storyId) {
    query += " AND story_id=?";
    params.push(storyId);
  }

  const posts = db.prepare(query).all(...params);

  res.json(posts);

});


// Approve post
router.put("/:id/approve", (req, res) => {

  db.prepare(`
    UPDATE posts
    SET status='approved'
    WHERE id=?
  `).run(req.params.id);

  res.json({ success: true });

});


// Update post (editor)
router.put("/:id", (req, res) => {

  const { content, hashtags } = req.body;

  db.prepare(`
    UPDATE posts
    SET content=?, hashtags=?, updated_at=CURRENT_TIMESTAMP
    WHERE id=?
  `).run(content, hashtags, req.params.id);

  res.json({ success: true });

});


// Delete post
router.delete("/:id", (req, res) => {

  db.prepare(
    "DELETE FROM posts WHERE id=?"
  ).run(req.params.id);

  res.json({ success: true });

});

module.exports = router;