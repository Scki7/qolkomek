const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { authMiddleware } = require('../middleware/auth');

const ALLOWED_SKILLS = [
  'Уборка', 'Ремонт', 'Сантехника', 'Электрика', 'Доставка',
  'Переезд', 'Садоводство', 'IT помощь', 'Репетиторство', 'Готовка',
  'Уход за детьми', 'Уход за пожилыми', 'Фотография', 'Дизайн',
  'Переводы', 'Сборка мебели', 'Покраска', 'Курьер', 'Автомобиль', 'Другое'
];

// GET /api/skills/list — список всех доступных навыков
router.get('/list', (req, res) => {
  res.json({ skills: ALLOWED_SKILLS });
});

// GET /api/skills/my — мои навыки
router.get('/my', authMiddleware, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT skill FROM helper_skills WHERE user_id = $1 ORDER BY skill',
      [req.user.id]
    );
    res.json({ skills: result.rows.map(r => r.skill) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/skills/my — сохранить список навыков (заменяет всё)
router.put('/my', authMiddleware, async (req, res) => {
  const { skills } = req.body;
  if (!Array.isArray(skills)) return res.status(400).json({ error: 'skills must be array' });

  const valid = skills.filter(s => ALLOWED_SKILLS.includes(s)).slice(0, 10);

  try {
    await pool.query('DELETE FROM helper_skills WHERE user_id = $1', [req.user.id]);
    if (valid.length > 0) {
      const values = valid.map((s, i) => `($1, $${i + 2})`).join(', ');
      await pool.query(
        `INSERT INTO helper_skills (user_id, skill) VALUES ${values}`,
        [req.user.id, ...valid]
      );
    }
    res.json({ skills: valid });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/skills/user/:id — навыки конкретного пользователя
router.get('/user/:id', async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT skill FROM helper_skills WHERE user_id = $1 ORDER BY skill',
      [req.params.id]
    );
    res.json({ skills: result.rows.map(r => r.skill) });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// PUT /api/skills/bio — обновить bio хелпера
router.put('/bio', authMiddleware, async (req, res) => {
  const { bio } = req.body;
  try {
    await pool.query('UPDATE users SET bio = $1 WHERE id = $2', [bio || '', req.user.id]);
    res.json({ message: 'Bio updated' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;