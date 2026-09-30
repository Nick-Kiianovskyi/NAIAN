const fs = require('fs');
const path = require('path');
const pool = require('../config/database');

async function migrate() {
  const migrationsDir = path.join(__dirname, '..', '..', 'migrations');
  const files = fs.readdirSync(migrationsDir)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf-8');
    console.log(`[MIGRATE] Running ${file}...`);
    try {
      await pool.query(sql);
      console.log(`[MIGRATE] ${file} completed`);
    } catch (err) {
      console.error(`[MIGRATE] ${file} failed:`, err.message);
      await pool.end();
      process.exit(1);
    }
  }

  console.log('[MIGRATE] All migrations completed');
  await pool.end();
}

migrate();