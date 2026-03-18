const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authMiddleware } = require('../middleware/auth');

// GET /api/tasks - get all open tasks (with optional filters)
router.get('/', async (req, res) => {
  const { category, status = 'open' } = req.query;
  try {
    let query = `
      SELECT t.*, u.username as customer_name, u.avatar_url as customer_avatar, u.rating as customer_rating
      FROM tasks t
      JOIN users u ON t.customer_id = u.id
      WHERE t.status = $1
    `;
    const params = [status];
    if (category) {
      query += ` AND t.category = $${params.length + 1}`;
      params.push(category);
    }
    query += ' ORDER BY t.created_at DESC';
    const result = await pool.query(query, params);
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tasks/my - get current user's tasks
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*, u.username as helper_name, u.avatar_url as helper_avatar, u.rating as helper_rating
       FROM tasks t
       LEFT JOIN users u ON t.helper_id = u.id
       WHERE t.customer_id = $1
       ORDER BY t.created_at DESC`,
      [req.user.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tasks/:id - get single task
router.get('/:id', async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT t.*, 
        c.username as customer_name, c.avatar_url as customer_avatar, c.rating as customer_rating,
        h.username as helper_name, h.avatar_url as helper_avatar, h.rating as helper_rating
       FROM tasks t
       JOIN users c ON t.customer_id = c.id
       LEFT JOIN users h ON t.helper_id = h.id
       WHERE t.id = $1`,
      [req.params.id]
    );
    if (result.rows.length === 0) return res.status(404).json({ error: 'Task not found' });
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tasks - create task
router.post('/', authMiddleware, async (req, res) => {
  const { title, description, category, payment, latitude, longitude, location_name } = req.body;
  if (!title) return res.status(400).json({ error: 'Title is required' });
  try {
    const result = await pool.query(
      `INSERT INTO tasks (title, description, category, payment, latitude, longitude, location_name, customer_id)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8) RETURNING *`,
      [title, description, category, payment, latitude, longitude, location_name, req.user.id]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tasks/:id/respond - helper responds to task
router.post('/:id/respond', authMiddleware, async (req, res) => {
  const { message } = req.body;
  try {
    const task = await pool.query('SELECT * FROM tasks WHERE id = $1', [req.params.id]);
    if (task.rows.length === 0) return res.status(404).json({ error: 'Task not found' });
    if (task.rows[0].customer_id === req.user.id) {
      return res.status(400).json({ error: 'Cannot respond to your own task' });
    }
    if (task.rows[0].status !== 'open') {
      return res.status(400).json({ error: 'Task is not open' });
    }
    const result = await pool.query(
      `INSERT INTO task_responses (task_id, helper_id, message) VALUES ($1, $2, $3)
       ON CONFLICT (task_id, helper_id) DO UPDATE SET message = $3 RETURNING *`,
      [req.params.id, req.user.id, message]
    );
    res.status(201).json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/tasks/:id/responses - get all helpers who responded
router.get('/:id/responses', authMiddleware, async (req, res) => {
  try {
    const task = await pool.query('SELECT customer_id FROM tasks WHERE id = $1', [req.params.id]);
    if (task.rows.length === 0) return res.status(404).json({ error: 'Task not found' });
    if (task.rows[0].customer_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    const result = await pool.query(
      `SELECT tr.*, u.username, u.avatar_url, u.rating, u.rating_count
       FROM task_responses tr
       JOIN users u ON tr.helper_id = u.id
       WHERE tr.task_id = $1
       ORDER BY tr.created_at ASC`,
      [req.params.id]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tasks/:id/select-helper - customer selects a helper
router.post('/:id/select-helper', authMiddleware, async (req, res) => {
  const { helper_id } = req.body;
  try {
    const task = await pool.query('SELECT * FROM tasks WHERE id = $1', [req.params.id]);
    if (task.rows.length === 0) return res.status(404).json({ error: 'Task not found' });
    if (task.rows[0].customer_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    const result = await pool.query(
      `UPDATE tasks SET helper_id = $1, status = 'in_progress' WHERE id = $2 RETURNING *`,
      [helper_id, req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/tasks/:id/complete - mark task as completed
router.post('/:id/complete', authMiddleware, async (req, res) => {
  try {
    const task = await pool.query('SELECT * FROM tasks WHERE id = $1', [req.params.id]);
    if (task.rows.length === 0) return res.status(404).json({ error: 'Task not found' });
    if (task.rows[0].customer_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    const result = await pool.query(
      `UPDATE tasks SET status = 'completed', completed_at = NOW() WHERE id = $1 RETURNING *`,
      [req.params.id]
    );
    res.json(result.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// DELETE /api/tasks/:id - delete task (owner only)
router.delete('/:id', authMiddleware, async (req, res) => {
  try {
    const task = await pool.query('SELECT customer_id FROM tasks WHERE id = $1', [req.params.id]);
    if (task.rows.length === 0) return res.status(404).json({ error: 'Task not found' });
    if (task.rows[0].customer_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }
    await pool.query('DELETE FROM tasks WHERE id = $1', [req.params.id]);
    res.json({ message: 'Task deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;