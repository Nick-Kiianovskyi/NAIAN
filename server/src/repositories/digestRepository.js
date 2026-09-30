const pool = require('../config/database');

const SELECT_COLUMNS = `
  d.id, d.user_id, d.region_id, d.topic_id, d.report_id, d.title,
  d.period_start, d.period_end, d.status, d.delivery_channel,
  d.is_read, d.generated_at, d.created_at, d.updated_at,
  r.name AS region_name, t.name AS topic_name,
  rep.title AS report_title, rep.summary AS report_summary
`;

const SORT_COLUMNS = {
  created_at: 'd.created_at',
  generated_at: 'd.generated_at',
  updated_at: 'd.updated_at',
  status: 'd.status',
  title: 'd.title',
  is_read: 'd.is_read',
};

const DigestRepository = {
  SORT_COLUMNS,

  async findAll({ userId, limit, offset, sortBy, order, filters }) {
    const conditions = ['d.user_id = $1'];
    const values = [userId];
    let i = 2;

    if (filters?.status) {
      conditions.push(`d.status = $${i++}`);
      values.push(filters.status);
    }
    if (filters?.region_id !== undefined) {
      conditions.push(`d.region_id = $${i++}`);
      values.push(filters.region_id);
    }
    if (filters?.topic_id !== undefined) {
      conditions.push(`d.topic_id = $${i++}`);
      values.push(filters.topic_id);
    }
    if (filters?.is_read !== undefined) {
      conditions.push(`d.is_read = $${i++}`);
      values.push(filters.is_read);
    }

    const { rows } = await pool.query(
      `SELECT ${SELECT_COLUMNS},
              (SELECT COUNT(*)::int FROM digest_articles da WHERE da.digest_id = d.id) AS articles_count,
              COUNT(*) OVER() AS total_count
       FROM digests d
       LEFT JOIN regions r ON r.id = d.region_id
       LEFT JOIN topics t ON t.id = d.topic_id
       LEFT JOIN reports rep ON rep.id = d.report_id
       WHERE ${conditions.join(' AND ')}
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
      `SELECT ${SELECT_COLUMNS},
              (SELECT COUNT(*)::int FROM digest_articles da WHERE da.digest_id = d.id) AS articles_count
       FROM digests d
       LEFT JOIN regions r ON r.id = d.region_id
       LEFT JOIN topics t ON t.id = d.topic_id
       LEFT JOIN reports rep ON rep.id = d.report_id
       WHERE d.id = $1`,
      [id]
    );
    return rows[0] || null;
  },

  async findArticles(digestId) {
    const { rows } = await pool.query(
      `SELECT da.article_order, da.relevance, da.added_at,
              a.id, a.title, a.url, a.source, a.summary, a.sentiment, a.published_at,
              r.name AS region_name
       FROM digest_articles da
       JOIN articles a ON a.id = da.article_id
       LEFT JOIN regions r ON r.id = a.region_id
       WHERE da.digest_id = $1
       ORDER BY da.article_order ASC, a.published_at DESC`,
      [digestId]
    );
    return rows;
  },

  async create({ userId, regionId, topicId, reportId, title, periodStart, periodEnd, status }) {
    const { rows } = await pool.query(
      `INSERT INTO digests (user_id, region_id, topic_id, report_id, title,
                            period_start, period_end, status, delivery_channel, is_read)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'email', false)
       RETURNING *`,
      [userId, regionId, topicId, reportId, title, periodStart, periodEnd, status]
    );
    return rows[0];
  },

  async updateStatus(id, status, client = pool) {
    const { rows } = await client.query(
      `UPDATE digests
       SET status = $2::varchar,
           generated_at = CASE WHEN $2::varchar = 'published' THEN NOW() ELSE generated_at END,
           updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id, status]
    );
    return rows[0] || null;
  },

  async linkArticles(client, digestId, articles) {
    for (const [index, article] of articles.entries()) {
      await client.query(
        `INSERT INTO digest_articles (digest_id, article_id, article_order, relevance, added_at)
         VALUES ($1, $2, $3, $4, NOW())
         ON CONFLICT DO NOTHING`,
        [digestId, article.id, index + 1, article.relevance ?? 1]
      );
    }
  },
};

module.exports = DigestRepository;