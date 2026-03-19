const express = require('express');
const router = express.Router();
const { pool, createNotification } = require('../db');
const { authMiddleware } = require('../middleware/auth');

router.get('/', authMiddleware, async (req, res) => {
  try {
    let result;
    if (req.user.role === 'admin') {
      result = await pool.query(`
        SELECT t.*, u.username as user_name, u.email as user_email,
          (SELECT COUNT(*) FROM support_messages sm WHERE sm.ticket_id = t.id) as message_count,
          (SELECT COUNT(*) FROM support_messages sm WHERE sm.ticket_id = t.id AND sm.is_admin = FALSE AND sm.is_read_by_admin = FALSE) as unread_count
        FROM support_tickets t
        JOIN users u ON t.user_id = u.id
        ORDER BY t.updated_at DESC
      `);
    } else {
      result = await pool.query(`
        SELECT t.*,
          (SELECT COUNT(*) FROM support_messages sm WHERE sm.ticket_id = t.id) as message_count,
          (SELECT COUNT(*) FROM support_messages sm WHERE sm.ticket_id = t.id AND sm.is_admin = TRUE AND sm.is_read_by_user = FALSE) as unread_count
        FROM support_tickets t
        WHERE t.user_id = $1
        ORDER BY t.updated_at DESC
      `, [req.user.id]);
    }
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authMiddleware, async (req, res) => {
  const { subject, message, category } = req.body;
  if (!subject || !message) return res.status(400).json({ error: 'Subject and message required' });
  try {
    const ticket = await pool.query(
      "INSERT INTO support_tickets (user_id, subject, category, status, updated_at) VALUES ($1,$2,$3,'open',NOW()) RETURNING *",
      [req.user.id, subject, category || 'general']
    );
    await pool.query(
      'INSERT INTO support_messages (ticket_id, user_id, content, is_admin) VALUES ($1,$2,$3,FALSE)',
      [ticket.rows[0].id, req.user.id, message]
    );
    const admins = await pool.query('SELECT id FROM users WHERE role = $1', ['admin']);
    for (const admin of admins.rows) {
      if (createNotification) {
        await createNotification(admin.id, 'new_ticket', 'New support ticket: ' + subject, message.slice(0, 80), '/admin');
      }
    }
    res.status(201).json(ticket.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.get('/:id', authMiddleware, async (req, res) => {
  try {
    const ticket = await pool.query(
      'SELECT t.*, u.username as user_name, u.email as user_email FROM support_tickets t JOIN users u ON t.user_id = u.id WHERE t.id = $1',
      [req.params.id]
    );
    if (ticket.rows.length === 0) return res.status(404).json({ error: 'Ticket not found' });
    const t = ticket.rows[0];
    if (t.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }
    const messages = await pool.query(
      'SELECT sm.*, u.username as sender_name FROM support_messages sm JOIN users u ON sm.user_id = u.id WHERE sm.ticket_id = $1 ORDER BY sm.created_at ASC',
      [req.params.id]
    );
    if (req.user.role === 'admin') {
      await pool.query('UPDATE support_messages SET is_read_by_admin = TRUE WHERE ticket_id = $1 AND is_admin = FALSE', [req.params.id]);
    } else {
      await pool.query('UPDATE support_messages SET is_read_by_user = TRUE WHERE ticket_id = $1 AND is_admin = TRUE', [req.params.id]);
    }
    res.json({ ticket: t, messages: messages.rows });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/reply', authMiddleware, async (req, res) => {
  const { content } = req.body;
  if (!content) return res.status(400).json({ error: 'Content required' });
  try {
    const ticket = await pool.query('SELECT * FROM support_tickets WHERE id = $1', [req.params.id]);
    if (ticket.rows.length === 0) return res.status(404).json({ error: 'Ticket not found' });
    const t = ticket.rows[0];
    if (t.user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }
    const isAdmin = req.user.role === 'admin';
    const msg = await pool.query(
      'INSERT INTO support_messages (ticket_id, user_id, content, is_admin, is_read_by_user, is_read_by_admin) VALUES ($1,$2,$3,$4,$5,$6) RETURNING *',
      [req.params.id, req.user.id, content, isAdmin, !isAdmin, isAdmin]
    );
    await pool.query(
      'UPDATE support_tickets SET updated_at = NOW(), status = $1 WHERE id = $2',
      [isAdmin ? 'answered' : 'open', req.params.id]
    );
    if (isAdmin && createNotification) {
      await createNotification(t.user_id, 'support_reply', 'Support replied to your ticket', content.slice(0, 80), '/support');
    }
    const fullMsg = await pool.query(
      'SELECT sm.*, u.username as sender_name FROM support_messages sm JOIN users u ON sm.user_id = u.id WHERE sm.id = $1',
      [msg.rows[0].id]
    );
    res.status(201).json(fullMsg.rows[0]);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/:id/close', authMiddleware, async (req, res) => {
  try {
    const ticket = await pool.query('SELECT * FROM support_tickets WHERE id = $1', [req.params.id]);
    if (ticket.rows.length === 0) return res.status(404).json({ error: 'Ticket not found' });
    if (ticket.rows[0].user_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Not authorized' });
    }
    await pool.query("UPDATE support_tickets SET status = 'closed', updated_at = NOW() WHERE id = $1", [req.params.id]);
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;