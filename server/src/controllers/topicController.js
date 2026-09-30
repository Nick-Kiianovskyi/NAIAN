const TopicService = require('../services/topicService');
const asyncHandler = require('../middleware/asyncHandler');
const AppError = require('../utils/AppError');
const { parsePagination, parseSort, buildMeta } = require('../utils/pagination');

const TopicController = {
  list: asyncHandler(async (req, res) => {
    const { page, limit, offset } = parsePagination(req.query);
    const { sortBy, order } = parseSort(
      req.query,
      ['name', 'created_at', 'is_active'],
      { sortBy: 'name', order: 'asc' }
    );

    const filters = {};
    if (req.query.name) filters.name = String(req.query.name);
    if (req.query.is_active !== undefined) filters.is_active = req.query.is_active === 'true';

    const { data, total } = await TopicService.list({
      limit,
      offset,
      sortBy,
      order,
      filters,
    });
    res.json({ status: 'ok', data, meta: buildMeta(total, page, limit) });
  }),

  byId: asyncHandler(async (req, res) => {
    const topic = await TopicService.getById(parseInt(req.params.id, 10));
    if (!topic) {
      throw new AppError(404, 'Topic not found');
    }
    res.json({ status: 'ok', data: topic });
  }),
};

module.exports = TopicController;