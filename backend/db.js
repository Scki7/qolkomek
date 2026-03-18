const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

// ... дальше твой код с initDB ...

const initDB = async () => {
  try {
    await pool.query(`
      CREATE TABLE IF NOT EXISTS users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(100) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password VARCHAR(255) NOT NULL,
        avatar_url TEXT,
        rating DECIMAL(3,2) DEFAULT 0,
        rating_count INTEGER DEFAULT 0,
        is_blocked BOOLEAN DEFAULT FALSE,
        role VARCHAR(20) DEFAULT 'user',
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        category VARCHAR(100),
        payment DECIMAL(10,2),
        latitude DECIMAL(10,8),
        longitude DECIMAL(11,8),
        location_name VARCHAR(255),
        status VARCHAR(20) DEFAULT 'open',
        customer_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        helper_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
        created_at TIMESTAMP DEFAULT NOW(),
        completed_at TIMESTAMP
      );

      CREATE TABLE IF NOT EXISTS task_responses (
        id SERIAL PRIMARY KEY,
        task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
        helper_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        message TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(task_id, helper_id)
      );

      CREATE TABLE IF NOT EXISTS messages (
        id SERIAL PRIMARY KEY,
        task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
        sender_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        receiver_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        content TEXT NOT NULL,
        created_at TIMESTAMP DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS ratings (
        id SERIAL PRIMARY KEY,
        task_id INTEGER REFERENCES tasks(id) ON DELETE CASCADE,
        rater_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        rated_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        score INTEGER CHECK (score >= 1 AND score <= 5),
        comment TEXT,
        created_at TIMESTAMP DEFAULT NOW(),
        UNIQUE(task_id, rater_id)
      );

      CREATE TABLE IF NOT EXISTS reports (
        id SERIAL PRIMARY KEY,
        reporter_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        reported_user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
        task_id INTEGER REFERENCES tasks(id) ON DELETE SET NULL,
        reason TEXT,
        status VARCHAR(20) DEFAULT 'pending',
        created_at TIMESTAMP DEFAULT NOW()
      );
    `);
    console.log('✅ Database initialized successfully');
  } catch (err) {
    console.error('❌ Database init error:', err.message);
  }
};

module.exports = { pool, initDB };
