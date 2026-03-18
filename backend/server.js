const express = require('express');
const cors = require('cors');
require('dotenv').config();

const { initDB } = require('./db');

const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const messageRoutes = require('./routes/messages');
const ratingRoutes = require('./routes/ratings');
const userRoutes = require('./routes/users');

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/users', userRoutes);

// Health check
app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

// Start server
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 QolKomek backend running on port ${PORT}`);
  });
});
