const express = require('express');
const router = express.Router();

const db = require('../db/database');
const captureStory = require('../services/captureService');

router.post('/capture', async (req, res) => {

    const { url } = req.body;

    if (!url) {
        return res.status(400).json({ error: "URL required" });
    }

    try {

        const data = await captureStory(url);

        const stmt = db.prepare(`
            INSERT OR IGNORE INTO stories
            (story_id, url, title, description, sections_json, total_charts)
            VALUES (?, ?, ?, ?, ?, ?)
        `);

        stmt.run(
            data.storyId,
            url,
            data.title,
            data.description,
            JSON.stringify(data.sections),
            data.totalCharts
        );

        res.json({
            message: "Story captured successfully",
            story: data
        });

    } catch (error) {

        console.error(error);

        res.status(500).json({
            error: "Capture failed"
        });

    }

});

module.exports = router;