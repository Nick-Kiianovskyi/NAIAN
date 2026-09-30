const pool = require('../config/database');

const SELECT_COLUMNS =
  'id, name, slug, rss_query, country, timezone, lat, lng, is_active, created_at, updated_at';

const RegionRepository = {
  async findAll({ limit, offset, sortBy, order, filters }) {
    const conditions = [];
    const values = [];
    let i = 1;

    if (filters?.name) {
      conditions.push(`name ILIKE $${i++}`);
      values.push(`%${filters.name}%`);
    }
    if (filters?.country) {
      conditions.push(`country ILIKE $${i++}`);
      values.push(`%${filters.country}%`);
    }
    if (filters?.is_active !== undefined) {
      conditions.push(`is_active = $${i++}`);
      values.push(filters.is_active);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const { rows } = await pool.query(
      `SELECT ${SELECT_COLUMNS}, COUNT(*) OVER() AS total_count
       FROM regions
       ${where}
       ORDER BY ${sortBy} ${order}
       LIMIT $${i++} OFFSET $${i++}`,
      [...values, limit, offset]
    );

    const total = rows.length ? parseInt(rows[0].total_count, 10) : 0;
    const data = rows.map(({ total_count, ...rest }) => rest);
    return { data, total };
  },

  async findById(id) {
    const { rows } = await pool.query(
      `SELECT ${SELECT_COLUMNS} FROM regions WHERE id = $1`,
      [id]
    );
    return rows[0] || null;
  },
};

module.exports = RegionRepository;