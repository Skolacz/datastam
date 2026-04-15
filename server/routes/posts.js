const express = require("express");
const router = express.Router();
const db = require("../db/database");

// Generate placeholder posts
router.post("/generate", (req, res) => {
  const { storyId, platforms } = req.body;

  const story = db.prepare("SELECT * FROM stories WHERE id=?").get(storyId);

  if (!story) {
    return res.status(404).json({ error: "Story not found" });
  }

  const sections = JSON.parse(story.sections_json);

  let created = 0;

  sections.forEach((section, index) => {
    platforms.forEach(platform => {
      const content = `📊 ${story.title}\n\n${section.text.slice(0,120)}...\n\n#data #analytics`;

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
  db.prepare("UPDATE posts SET status='approved' WHERE id=?").run(req.params.id);
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
  db.prepare("DELETE FROM posts WHERE id=?").run(req.params.id);
  res.json({ success: true });
});

// ------------------------------
// Claude AI post generation
// ------------------------------
const promptTemplates = require('../prompts/promptTemplates');


router.post('/generate-ai', async (req, res) => {
  try {
    const { storyId, platforms } = req.body;

    const story = db.prepare('SELECT * FROM stories WHERE id = ?').get(storyId);
    if (!story) return res.status(404).json({ error: 'Story not found' });

    const sections = JSON.parse(story.sections_json);
    const generatedPosts = [];

    for (const section of sections) {
      for (const platform of platforms) {
        const template = promptTemplates[platform];
        const filledPrompt = template
          .replace('{topic}', story.title)
          .replace('{audience}', 'general audience')
          .replace('{goal}', 'engagement')
          .replace('{tone}', 'informative')
          .replace('{keywords}', section.insights?.join(', ') || '')
          + `\n\nSTORY SECTION:\n${section.text}\nKEY INSIGHTS:\n${section.insights?.join('\n') || ''}\nCRITICAL: Only use numbers that appear in the story. Do NOT make up data.`;

        const response = await fetch("https://api.anthropic.com/v1/messages", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-api-key": process.env.CLAUDE_API_KEY,
            "anthropic-version": "2023-06-01"
          },
          body: JSON.stringify({
            model: "claude-3-haiku-20240307",
            max_tokens: 1024,
            messages: [
      { role: "user", content: filledPrompt }
    ]
  })
});

const data = await response.json();
const content = data?.content?.[0]?.text || "";

        db.prepare(`
          INSERT INTO posts
          (story_id, platform, content, section_index, status, created_at, updated_at)
          VALUES (?, ?, ?, ?, 'draft', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        `).run(story.id, platform, content, section.index);

        generatedPosts.push({ platform, content, sectionIndex: section.index });
      }
    }

    res.json({ success: true, posts: generatedPosts });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to generate posts' });
  }
});

// Regenerate a post using Claude AI
router.post('/:id/regenerate', async (req, res) => {
  try {
    const postId = req.params.id;

    // fetch post from DB
    const post = db.prepare('SELECT * FROM posts WHERE id = ?').get(postId);
    if (!post) return res.status(404).json({ error: 'Post not found' });

    // fetch story section
    const story = db.prepare('SELECT * FROM stories WHERE id = ?').get(post.story_id);
    if (!story) return res.status(404).json({ error: 'Story not found' });

    const sections = JSON.parse(story.sections_json);
    const section = sections[post.section_index];
    if (!section) return res.status(404).json({ error: 'Section not found' });

    // get template for this platform
    const template = promptTemplates[post.platform];
    const filledPrompt = template
      .replace('{topic}', story.title)
      .replace('{audience}', 'general audience')
      .replace('{goal}', 'engagement')
      .replace('{tone}', 'informative')
      .replace('{keywords}', section.insights.join(', '))
      + `\n\nSTORY SECTION:\n${section.text}\nKEY INSIGHTS:\n${section.insights.join('\n')}\nCRITICAL: Only use numbers that appear in the story. Do NOT make up data.`;

    // call Claude AI
const response = await fetch("https://api.anthropic.com/v1/messages", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "x-api-key": process.env.CLAUDE_API_KEY,
    "anthropic-version": "2023-06-01"
  },
  body: JSON.stringify({
    model: "claude-3-haiku-20240307",
    max_tokens: 1024,
    messages: [
      { role: "user", content: filledPrompt }
    ]
  })
});

const data = await response.json();
const newContent = data?.content?.[0]?.text || "";

    // update post content in DB
    db.prepare(`
      UPDATE posts
      SET content = ?, updated_at = CURRENT_TIMESTAMP
      WHERE id = ?
    `).run(newContent, postId);

    res.json({ success: true, postId, newContent });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Failed to regenerate post' });
  }
});

module.exports = router;