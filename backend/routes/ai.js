const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages';
// ВАЖНО: Только это название модели сейчас актуально
const ANTHROPIC_MODEL = 'claude-3-5-sonnet-20240620'; 

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

// Функция-чистильщик: вытаскивает JSON, даже если ИИ прислал лишний текст
const safeJsonParse = (text) => {
  try {
    const match = text.match(/\{[\s\S]*\}/);
    return JSON.parse(match ? match[0] : text);
  } catch (e) {
    console.error("Failed to parse AI JSON. Raw text:", text);
    return null;
  }
};

// 1. Поиск задач для хелпера (Match Tasks)
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
      `ID:${t.id} | ${t.title} | ${t.category} | ${t.payment}₸`
    ).join('\n');

    const systemPrompt = `Ты AI QolKomek. Найди топ-5 задач для хелпера. 
    Верни ТОЛЬКО JSON: {"tasks": [{"task_id": 1, "reason": "почему подходит"}]}`;
    
    const userMessage = `Навыки: "${bio}"\n\nСписок задач:\n${tasksList}`;

    const aiResponse = await callClaude(systemPrompt, userMessage);
    const parsed = safeJsonParse(aiResponse);

    if (!parsed || !parsed.tasks) throw new Error("AI returned invalid format");

    const enriched = parsed.tasks.map(rec => {
      // Используем Number() чтобы ID точно совпали
      const task = tasks.find(t => Number(t.id) === Number(rec.task_id));
      return task ? { ...task, reason: rec.reason } : null;
    }).filter(Boolean);

    res.json({ tasks: enriched });
  } catch (err) {
    console.error('AI match error:', err);
    res.status(500).json({ error: err.message });
  }
});

// 2. Оценка цены (Suggest Price)
router.post('/suggest-price', authMiddleware, async (req, res) => {
  const { task_title, task_description, task_category } = req.body;
  try {
    const systemPrompt = `Ты эксперт по ценам в Казахстане (₸). Оцени задачу. 
    Верни ТОЛЬКО JSON: {"min_price": 0, "recommended_price": 0, "max_price": 0, "explanation": "..."}`;
    
    const userMessage = `Задача: ${task_title}. Описание: ${task_description}. Категория: ${task_category}`;
    
    const aiResponse = await callClaude(systemPrompt, userMessage);
    const parsed = safeJsonParse(aiResponse);
    
    res.json(parsed || { error: "Failed to estimate" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;