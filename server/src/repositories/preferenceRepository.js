const pool = require('../config/database');

const PreferenceRepository = {
  async findByUserId(userId) {
    const { rows } = await pool.query(
      'SELECT id, region_id, topic_id, digest_frequency, notify_email, importance_min, created_at, updated_at FROM user_preferences WHERE user_id = $1 ORDER BY id',
      [userId]
    );
    return rows;
  },

  async deleteAllForUser(userId, client = pool) {
    await client.query('DELETE FROM user_preferences WHERE user_id = $1', [userId]);
  },

  async insert(userId, { regionId, topicId, digestFrequency, notifyEmail, importanceMin }, client = pool) {
    const { rows } = await client.query(
      `INSERT INTO user_preferences
         (user_id, region_id, topic_id, digest_frequency, notify_email, importance_min)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, region_id, topic_id, digest_frequency, notify_email, importance_min`,
      [userId, regionId, topicId, digestFrequency, notifyEmail, importanceMin]
    );
    return rows[0];
  },
};

module.exports = PreferenceRepository;