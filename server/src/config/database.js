const { Pool } = require('pg');
const env = require('./env');

const config = {
  host: env.DB_HOST,
  port: env.DB_PORT,
  database: env.DB_NAME,
  user: env.DB_USER,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 5000,
};

if (env.DB_PASSWORD) {
  config.password = env.DB_PASSWORD;
}

const pool = new Pool(config);

pool.on('error', (err) => {
  console.error('[DB] Unexpected error on idle client:', err.message);
});

module.exports = pool;