const ArticleRepository = require('../repositories/newsRepository');
const AppError = require('../utils/AppError');

const NewsService = {
  async list({ limit, offset, sortBy, order, filters }) {
    return ArticleRepository.findAll({ limit, offset, sortBy, order, filters });
  },

  async getById(id) {
    const article = await ArticleRepository.findById(id);
    if (!article) {
      throw new AppError(404, 'Article not found');
    }
    return article;
  },
};

module.exports = NewsService;