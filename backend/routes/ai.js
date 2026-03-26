const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
const ANTHROPIC_MODEL = 'claude-sonnet-4-5'; // актуальная модель

async function callClaude(systemPrompt, userMessage) {
  const response = await fetch(ANTHROPIC_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': process.env.ANTHROPIC_API_KEY,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: ANTHROPIC_MODEL,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!response.ok) {
    const err = await response.json();
    throw new Error(err.error?.message || 'Claude API Error');
  }

  const data = await response.json();
  return data.content[0].text;
}

const safeJsonParse = (text) => {
  try {
    const match = text.match(/\{[\s\S]*\}/);
    return JSON.parse(match ? match[0] : text);
  } catch (e) {
    console.error('Failed to parse AI JSON. Raw text:', text);
    return null;
  }
};

// POST /api/ai/match-tasks — подобрать задачи для хелпера по его bio
router.post('/match-tasks', authMiddleware, async (req, res) => {
  const { bio } = req.body;
  if (!bio?.trim()) return res.status(400).json({ error: 'bio is required' });

  try {
    const tasksResult = await pool.query(`
      SELECT id, title, description, category, payment
      FROM tasks
      WHERE status = 'open' AND customer_id != $1
      ORDER BY created_at DESC LIMIT 30
    `, [req.user.id]);

    const tasks = tasksResult.rows;
    if (tasks.length === 0) return res.json({ tasks: [] });

    const tasksList = tasks.map(t =>
      `ID:${t.id} | ${t.title} | ${t.category || 'no category'} | ${t.payment || '?'} ₸`
    ).join('\n');

    const systemPrompt = `You are a QolKomek AI assistant. Find top-5 tasks matching the helper's skills.
Return ONLY JSON: {"tasks": [{"task_id": 1, "reason": "why it matches (1 sentence)"}]}`;

    const userMessage = `Helper skills: "${bio}"\n\nAvailable tasks:\n${tasksList}`;

    const aiResponse = await callClaude(systemPrompt, userMessage);
    const parsed = safeJsonParse(aiResponse);

    if (!parsed || !parsed.tasks) throw new Error('AI returned invalid format');

    const enriched = parsed.tasks.map(rec => {
      const task = tasks.find(t => Number(t.id) === Number(rec.task_id));
      return task ? { ...task, reason: rec.reason } : null;
    }).filter(Boolean);

    res.json({ tasks: enriched });
  } catch (err) {
    console.error('AI match-tasks error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/suggest-price — оценить цену задачи
router.post('/suggest-price', authMiddleware, async (req, res) => {
  const { task_title, task_description, task_category } = req.body;
  if (!task_title) return res.status(400).json({ error: 'task_title is required' });

  try {
    // Средние цены по категории из БД
    const statsResult = await pool.query(`
      SELECT AVG(payment) as avg, MIN(payment) as min, MAX(payment) as max, COUNT(*) as count
      FROM tasks WHERE category = $1 AND payment IS NOT NULL AND payment > 0
    `, [task_category || '']);
    const stats = statsResult.rows[0];
    const platformStats = stats.count > 0
      ? `Platform data: avg ${Math.round(stats.avg)} ₸, min ${Math.round(stats.min)} ₸, max ${Math.round(stats.max)} ₸`
      : 'No similar tasks on platform yet';

    const systemPrompt = `You are a pricing expert for QolKomek platform in Kazakhstan (Almaty).
Return ONLY JSON: {"min_price": 0, "recommended_price": 0, "max_price": 0, "explanation": "2-3 sentences"}`;

    const userMessage = `Task: "${task_title}"
Description: "${task_description || 'not provided'}"
Category: "${task_category || 'not provided'}"
${platformStats}
Suggest a fair price in KZT (tenge).`;

    const aiResponse = await callClaude(systemPrompt, userMessage);
    const parsed = safeJsonParse(aiResponse);

    if (!parsed) throw new Error('AI returned invalid format');
    res.json(parsed);
  } catch (err) {
    console.error('AI suggest-price error:', err);
    res.status(500).json({ error: err.message });
  }
});

// POST /api/ai/recommend-helpers — подобрать хелперов для задачи заказчика
router.post('/recommend-helpers', authMiddleware, async (req, res) => {
  const { task_title, task_description, task_category } = req.body;
  if (!task_title) return res.status(400).json({ error: 'task_title is required' });

  try {
    const helpersResult = await pool.query(`
      SELECT u.id, u.username, u.rating, u.rating_count,
        COALESCE(u.bio, '') as bio,
        COUNT(t.id) FILTER (WHERE t.status = 'completed') as completed_tasks
      FROM users u
      LEFT JOIN tasks t ON t.helper_id = u.id
      WHERE u.role = 'user' AND u.is_blocked = FALSE AND u.id != $1
      GROUP BY u.id
      ORDER BY u.rating DESC LIMIT 20
    `, [req.user.id]);

    const helpers = helpersResult.rows;
    if (helpers.length === 0) return res.json({ recommendations: [] });

    const helpersList = helpers.map(h =>
      `ID:${h.id} | ${h.username} | Rating:${h.rating || 0} | Tasks:${h.completed_tasks} | About:${h.bio || 'not specified'}`
    ).join('\n');

    const systemPrompt = `You are a QolKomek AI assistant. Find top-3 helpers for this task.
Return ONLY JSON: {"recommendations": [{"helper_id": 1, "reason": "why this helper (1-2 sentences)"}]}`;

    const userMessage = `Task: "${task_title}"
Description: "${task_description || 'not provided'}"
Category: "${task_category || 'not provided'}"

Available helpers:
${helpersList}

Pick top-3 most suitable helpers.`;

    const aiResponse = await callClaude(systemPrompt, userMessage);
    const parsed = safeJsonParse(aiResponse);

    if (!parsed || !parsed.recommendations) throw new Error('AI returned invalid format');

    const enriched = parsed.recommendations.map(rec => {
      const helper = helpers.find(h => Number(h.id) === Number(rec.helper_id));
      return helper ? { ...helper, reason: rec.reason } : null;
    }).filter(Boolean);

    res.json({ recommendations: enriched });
  } catch (err) {
    console.error('AI recommend-helpers error:', err);
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;