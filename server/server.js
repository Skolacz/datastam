require('dotenv').config();
const express = require('express');
const path = require('path');
const app = express();

app.use(express.json({ limit: '50mb' }));

// Static File Serving
app.use(express.static(path.join(__dirname, '..', 'frontend', 'public')));

const stories = [];
const posts = [];
let nextStoryId = 1;
let nextPostId = 1;

// Capture proxy
const API_TOKEN = process.env.API_TOKEN;
console.log('API_TOKEN loaded:', !!API_TOKEN);
app.post('/api/stories/capture', async (req, res) => {
    const { url } = req.body;
    if (!url || !url.includes('datastam.ai')) {
        return res.status(400).json({ success: false, error: 'Provide a valid datastam.ai URL.' });
    }
    try {
        const response = await fetch('https://data-story-to-post-api.up.railway.app/api/capture', {
            method: 'POST',
            headers: { 'x-api-key': API_TOKEN, 'Content-Type': 'application/json' },
            body: JSON.stringify({ url })
        });
        const data = await response.json();
        if (!data.success) return res.status(502).json({ success: false, error: data.error || 'Capture failed.' });

        const story = { id: nextStoryId++, storyId: data.storyId, url, title: data.title, description: data.description, sections: data.sections, totalCharts: data.totalCharts };
        stories.push(story);
        res.json({ success: true, story });
    } catch (err) {
        console.error('Capture error:', err);
        res.status(500).json({ success: false, error: err.message });
    }
});

// Chart Image Endpoint
app.get('/api/stories/:id/charts/:chartIndex', (req, res) => {
    const story = stories.find(s => s.id === parseInt(req.params.id));
    if (!story) return res.status(404).json({ error: 'Story not found.' });

    const chartIdx = parseInt(req.params.chartIndex);
    for (const section of story.sections) {
        if (!section.charts) continue;
        const chart = section.charts.find(c => c.index === chartIdx);
        if (chart && chart.base64) {
            const raw = chart.base64.replace(/^data:image\/png;base64,/, '');
            const buffer = Buffer.from(raw, 'base64');
            res.set('Content-Type', 'image/png');
            return res.send(buffer);
        }
    }

    res.status(404).json({ error: 'Chart not found.' });
});

// Generate placeholder posts
app.post('/api/generate', (req, res) => {
    const { storyId, platforms } = req.body;
    const story = stories.find(s => s.id === storyId);
    if (!story) return res.status(404).json({ success: false, error: 'Story not found.' });

    const created = [];
    for (const section of story.sections.slice(0, 3)) {
        for (const platform of (platforms || ['linkedin', 'twitter', 'instagram'])) {
            const post = {
                id: nextPostId++,
                storyId: story.id,
                platform,
                content: `[Waiting on AI integration]\n\n${(section.text || '').substring(0, 200)}...`,
                hashtags: '#datastam #data',
                chartIndex: section.charts?.[0]?.index || null,
                sectionIndex: section.index,
                status: 'draft'
            };
            posts.push(post);
            created.push(post);
        }
    }
    res.json({ success: true, count: created.length, posts: created });
});

// List posts for dashboard
app.get('/api/posts', (req, res) => {
    let result = posts;
    if (req.query.platform && req.query.platform !== 'all') result = result.filter(p => p.platform === req.query.platform);
    if (req.query.status && req.query.status !== 'all') result = result.filter(p => p.status === req.query.status);
    res.json(result);
});

// ─── Start ───────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});
