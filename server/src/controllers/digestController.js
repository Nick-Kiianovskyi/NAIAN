const DigestService = require('../services/digestService');
const asyncHandler = require('../middleware/asyncHandler');
const { parsePagination, parseSort, buildMeta } = require('../utils/pagination');

const SORTABLE = ['created_at', 'generated_at', 'updated_at', 'status', 'title', 'is_read'];

const DigestController = {
  list: asyncHandler(async (req, res) => {
    const { page, limit, offset } = parsePagination(req.query);
    const { sortBy, order } = parseSort(
      req.query,
      SORTABLE,
      { sortBy: 'created_at', order: 'desc' }
    );

    const filters = {};
    if (req.query.status) filters.status = String(req.query.status);
    if (req.query.region_id !== undefined) filters.region_id = parseInt(req.query.region_id, 10);
    if (req.query.topic_id !== undefined) filters.topic_id = parseInt(req.query.topic_id, 10);
    if (req.query.is_read !== undefined) filters.is_read = req.query.is_read === 'true';

    const { data, total } = await DigestService.list(req.user.id, {
      limit,
      offset,
      sortBy,
      order,
      filters,
    });

    res.json({ status: 'ok', data, meta: buildMeta(total, page, limit) });
  }),

  byId: asyncHandler(async (req, res) => {
    const digest = await DigestService.getById(
      req.user.id,
      req.user.role,
      parseInt(req.params.id, 10)
    );
    res.json({ status: 'ok', data: digest });
  }),

  generate: asyncHandler(async (req, res) => {
    const digest = await DigestService.generate(req.user.id, {
      regionId: req.body.region_id,
      topicIds: req.body.topic_ids,
      limit: req.body.limit,
    });
    res.status(201).json({
      status: 'ok',
      message: 'Digest generated (mock AI + mock RSS)',
      data: digest,
    });
  }),
};

module.exports = DigestController;