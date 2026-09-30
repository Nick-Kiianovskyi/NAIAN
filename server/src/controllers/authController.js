const AuthService = require('../services/authService');
const asyncHandler = require('../middleware/asyncHandler');

const AuthController = {
  register: asyncHandler(async (req, res) => {
    const user = await AuthService.register(req.body);
    res.status(201).json({ status: 'ok', user });
  }),

  login: asyncHandler(async (req, res) => {
    const { token, user } = await AuthService.login(req.body);
    res.json({ status: 'ok', token, user });
  }),

  me: asyncHandler(async (req, res) => {
    res.json({ status: 'ok', user: req.user });
  }),
};

module.exports = AuthController;