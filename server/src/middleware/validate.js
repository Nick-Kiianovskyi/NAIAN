const AppError = require('../utils/AppError');

const validate = (schema, source = 'body') => async (req, res, next) => {
  try {
    req[source] = schema.parse(req[source]);
    next();
  } catch (error) {
    if (error.name === 'ZodError') {
      const issues = error.issues || error.errors || [];
      next(
        new AppError(
          400,
          'Validation failed',
          issues.map((issue) => ({
            field: issue.path.join('.'),
            message: issue.message,
          }))
        )
      );
      return;
    }
    next(error);
  }
};

module.exports = validate;