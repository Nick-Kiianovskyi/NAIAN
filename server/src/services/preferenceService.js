const pool = require('../config/database');
const PreferenceRepository = require('../repositories/preferenceRepository');
const AppError = require('../utils/AppError');

const DEFAULT_SETTINGS = {
  digest_frequency: 'weekly',
  notify_email: true,
  importance_min: 0,
};

const buildResponse = (rows) => {
  const settings = { ...DEFAULT_SETTINGS };
  if (rows.length > 0) {
    settings.digest_frequency = rows[0].digest_frequency;
    settings.notify_email = rows[0].notify_email;
    settings.importance_min = rows[0].importance_min;
  }
  return {
    settings,
    items: rows.map((row) => ({
      region_id: row.region_id,
      topic_id: row.topic_id,
    })),
  };
};

const PreferenceService = {
  async getByUserId(userId) {
    const rows = await PreferenceRepository.findByUserId(userId);
    return buildResponse(rows);
  },

  async replace(userId, data) {
    const settings = {
      digest_frequency: data.digest_frequency ?? DEFAULT_SETTINGS.digest_frequency,
      notify_email: data.notify_email ?? DEFAULT_SETTINGS.notify_email,
      importance_min: data.importance_min ?? DEFAULT_SETTINGS.importance_min,
    };

    const items = data.items ?? [];

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await PreferenceRepository.deleteAllForUser(userId, client);

      const usedScopes = new Set();
      for (const item of items) {
        const regionId = item.region_id ?? null;
        const topicId = item.topic_id ?? null;
        const scope = `${regionId}:${topicId}`;
        if (usedScopes.has(scope)) {
          continue;
        }
        usedScopes.add(scope);
        await PreferenceRepository.insert(
          userId,
          {
            regionId,
            topicId,
            digestFrequency: settings.digest_frequency,
            notifyEmail: settings.notify_email,
            importanceMin: settings.importance_min,
          },
          client
        );
      }

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      if (error.code === '23514') {
        throw new AppError(400, 'Preference scope must have region_id or topic_id');
      }
      throw error;
    } finally {
      client.release();
    }

    return this.getByUserId(userId);
  },
};

module.exports = PreferenceService;