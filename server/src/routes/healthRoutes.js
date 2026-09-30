const express = require('express');
const pool = require('../config/database');

const router = express.Router();

router.get('/db', async (req, res) => {
  try {
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
  } catch (err) {
    res.status(503).json({
      status: 'error',
      message: err.message,
    });
  }
});

module.exports = router;