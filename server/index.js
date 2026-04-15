require("dotenv").config();   // MUST be first

const express = require("express");
const cors = require("cors");

const apiRouter = require("./api");
const storiesRoutes = require("./routes/stories");
const postsRoutes = require("./routes/posts");

const app = express();


app.use(cors());
app.use(express.json());

// Mount API routes
app.use("/api", apiRouter);                  // your existing /api/capture and /api/health
app.use("/api/stories", storiesRoutes);      // your stories routes folder
app.use("/api/posts", postsRoutes);          // your posts routes folder

// Health check (root-level)
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

console.log("Capture API:", process.env.API_KEY);
console.log("Claude API:", process.env.CLAUDE_API_KEY);

