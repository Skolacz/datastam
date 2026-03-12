require("dotenv").config();

const express = require("express");

require('./db/database');

const storiesRoutes = require('./routes/stories');

const app = express();

app.use(express.json());

// Load routes
const apiRoutes = require("./api");
app.use("/api", apiRoutes);

// Start server
app.listen(3000, () => {
  console.log("Server running on port 3000");
});
app.use('/api/stories', storiesRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'Server running 🚀' });
});

const PORT = process.env.PORT || 4000;

app.get('/', (req, res) => {
  res.send('this works !!🚀');
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
