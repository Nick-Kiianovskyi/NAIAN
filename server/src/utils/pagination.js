const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 100;

const parsePagination = (query) => {
  const page = Math.max(parseInt(query.page, 10) || 1, 1);
  const limit = Math.min(Math.max(parseInt(query.limit, 10) || DEFAULT_LIMIT, 1), MAX_LIMIT);
  return { page, limit, offset: (page - 1) * limit };
};

const parseSort = (query, allowed, { sortBy: defaultSortBy, order: defaultOrder = 'asc' } = {}) => {
  const sortBy = allowed.includes(query.sortBy) ? query.sortBy : defaultSortBy;
  const order = ['asc', 'desc'].includes(query.order) ? query.order : defaultOrder;
  return { sortBy, order };
};

const buildMeta = (total, page, limit) => {
  const totalPages = total === 0 ? 0 : Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNext: page < totalPages,
    hasPrev: page > 1,
  };
};

module.exports = { parsePagination, parseSort, buildMeta };