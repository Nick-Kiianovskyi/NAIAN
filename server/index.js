require('dotenv').config();
const app = require('./src/app');
const pool = require('./src/config/database');

const PORT = process.env.PORT || 3001;

async function start() {
  try {
    const result = await pool.query('SELECT 1');
    console.log('[DB] PostgreSQL connected');
  } catch (err) {
    console.error('[DB] Cannot connect to PostgreSQL:', err.message);
    process.exit(1);
  }

  app.listen(PORT, () => {
    console.log(`[SERVER] Running on http://localhost:${PORT}`);
    console.log(`[SERVER] Health check: http://localhost:${PORT}/api/health/db`);
  });
}

start();