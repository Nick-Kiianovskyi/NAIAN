const pool = require('../config/database');

const SELECT_COLUMNS = 'id, email, display_name, avatar_url, role, status, last_login_at, created_at, updated_at';

const UserRepository = {
  async findByEmail(email) {
    const { rows } = await pool.query(
      'SELECT id, email, password_hash, display_name, avatar_url, role, status, last_login_at, created_at, updated_at FROM users WHERE email = $1',
      [email]
    );
    return rows[0] || null;
  },

  async findById(id) {
    const { rows } = await pool.query(
      `SELECT ${SELECT_COLUMNS} FROM users WHERE id = $1`,
      [id]
    );
    return rows[0] || null;
  },

  async create({ email, passwordHash, displayName = null, avatarUrl = null, role = 'user' }) {
    const { rows } = await pool.query(
      `INSERT INTO users (email, password_hash, display_name, avatar_url, role)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING ${SELECT_COLUMNS}`,
      [email, passwordHash, displayName, avatarUrl, role]
    );
    return rows[0];
  },

  async findAll({ limit = 50, offset = 0 } = {}) {
    const { rows } = await pool.query(
      `SELECT ${SELECT_COLUMNS}, COUNT(*) OVER() AS total_count
       FROM users ORDER BY id LIMIT $1 OFFSET $2`,
      [limit, offset]
    );
    const total = rows.length ? parseInt(rows[0].total_count, 10) : 0;
    const data = rows.map(({ total_count, ...rest }) => rest);
    return { data, total };
  },

  async updateLastLogin(id) {
    await pool.query('UPDATE users SET last_login_at = NOW() WHERE id = $1', [id]);
  },

  async update(id, data) {
    const sets = [];
    const values = [];
    let i = 1;

    if (data.displayName !== undefined) {
      sets.push(`display_name = $${i++}`);
      values.push(data.displayName);
    }
    if (data.avatarUrl !== undefined) {
      sets.push(`avatar_url = $${i++}`);
      values.push(data.avatarUrl);
    }
    if (data.status !== undefined) {
      sets.push(`status = $${i++}`);
      values.push(data.status);
    }
    if (data.role !== undefined) {
      sets.push(`role = $${i++}`);
      values.push(data.role);
    }

    if (sets.length === 0) {
      return this.findById(id);
    }

    sets.push('updated_at = NOW()');
    values.push(id);

    const { rows } = await pool.query(
      `UPDATE users SET ${sets.join(', ')} WHERE id = $${i} RETURNING ${SELECT_COLUMNS}`,
      values
    );
    return rows[0] || null;
  },
};

module.exports = UserRepository;