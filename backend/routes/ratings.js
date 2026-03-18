const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authMiddleware } = require('../middleware/auth');

// POST /api/ratings - submit rating
router.post('/', authMiddleware, async (req, res) => {
  const { task_id, rated_id, score, comment } = req.body;
  if (!task_id || !rated_id || !score) {
    return res.status(400).json({ error: 'task_id, rated_id and score are required' });
  }
  try {
    const task = await pool.query('SELECT * FROM tasks WHERE id = $1', [task_id]);
    if (task.rows.length === 0) return res.status(404).json({ error: 'Task not found' });
    const t = task.rows[0];
    if (t.status !== 'completed') {
      return res.status(400).json({ error: 'Task must be completed to rate' });
    }
    if (t.customer_id !== req.user.id) {
      return res.status(403).json({ error: 'Only customer can rate' });
    }

    await pool.query(
      `INSERT INTO ratings (task_id, rater_id, rated_id, score, comment)
       VALUES ($1, $2, $3, $4, $5)`,
      [task_id, req.user.id, rated_id, score, comment]
    );

    // Update user's average rating
    const ratingResult = await pool.query(
      'SELECT AVG(score) as avg, COUNT(*) as count FROM ratings WHERE rated_id = $1',
      [rated_id]
    );
    const { avg, count } = ratingResult.rows[0];
    await pool.query(
      'UPDATE users SET rating = $1, rating_count = $2 WHERE id = $3',
      [parseFloat(avg).toFixed(2), count, rated_id]
    );

    res.status(201).json({ message: 'Rating submitted' });
  } catch (err) {
    if (err.code === '23505') return res.status(400).json({ error: 'Already rated this task' });
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
