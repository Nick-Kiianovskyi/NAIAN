const pool = require('../config/database');

async function testConnection() {
  try {
    const result = await pool.query('SELECT NOW() AS server_time, current_database() AS db_name');
    const { server_time, db_name } = result.rows[0];
    console.log('[DB] Connection successful');
    console.log(`[DB] Database: ${db_name}`);
    console.log(`[DB] Server time: ${server_time}`);
    return true;
  } catch (err) {
    console.error('[DB] Connection failed:', err.message);
    return false;
  } finally {
    await pool.end();
  }
}

if (require.main === module) {
  testConnection().then((ok) => process.exit(ok ? 0 : 1));
}

module.exports = testConnection;