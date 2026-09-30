const pool = require('../config/database');

const SELECT_TOPICS = `(
  SELECT COALESCE(json_agg(json_build_object('id', t.id, 'name', t.name, 'slug', t.slug) ORDER BY t.id), '[]'::json)
  FROM article_topics at
  JOIN topics t ON t.id = at.topic_id
  WHERE at.article_id = a.id
)`;

const SORT_COLUMNS = {
  published_at: 'a.published_at',
  title: 'a.title',
  sentiment: 'a.sentiment',
  created_at: 'a.created_at',
};

const ArticleRepository = {
  async findAll({ limit, offset, sortBy, order, filters }) {
    const conditions = [];
    const values = [];
    let i = 1;

    if (filters?.region_id !== undefined) {
      conditions.push(`a.region_id = $${i++}`);
      values.push(filters.region_id);
    }
    if (filters?.source_id !== undefined) {
      conditions.push(`a.source_id = $${i++}`);
      values.push(filters.source_id);
    }
    if (filters?.sentiment) {
      conditions.push(`a.sentiment = $${i++}`);
      values.push(filters.sentiment);
    }
    if (filters?.query) {
      conditions.push(`a.title ILIKE $${i++}`);
      values.push(`%${filters.query}%`);
    }
    if (filters?.topic_id !== undefined) {
      conditions.push(
        `EXISTS (SELECT 1 FROM article_topics atx WHERE atx.article_id = a.id AND atx.topic_id = $${i++})`
      );
      values.push(filters.topic_id);
    }
    if (filters?.published_from) {
      conditions.push(`a.published_at >= $${i++}`);
      values.push(filters.published_from);
    }
    if (filters?.published_to) {
      conditions.push(`a.published_at <= $${i++}`);
      values.push(filters.published_to);
    }
    if (filters?.is_duplicate !== undefined) {
      conditions.push(`a.is_duplicate = $${i++}`);
      values.push(filters.is_duplicate);
    }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    const sortCol = SORT_COLUMNS[sortBy] || SORT_COLUMNS.published_at;

    const { rows } = await pool.query(
      `SELECT a.id, a.region_id, a.title, a.url, a.source, a.author, a.summary,
              a.sentiment, a.published_at, a.fetched_at, a.is_duplicate, a.source_id,
              s.name AS source_name, s.domain AS source_domain,
              ${SELECT_TOPICS} AS topics,
              COUNT(*) OVER() AS total_count
       FROM articles a
       LEFT JOIN sources s ON s.id = a.source_id
       ${where}
       ORDER BY ${sortCol} ${order}
       LIMIT $${i++} OFFSET $${i++}`,
      [...values, limit, offset]
    );

    const total = rows.length ? parseInt(rows[0].total_count, 10) : 0;
    const data = rows.map(({ total_count, ...rest }) => rest);
    return { data, total };
  },

  async findById(id) {
    const { rows } = await pool.query(
      `SELECT a.*, s.name AS source_name, s.domain AS source_domain, ${SELECT_TOPICS} AS topics
       FROM articles a
       LEFT JOIN sources s ON s.id = a.source_id
       WHERE a.id = $1`,
      [id]
    );

    if (!rows[0]) {
      return null;
    }

    const article = rows[0];
    const eventsResult = await pool.query(
      `SELECT e.id, e.title, e.description, e.significance, e.importance_score,
              e.category, e.region_id, e.ai_summary
       FROM event_sources es
       JOIN events e ON e.id = es.event_id
       WHERE es.article_id = $1
       ORDER BY e.importance_score DESC NULLS LAST`,
      [id]
    );
    article.events = eventsResult.rows;
    return article;
  },

  async findByUrl(url) {
    const { rows } = await pool.query(
      `SELECT id, title, url, source, summary, sentiment, published_at, region_id
       FROM articles WHERE url = $1 LIMIT 1`,
      [url]
    );
    return rows[0] || null;
  },

  async createFromFeed(item) {
    const { rows } = await pool.query(
      `INSERT INTO articles (region_id, title, url, source, summary, raw_text, content,
                             sentiment, published_at, metadata)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)
       RETURNING id, title, url, source, summary, sentiment, published_at, region_id`,
      [
        item.regionId ?? null,
        item.title,
        item.url,
        item.source,
        item.summary ?? null,
        item.summary ?? null,
        item.summary ?? null,
        item.sentiment ?? 'neutral',
        item.publishedAt ?? new Date(),
        JSON.stringify({ raw: item.raw || {}, content_hash: item.contentHash ?? null, source: 'mock-rss' }),
      ]
    );
    const article = rows[0];

    for (const topicId of item.topicIds || []) {
      await pool.query(
        `INSERT INTO article_topics (article_id, topic_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
        [article.id, topicId]
      );
    }

    return article;
  },

  async createManyFromFeed(items) {
    const saved = [];
    for (const item of items) {
      const existing = await this.findByUrl(item.url);
      if (existing) {
        saved.push({ ...existing, already_exists: true });
        continue;
      }
      saved.push({ ...(await this.createFromFeed(item)), already_exists: false });
    }
    return saved;
  },
};

module.exports = ArticleRepository;