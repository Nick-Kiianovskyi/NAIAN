const pool = require('../config/database');

const ReportRepository = {
  async create({ regionId, title, summary, periodStart, periodEnd, aiModel, tokensUsed }) {
    const { rows } = await pool.query(
      `INSERT INTO reports (region_id, title, summary, period_start, period_end, ai_model, tokens_used)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, region_id, title, summary, period_start, period_end, ai_model, tokens_used, created_at`,
      [regionId, title, summary, periodStart, periodEnd, aiModel, tokensUsed]
    );
    return rows[0];
  },

  async createWithTopics(client, { regionId, title, summary, periodStart, periodEnd, aiModel, tokensUsed, topicIds = [] }) {
    const { rows } = await client.query(
      `INSERT INTO reports (region_id, title, summary, period_start, period_end, ai_model, tokens_used)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING id, region_id, title, summary, period_start, period_end, ai_model, tokens_used, created_at`,
      [regionId, title, summary, periodStart, periodEnd, aiModel, tokensUsed]
    );
    const report = rows[0];

    for (const topicId of topicIds) {
      await client.query(
        `INSERT INTO report_topics (report_id, topic_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [report.id, topicId]
      );
    }

    return report;
  },
};

module.exports = ReportRepository;