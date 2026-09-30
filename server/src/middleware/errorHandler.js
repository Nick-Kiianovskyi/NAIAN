const AppError = require('../utils/AppError');
const env = require('../config/env');

const errorHandler = (err, req, res, next) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: 'error',
      message: err.message,
      ...(err.details ? { details: err.details } : {}),
    });
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ status: 'error', message: 'Invalid JSON body' });
  }

  console.error('[ERROR]', err.stack || err.message);

  const response = { status: 'error', message: 'Internal Server Error' };
  if (env.NODE_ENV === 'development') {
    response.stack = err.stack;
  }
  res.status(500).json(response);
};

module.exports = errorHandler;