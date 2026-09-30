const UserRepository = require('../repositories/userRepository');

const UsersService = {
  async list({ limit, offset }) {
    return UserRepository.findAll({ limit, offset });
  },

  async updateProfile(userId, data) {
    return UserRepository.update(userId, data);
  },
};

module.exports = UsersService;