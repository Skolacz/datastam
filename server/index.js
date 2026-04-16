//Brady
require("dotenv").config();   // MUST be first — loads environment variables before anything else runs

const express = require("express");
const cors = require("cors");

// Import route modules
// These files contain all your API endpoints, grouped by feature.
const apiRouter = require("./api");              // Core API routes (capture, health, buffer, etc.)
const storiesRoutes = require("./routes/stories"); // Story-related CRUD routes
const postsRoutes = require("./routes/posts");     // Post-related CRUD routes

const app = express();

// ------------------------------------------------------
// Global Middleware
// ------------------------------------------------------

// Enable CORS so your frontend (running on a different port) can call the backend
app.use(cors());

// Parse incoming JSON request bodies
app.use(express.json());

// ------------------------------------------------------
// Mount API Route Groups
// ------------------------------------------------------

// All routes inside api.js will be available under /api
// Example: /api/capture, /api/health, /api/stories/capture
app.use("/api", apiRouter);

// Story routes (database storage, retrieval, deletion, etc.)
app.use("/api/stories", storiesRoutes);

// Post routes (saving posts, retrieving posts, publishing, etc.)
app.use("/api/posts", postsRoutes);

// ------------------------------------------------------
// Root-Level Health Check
// Purpose: Quick check to confirm the backend server itself is running.
// Does NOT check external APIs — that's handled in /api/health.
// ------------------------------------------------------
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

// ------------------------------------------------------
// Start Server
// ------------------------------------------------------
const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

// ------------------------------------------------------
// Debug Logging
// These logs help verify that environment variables are loaded correctly.
// Useful during development, but remove in production.
// ------------------------------------------------------
console.log("Capture API:", process.env.API_KEY);
console.log("Capture API:", process.env.CAPTURE_API_URL);
console.log("Capture API Key:", process.env.CAPTURE_API_KEY);
console.log("Claude API:", process.env.CLAUDE_API_KEY);


