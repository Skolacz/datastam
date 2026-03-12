require("dotenv").config();

const express = require("express");
const cors = require("cors");

const storiesRoutes = require("./routes/stories");
const postsRoutes = require("./routes/posts");

const app = express();

app.use(cors());
app.use(express.json());


// API routes
app.use("/api/stories", storiesRoutes);
app.use("/api/posts", postsRoutes);


// health check
app.get("/health", (req, res) => {
  res.json({ status: "ok" });
});


const PORT = process.env.PORT || 4000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});