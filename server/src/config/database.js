const { Pool } = require('pg');
require('dotenv').config();

const config = {
  host:     process.env.DB_HOST || 'localhost',
  port:     parseInt(process.env.DB_PORT, 10) || 5432,
  database: process.env.DB_NAME || 'naian',
  user:     process.env.DB_USER || 'postgres',
  max:      20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
};

if (process.env.DB_PASSWORD) {
  config.password = process.env.DB_PASSWORD;
}

const pool = new Pool(config);

pool.on('error', (err) => {
  console.error('[DB] Unexpected error on idle client:', err.message);
});

module.exports = pool;