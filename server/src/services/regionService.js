const RegionRepository = require('../repositories/regionRepository');

const RegionService = {
  async list({ limit, offset, sortBy, order, filters }) {
    return RegionRepository.findAll({ limit, offset, sortBy, order, filters });
  },

  async getById(id) {
    return RegionRepository.findById(id);
  },
};

module.exports = RegionService;