const RegionService = require('../services/regionService');
const asyncHandler = require('../middleware/asyncHandler');
const AppError = require('../utils/AppError');
const { parsePagination, parseSort, buildMeta } = require('../utils/pagination');

const RegionController = {
  list: asyncHandler(async (req, res) => {
    const { page, limit, offset } = parsePagination(req.query);
    const { sortBy, order } = parseSort(
      req.query,
      ['name', 'country', 'created_at', 'is_active'],
      { sortBy: 'name', order: 'asc' }
    );

    const filters = {};
    if (req.query.name) filters.name = String(req.query.name);
    if (req.query.country) filters.country = String(req.query.country);
    if (req.query.is_active !== undefined) filters.is_active = req.query.is_active === 'true';

    const { data, total } = await RegionService.list({
      limit,
      offset,
      sortBy,
      order,
      filters,
    });
    res.json({ status: 'ok', data, meta: buildMeta(total, page, limit) });
  }),

  byId: asyncHandler(async (req, res) => {
    const region = await RegionService.getById(parseInt(req.params.id, 10));
    if (!region) {
      throw new AppError(404, 'Region not found');
    }
    res.json({ status: 'ok', data: region });
  }),
};

module.exports = RegionController;