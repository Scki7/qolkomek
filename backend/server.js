const express = require('express');
const cors = require('cors');
const path = require('path');
require('dotenv').config();

const { initDB } = require('./db');
const authRoutes = require('./routes/auth');
const taskRoutes = require('./routes/tasks');
const messageRoutes = require('./routes/messages');
const ratingRoutes = require('./routes/ratings');
const userRoutes = require('./routes/users');
const notificationRoutes = require('./routes/notifications');
const supportRoutes = require('./routes/support');
const aiRoutes = require('./routes/ai');         // 🆕
const skillsRoutes = require('./routes/skills'); // 🆕

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/messages', messageRoutes);
app.use('/api/ratings', ratingRoutes);
app.use('/api/users', userRoutes);
app.use('/api/notifications', notificationRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/ai', aiRoutes);         // 🆕
app.use('/api/skills', skillsRoutes); // 🆕

app.get('/api/health', (req, res) => res.json({ status: 'ok' }));

const frontendBuild = path.join(__dirname, '../frontend/build');
app.use(express.static(frontendBuild));
app.get('*', (req, res) => res.sendFile(path.join(frontendBuild, 'index.html')));

initDB().then(() => {
  app.listen(PORT, () => console.log(`🚀 QolKomek running on port ${PORT}`));
});