const express = require("express");
const router = express.Router();
const db = require("../db/database");
const captureService = require("../services/captureService");


// Capture story from Datastam
router.post("/capture", async (req, res) => {

  try {

    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: "URL required" });
    }

    const data = await captureService.captureStory(url);

    db.prepare(`
      INSERT OR REPLACE INTO stories
      (story_id, url, title, description, sections_json, total_charts)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      data.storyId,
      url,
      data.title,
      data.description,
      JSON.stringify(data.sections),
      data.totalCharts
    );

    const story = db.prepare(
      "SELECT * FROM stories WHERE story_id=?"
    ).get(data.storyId);

    res.json(story);

  } catch (error) {

    console.error(error);
    res.status(500).json({ error: "Capture failed" });

  }

});


// Get all stories
router.get("/", (req, res) => {

  const stories = db.prepare(
    "SELECT * FROM stories ORDER BY captured_at DESC"
  ).all();

  res.json(stories);

});


// Get one story
router.get("/:id", (req, res) => {

  const story = db.prepare(
    "SELECT * FROM stories WHERE id=?"
  ).get(req.params.id);

  if (!story) {
    return res.status(404).json({ error: "Story not found" });
  }

  story.sections = JSON.parse(story.sections_json);

  res.json(story);

});


module.exports = router;