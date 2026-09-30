const NewsService = require('../services/newsService');
const asyncHandler = require('../middleware/asyncHandler');
const { parsePagination, parseSort, buildMeta } = require('../utils/pagination');

const NewsController = {
  list: asyncHandler(async (req, res) => {
    const { page, limit, offset } = parsePagination(req.query);
    const { sortBy, order } = parseSort(
      req.query,
      ['published_at', 'title', 'sentiment', 'created_at'],
      { sortBy: 'published_at', order: 'desc' }
    );

    const filters = {};

    const regionId = parseInt(req.query.region_id, 10);
    if (Number.isInteger(regionId) && regionId > 0) filters.region_id = regionId;

    const topicId = parseInt(req.query.topic_id, 10);
    if (Number.isInteger(topicId) && topicId > 0) filters.topic_id = topicId;

    const sourceId = parseInt(req.query.source_id, 10);
    if (Number.isInteger(sourceId) && sourceId > 0) filters.source_id = sourceId;

    if (req.query.sentiment) filters.sentiment = String(req.query.sentiment);
    if (req.query.query) filters.query = String(req.query.query);
    if (req.query.published_from) filters.published_from = String(req.query.published_from);
    if (req.query.published_to) filters.published_to = String(req.query.published_to);
    if (req.query.is_duplicate !== undefined) {
      filters.is_duplicate = req.query.is_duplicate === 'true';
    }

    const { data, total } = await NewsService.list({
      limit,
      offset,
      sortBy,
      order,
      filters,
    });
    res.json({ status: 'ok', data, meta: buildMeta(total, page, limit) });
  }),

  byId: asyncHandler(async (req, res) => {
    const article = await NewsService.getById(parseInt(req.params.id, 10));
    res.json({ status: 'ok', data: article });
  }),
};

module.exports = NewsController;