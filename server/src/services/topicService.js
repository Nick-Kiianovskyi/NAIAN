const TopicRepository = require('../repositories/topicRepository');

const TopicService = {
  async list({ limit, offset, sortBy, order, filters }) {
    return TopicRepository.findAll({ limit, offset, sortBy, order, filters });
  },

  async getById(id) {
    return TopicRepository.findById(id);
  },
};

module.exports = TopicService;