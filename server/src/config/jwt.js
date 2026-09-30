const env = require('./env');

module.exports = {
  secret: env.JWT_SECRET,
  accessExpires: env.JWT_ACCESS_EXPIRES,
};