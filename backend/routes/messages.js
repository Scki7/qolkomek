const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authMiddleware } = require('../middleware/auth');

// GET /api/messages/:taskId - get messages for a task
router.get('/:taskId', authMiddleware, async (req, res) => {
  try {
    const task = await pool.query('SELECT * FROM tasks WHERE id = $1', [req.params.taskId]);
    if (task.rows.length === 0) return res.status(404).json({ error: 'Task not found' });
    const t = task.rows[0];
    if (t.customer_id !== req.user.id && t.helper_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }
    const result = await pool.query(
      `SELECT m.*, u.username as sender_name, u.avatar_url as sender_avatar
       FROM messages m
       JOIN users u ON m.sender_id = u.id
       WHERE m.task_id = $1
       ORDER BY m.created_at ASC`,
      [req.params.taskId]
    );
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// POST /api/messages/:taskId - send message
router.post('/:taskId', authMiddleware, async (req, res) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: 'Message content required' });
  try {
    const task = await pool.query('SELECT * FROM tasks WHERE id = $1', [req.params.taskId]);
    if (task.rows.length === 0) return res.status(404).json({ error: 'Task not found' });
    const t = task.rows[0];
    if (t.customer_id !== req.user.id && t.helper_id !== req.user.id) {
      return res.status(403).json({ error: 'Not authorized' });
    }
    const receiver_id = t.customer_id === req.user.id ? t.helper_id : t.customer_id;
    const result = await pool.query(
      `INSERT INTO messages (task_id, sender_id, receiver_id, content) VALUES ($1, $2, $3, $4) RETURNING *`,
      [req.params.taskId, req.user.id, receiver_id, content]
    );
    const msg = await pool.query(
      `SELECT m.*, u.username as sender_name, u.avatar_url as sender_avatar
       FROM messages m JOIN users u ON m.sender_id = u.id WHERE m.id = $1`,
      [result.rows[0].id]
    );
    res.status(201).json(msg.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
