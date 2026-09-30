const SourceRepository = require('../repositories/sourceRepository');
const AppError = require('../utils/AppError');

const SourceService = {
  async list({ limit, offset, sortBy, order, filters }) {
    return SourceRepository.findAll({ limit, offset, sortBy, order, filters });
  },

  async getById(id) {
    return SourceRepository.findById(id);
  },

  async create(data) {
    return SourceRepository.create(data);
  },

  async update(id, data) {
    const existing = await SourceRepository.findById(id);
    if (!existing) {
      throw new AppError(404, 'Source not found');
    }
    return SourceRepository.update(id, data);
  },

  async remove(id) {
    const deleted = await SourceRepository.remove(id);
    if (!deleted) {
      throw new AppError(404, 'Source not found');
    }
  },
};

module.exports = SourceService;