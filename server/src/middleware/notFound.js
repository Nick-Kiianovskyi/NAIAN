const AppError = require('../utils/AppError');

const notFound = (req, res, next) => {
  next(new AppError(404, `Route ${req.method} ${req.originalUrl} not found`));
};

module.exports = notFound;