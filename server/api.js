// server/api.js

const express = require("express");
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const router = express.Router();

// Base URL
const BASE_URL = "https://data-story-to-post-api.up.railway.app";

// Load API key from environment
const API_KEY = process.env.API_KEY || null;

// -------------
// Health Check
// -------------
router.get("/health", async (req, res) => {
  try {
    const response = await fetch(`${BASE_URL}/api/health`);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({
      error: "Health check failed",
      details: err.message,
    });
  }
});

// -----------------
// Capture Endpoint (raw)
// -----------------
router.post("/capture", async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res.status(400).json({ error: "Missing 'url' field" });
  }

  try {
    const response = await fetch(`${BASE_URL}/api/capture`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(API_KEY ? { "x-api-key": API_KEY } : {}),
      },
      body: JSON.stringify({ url }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: "Capture failed",
        details: data,
      });
    }

    res.json(data);
  } catch (err) {
    res.status(500).json({
      error: "Internal server error",
      details: err.message,
    });
  }
});

// ------------------------------------------------------
// Frontend expects: POST /api/stories/capture
// This wraps the same capture logic but returns { success, story }
// ------------------------------------------------------
router.post("/stories/capture", async (req, res) => {
  const { url } = req.body;

  if (!url) {
    return res
      .status(400)
      .json({ success: false, error: "Missing 'url' field" });
  }

  try {
    const response = await fetch(`${BASE_URL}/api/capture`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(API_KEY ? { "x-api-key": API_KEY } : {}),
      },
      body: JSON.stringify({ url }),
    });

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: "Capture failed",
        details: data,
      });
    }

    // For now, just pass through what the external API returns.
    // Later you can insert into SQLite here.
    return res.json({
      success: true,
      story: data,
    });
  } catch (err) {
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      details: err.message,
    });
  }
});

module.exports = router;

// ------------------------------------------------------
// Buffer: List connected profiles
// ------------------------------------------------------
router.get("/buffer/profiles", async (req, res) => {
  try {
    const response = await fetch(
      `https://api.bufferapp.com/1/profiles.json?access_token=${process.env.BUFFER_ACCESS_TOKEN}`
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: "Failed to fetch Buffer profiles",
        details: data
      });
    }

    return res.json({
      success: true,
      profiles: data
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      error: "Internal server error",
      details: err.message
    });
  }
});


//"npm start" to run server, then frontend can call /api/capture to capture data 
//from a URL using the API key stored in .env file.

//API KEY IS AVAILABLE AS process.env.API_KEY