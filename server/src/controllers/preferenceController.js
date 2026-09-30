const PreferenceService = require('../services/preferenceService');
const asyncHandler = require('../middleware/asyncHandler');

const PreferenceController = {
  get: asyncHandler(async (req, res) => {
    const data = await PreferenceService.getByUserId(req.user.id);
    res.json({ status: 'ok', data });
  }),

  put: asyncHandler(async (req, res) => {
    const data = await PreferenceService.replace(req.user.id, req.body);
    res.json({ status: 'ok', data });
  }),
};

module.exports = PreferenceController;