const AuthService = require('../services/authService');
const AppError = require('../utils/AppError');
const asyncHandler = require('./asyncHandler');

const authenticate = asyncHandler(async (req, res, next) => {
  const header = req.headers.authorization;
  if (!header || !header.startsWith('Bearer ')) {
    throw new AppError(401, 'Authentication required');
  }

  const token = header.slice(7);
  req.user = await AuthService.getUserByToken(token);
  next();
});

module.exports = authenticate;