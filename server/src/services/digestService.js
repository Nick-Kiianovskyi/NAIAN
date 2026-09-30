const DigestRepository = require('../repositories/digestRepository');
const ReportRepository = require('../repositories/reportRepository');
const RegionRepository = require('../repositories/regionRepository');
const TopicRepository = require('../repositories/topicRepository');
const PreferenceRepository = require('../repositories/preferenceRepository');
const AIService = require('./aiService');
const RSSService = require('./rssService');
const pool = require('../config/database');
const AppError = require('../utils/AppError');
const { ROLES } = require('../constants/roles');

const DIGEST_STATUS = {
  GENERATING: 'generating',
  PUBLISHED: 'published',
  FAILED: 'failed',
};

const DigestService = {
  DIGEST_STATUS,

  async list(userId, { limit, offset, sortBy, order, filters } = {}) {
    return DigestRepository.findAll({
      userId,
      limit,
      offset,
      sortBy: DigestRepository.SORT_COLUMNS[sortBy] || DigestRepository.SORT_COLUMNS.created_at,
      order,
      filters,
    });
  },

  async getById(userId, role, id) {
    const digest = await DigestRepository.findById(id);
    if (!digest) {
      throw new AppError(404, 'Digest not found');
    }

    if (digest.user_id !== userId && role !== ROLES.ADMIN && role !== ROLES.ANALYST) {
      throw new AppError(403, 'No access to this digest');
    }

    digest.articles = await DigestRepository.findArticles(id);
    return digest;
  },

  /**
   * Пайплайн: RSSService (mock) -> articles в PostgreSQL -> AIService (mock) -> report -> digest.
   */
  async generate(userId, { regionId, topicIds, limit } = {}) {
    const { region, topics } = await resolveScope(userId, { regionId, topicIds });

    const client = await pool.connect();
    let digestId = null;

    try {
      await client.query('BEGIN');

      const fetched = await RSSService.fetchArticles({ region, topics, limit });
      if (fetched.length === 0) {
        throw new AppError(422, 'RSS feed returned no items');
      }

      const articles = [];
      for (const item of fetched) {
        const existing = await client.query(
          'SELECT id, title, url, source, summary, sentiment, published_at, region_id FROM articles WHERE url = $1 LIMIT 1',
          [item.url]
        );
        if (existing.rows[0]) {
          articles.push({ ...existing.rows[0], already_exists: true });
          continue;
        }

        const inserted = await client.query(
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
        const article = inserted.rows[0];

        for (const topicId of item.topicIds || []) {
          await client.query(
            'INSERT INTO article_topics (article_id, topic_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [article.id, topicId]
          );
        }

        articles.push({ ...article, already_exists: false });
      }

      const periodStart = articles.reduce(
        (min, a) => (!min || new Date(a.published_at) < new Date(min) ? a.published_at : min),
        null
      );
      const periodEnd = articles.reduce(
        (max, a) => (!max || new Date(a.published_at) > new Date(max) ? a.published_at : max),
        null
      );

      const analysis = await AIService.generateDigest(articles, { region, topics });

      const report = await ReportRepository.createWithTopics(client, {
        regionId: region.id,
        title: analysis.title,
        summary: analysis.summary,
        periodStart,
        periodEnd,
        aiModel: AIService.AI_PROVIDER,
        tokensUsed: analysis.tokens_used,
        topicIds: topics.map((t) => t.id),
      });

      const digest = await client.query(
        `INSERT INTO digests (user_id, region_id, topic_id, report_id, title,
                              period_start, period_end, status, delivery_channel, is_read)
         VALUES ($1, $2, $3, $4, $5, $6, $7, $8, 'email', false)
         RETURNING id`,
        [userId, region.id, topics[0]?.id ?? null, report.id, analysis.title, periodStart, periodEnd, DIGEST_STATUS.GENERATING]
      );
      digestId = digest.rows[0].id;

      const relevanceOf = (index) => Math.round((1 - index / articles.length) * 100) / 100;
      await DigestRepository.linkArticles(
        client,
        digestId,
        articles.map((a, index) => ({ id: a.id, relevance: relevanceOf(index) }))
      );

      await DigestRepository.updateStatus(digestId, DIGEST_STATUS.PUBLISHED, client);

      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      if (digestId) {
        await pool
          .query('UPDATE digests SET status = $2, updated_at = NOW() WHERE id = $1', [
            digestId,
            DIGEST_STATUS.FAILED,
          ])
          .catch(() => {});
      }
      throw error;
    } finally {
      client.release();
    }

    return this.getById(userId, ROLES.USER, digestId);
  },
};

async function resolveScope(userId, { regionId, topicIds } = {}) {
  const preferences = await PreferenceRepository.findByUserId(userId);
  const prefItems = preferences.map((row) => ({ region_id: row.region_id, topic_id: row.topic_id }));

  let region;
  if (regionId !== undefined) {
    region = await RegionRepository.findById(regionId);
    if (!region) {
      throw new AppError(404, 'Region not found');
    }
  } else {
    const prefRegionId = prefItems.find((i) => i.region_id)?.region_id;
    region = prefRegionId
      ? await RegionRepository.findById(prefRegionId)
      : await RegionRepository.findById(1);
  }

  let topics = [];
  if (topicIds?.length) {
    topics = await Promise.all(topicIds.map((id) => TopicRepository.findById(id)));
    if (topics.some((t) => !t)) {
      throw new AppError(404, 'Topic not found');
    }
  } else {
    const prefTopicIds = prefItems.map((i) => i.topic_id).filter(Boolean);
    topics = prefTopicIds.length
      ? (await Promise.all(prefTopicIds.map((id) => TopicRepository.findById(id)))).filter(Boolean)
      : (await TopicRepository.findAll({ limit: 2, offset: 0, sortBy: 'id', order: 'ASC' })).data;
  }

  return { region, topics };
}

module.exports = DigestService;