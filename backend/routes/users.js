const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// GET /api/users/:id - get user profile
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id, username, avatar_url, rating, rating_count, role, created_at FROM users WHERE id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'User not found' });
    const user = result.rows[0];

    // Completed tasks count
    const tasksResult = await pool.query(
      `SELECT COUNT(*) as count FROM tasks WHERE helper_id = $1 AND status = 'completed'`,
      [req.params.id]
    );
    user.completed_tasks = parseInt(tasksResult.rows[0].count);

    // Comments/ratings received
    const commentsResult = await pool.query(
      `SELECT r.comment, r.score, r.created_at, u.username as rater_name
       FROM ratings r JOIN users u ON r.rater_id = u.id
       WHERE r.rated_id = $1 AND r.comment IS NOT NULL AND r.comment != ''
       ORDER BY r.created_at DESC LIMIT 10`,
      [req.params.id]
    );
    user.comments = commentsResult.rows;

    res.json(user);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// ---- ADMIN ROUTES ----

// GET /api/users - admin: get all users
router.get('/', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, username, email, rating, role, is_blocked, created_at FROM users ORDER BY created_at DESC'
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users/:id/block - admin: block user
router.post('/:id/block', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await pool.query('UPDATE users SET is_blocked = TRUE WHERE id = $1', [req.params.id]);
    res.json({ message: 'User blocked' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users/:id/unblock - admin: unblock user
router.post('/:id/unblock', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    await pool.query('UPDATE users SET is_blocked = FALSE WHERE id = $1', [req.params.id]);
    res.json({ message: 'User unblocked' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/users/report - report a user
router.post('/report', authMiddleware, async (req, res) => {
  const { reported_user_id, task_id, reason } = req.body;
  try {
    await pool.query(
      'INSERT INTO reports (reporter_id, reported_user_id, task_id, reason) VALUES ($1, $2, $3, $4)',
      [req.user.id, reported_user_id, task_id, reason]
    );
    res.status(201).json({ message: 'Report submitted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/users/admin/reports - admin: get all reports
router.get('/admin/reports', authMiddleware, adminMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT rep.*, 
        u1.username as reporter_name, 
        u2.username as reported_name
       FROM reports rep
       JOIN users u1 ON rep.reporter_id = u1.id
       JOIN users u2 ON rep.reported_user_id = u2.id
       ORDER BY rep.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
