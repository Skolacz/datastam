// server/api.js
//Brady
const express = require("express");

// Dynamic import wrapper for node-fetch (because node-fetch v3 is ESM-only)
// This allows you to still use fetch(...) inside a CommonJS project.
const fetch = (...args) =>
  import("node-fetch").then(({ default: fetch }) => fetch(...args));

const router = express.Router();

// ------------------------------------------------------
// Base URL for the external Datastam Capture API
// All capture requests are forwarded to this service.
// ------------------------------------------------------
const BASE_URL = "https://data-story-to-post-api.up.railway.app";

// ------------------------------------------------------
// Load API key from environment variables
// Used for authenticated requests to the external capture API.
// ------------------------------------------------------
const API_KEY = process.env.API_KEY || null;

// ------------------------------------------------------
// Health Check Route
// Purpose: Allows frontend or monitoring tools to verify
// that the external API is reachable and responding.
// ------------------------------------------------------
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

// ------------------------------------------------------
// Capture Endpoint (raw)
// Purpose: Directly forwards a URL to the external capture API.
// This is a low-level endpoint used for debugging or testing.
// ------------------------------------------------------
router.post("/capture", async (req, res) => {
  const { url } = req.body;

  // Validate input
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

    // Forward error from external API
    if (!response.ok) {
      return res.status(response.status).json({
        error: "Capture failed",
        details: data,
      });
    }

    // Return raw capture data
    res.json(data);
  } catch (err) {
    res.status(500).json({
      error: "Internal server error",
      details: err.message,
    });
  }
});

// ------------------------------------------------------
// Frontend Capture Wrapper
// Route: POST /api/stories/capture
//
// Purpose:
// The frontend expects a specific response format:
//   { success: true, story: {...} }
//
// This wraps the raw capture endpoint and normalizes the output.
// Later, this is where you will insert the story into SQLite.
// ------------------------------------------------------
router.post("/stories/capture", async (req, res) => {
  const { url } = req.body;

  // Validate input
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

    // Forward error from external API
    if (!response.ok) {
      return res.status(response.status).json({
        success: false,
        error: "Capture failed",
        details: data,
      });
    }

    // Return normalized structure for frontend
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

// ------------------------------------------------------
// Buffer: List Connected Profiles
//
// Purpose:
// Attempts to fetch connected social profiles from Buffer.
// Requires a valid Buffer API access token (paid plan only).
//
// NOTE:
// Free Buffer accounts cannot use this API.
// If the token is invalid, Buffer returns:
//   "OIDC tokens are not accepted for direct API access"
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

// ------------------------------------------------------
// Export router so index.js can mount it under /api
// ------------------------------------------------------
module.exports = router;

// ------------------------------------------------------
// Notes:
// - Run backend with "npm start"
// - Frontend calls /api/stories/capture to capture story data
// - API key is loaded from .env via process.env.API_KEY
// ------------------------------------------------------
