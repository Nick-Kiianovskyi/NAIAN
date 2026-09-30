const pool = require('../config/database');
const asyncHandler = require('../middleware/asyncHandler');

const HealthController = {
  db: asyncHandler(async (req, res) => {
    const start = Date.now();
    const result = await pool.query(
      'SELECT NOW() AS server_time, current_database() AS db_name, pg_postmaster_start_time() AS uptime'
    );
    const duration = Date.now() - start;
    const row = result.rows[0];

    res.json({
      status: 'ok',
      database: {
        name: row.db_name,
        serverTime: row.server_time,
        uptime: row.uptime,
      },
      latencyMs: duration,
    });
  }),
};

module.exports = HealthController;