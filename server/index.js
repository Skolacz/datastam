require('dotenv').config();
const express = require('express');

require('./db/database');

const storiesRoutes = require('./routes/stories');

const app = express();

app.use(express.json());

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