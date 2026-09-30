const UsersService = require('../services/usersService');
const asyncHandler = require('../middleware/asyncHandler');
const { parsePagination, buildMeta } = require('../utils/pagination');

const UsersController = {
  list: asyncHandler(async (req, res) => {
    const { page, limit, offset } = parsePagination(req.query);
    const { data, total } = await UsersService.list({ limit, offset });
    res.json({ status: 'ok', data, meta: buildMeta(total, page, limit) });
  }),

  updateMe: asyncHandler(async (req, res) => {
    const user = await UsersService.updateProfile(req.user.id, {
      displayName: req.body.displayName,
      avatarUrl: req.body.avatarUrl,
    });
    res.json({ status: 'ok', user });
  }),
};

module.exports = UsersController;