const SourceService = require('../services/sourceService');
const asyncHandler = require('../middleware/asyncHandler');
const AppError = require('../utils/AppError');
const { parsePagination, parseSort, buildMeta } = require('../utils/pagination');

const SourceController = {
  list: asyncHandler(async (req, res) => {
    const { page, limit, offset } = parsePagination(req.query);
    const { sortBy, order } = parseSort(
      req.query,
      ['name', 'reliability', 'type', 'created_at'],
      { sortBy: 'name', order: 'asc' }
    );

    const filters = {};
    if (req.query.name) filters.name = String(req.query.name);
    if (req.query.type) filters.type = String(req.query.type);
    if (req.query.country) filters.country = String(req.query.country);
    if (req.query.is_active !== undefined) filters.is_active = req.query.is_active === 'true';

    const { data, total } = await SourceService.list({
      limit,
      offset,
      sortBy,
      order,
      filters,
    });
    res.json({ status: 'ok', data, meta: buildMeta(total, page, limit) });
  }),

  create: asyncHandler(async (req, res) => {
    const source = await SourceService.create(req.body);
    res.status(201).json({ status: 'ok', data: source });
  }),

  update: asyncHandler(async (req, res) => {
    const source = await SourceService.update(parseInt(req.params.id, 10), req.body);
    res.json({ status: 'ok', data: source });
  }),

  remove: asyncHandler(async (req, res) => {
    await SourceService.remove(parseInt(req.params.id, 10));
    res.json({ status: 'ok', message: 'Source deleted' });
  }),

  byId: asyncHandler(async (req, res) => {
    const source = await SourceService.getById(parseInt(req.params.id, 10));
    if (!source) {
      throw new AppError(404, 'Source not found');
    }
    res.json({ status: 'ok', data: source });
  }),
};

module.exports = SourceController;