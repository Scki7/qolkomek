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

// Разрешаем CORS для всех (чтобы фронтенд мог достучаться)
app.use(cors());
app.use(express.json());

// 1. Добавляем проверку главной страницы (чтобы не было Cannot GET /)
app.get('/', (req, res) => {
  res.send('🚀 QolKomek API is LIVE! Try /api/health to check database.');
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/users', userRoutes);

// 2. Health check (уже был, оставляем)
app.get('/api/health', (req, res) => res.json({ status: 'ok', message: 'Database connected' }));

// Start server
initDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 QolKomek backend running on port ${PORT}`);
  });
}).catch(err => {
  console.error('❌ Failed to connect to DB:', err);
});