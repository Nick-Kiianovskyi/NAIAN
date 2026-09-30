const pool = require('../config/database');

const SELECT_COLUMNS =
  'id, name, domain, type, country, language, reliability, bias, scraping_priority, is_active, created_at, updated_at';

const SourceRepository = {
  async findAll({ limit, offset, sortBy, order, filters }) {
    const conditions = [];
    const values = [];
    let i = 1;

    if (filters?.name) {
      conditions.push(`name ILIKE $${i++}`);
      values.push(`%${filters.name}%`);
    }
    if (filters?.type) {
      conditions.push(`type = $${i++}`);
      values.push(filters.type);
    }
    if (filters?.country) {
      conditions.push(`country = $${i++}`);
      values.push(filters.country);
    }
    if (filters?.is_active !== undefined) {
      conditions.push(`is_active = $${i++}`);
      values.push(filters.is_active);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';

    const { rows } = await pool.query(
      `SELECT ${SELECT_COLUMNS}, COUNT(*) OVER() AS total_count
       FROM sources
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
      `SELECT ${SELECT_COLUMNS} FROM sources WHERE id = $1`,
      [id]
    );
    return rows[0] || null;
  },

  async create(data) {
    const { rows } = await pool.query(
      `INSERT INTO sources
         (name, domain, type, country, language, reliability, bias, scraping_priority, is_active)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
       RETURNING ${SELECT_COLUMNS}`,
      [
        data.name,
        data.domain ?? null,
        data.type ?? 'news',
        data.country ?? 'UA',
        data.language ?? 'uk',
        data.reliability ?? null,
        data.bias ?? null,
        data.scraping_priority ?? 1,
        data.is_active ?? true,
      ]
    );
    return rows[0];
  },

  async update(id, data) {
    const sets = [];
    const values = [];
    let i = 1;

    const fields = {
      name: 'name',
      domain: 'domain',
      type: 'type',
      country: 'country',
      language: 'language',
      reliability: 'reliability',
      bias: 'bias',
      scraping_priority: 'scraping_priority',
      is_active: 'is_active',
    };

    for (const [key, column] of Object.entries(fields)) {
      if (data[key] !== undefined) {
        sets.push(`${column} = $${i++}`);
        values.push(data[key]);
      }
    }

    if (sets.length === 0) {
      return this.findById(id);
    }

    sets.push('updated_at = NOW()');
    values.push(id);

    const { rows } = await pool.query(
      `UPDATE sources SET ${sets.join(', ')} WHERE id = $${i} RETURNING ${SELECT_COLUMNS}`,
      values
    );
    return rows[0] || null;
  },

  async remove(id) {
    const { rows } = await pool.query(
      'DELETE FROM sources WHERE id = $1 RETURNING id',
      [id]
    );
    return rows.length > 0;
  },
};

module.exports = SourceRepository;