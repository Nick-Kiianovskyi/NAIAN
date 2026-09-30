/**
 * AIService — MOCK ONLY.
 * Не подключается к OpenAI / Gemini / Claude и не выполняет сетевых запросов.
 * Все ответы формируются детерминированно из переданных статей.
 */

const AI_PROVIDER = 'mock-ai';

const SENTIMENT_WEIGHTS = {
  positive: 1,
  neutral: 0.6,
  negative: -1,
};

const AIService = {
  AI_PROVIDER,

  async generateDigest(articles, { region, topics } = {}) {
    if (!Array.isArray(articles) || articles.length === 0) {
      return {
        title: 'Порожній дайджест',
        summary: 'За вибраний період матеріалів не знайдено. Оновіть джерела або розширте період.',
        key_points: [],
        sentiment_score: 0,
        tokens_used: 0,
      };
    }

    const regionName = region?.name || 'Загальний';
    const topicNames = (topics || []).map((t) => t.name);

    const ordered = [...articles].sort(
      (a, b) => new Date(a.published_at || 0) - new Date(b.published_at || 0)
    );
    const keyPoints = ordered.slice(0, 3).map((a) => ({
      article_id: a.id ?? null,
      title: a.title,
      summary: a.summary || '',
      source: a.source || 'невідомо',
    }));

    const sentimentScore =
      Math.round(
        (articles.reduce((acc, a) => acc + (SENTIMENT_WEIGHTS[a.sentiment] ?? 0), 0) /
          articles.length) *
          100
      ) / 100;

    const topicPart = topicNames.length ? ` (теми: ${topicNames.join(', ')})` : '';

    return {
      title: `${regionName}${topicPart}: аналітичний огляд за період`,
      summary:
        `Звітний період охоплює ${articles.length} матеріалів. ` +
        `Тон матеріалів: ${sentimentScore > 0.15 ? 'переважно позитивний' : sentimentScore < -0.15 ? 'переважно негативний' : 'нейтральний'} ` +
        `(середній бал ${sentimentScore}). ` +
        `Ключові сюжети: ${keyPoints.map((p) => p.title).join('; ')}. ` +
        `Джерела: ${[...new Set(articles.map((a) => a.source).filter(Boolean))].join(', ')}.`,
      key_points: keyPoints,
      sentiment_score: sentimentScore,
      tokens_used: articles.length * 120,
    };
  },

  async summarizeArticle(article) {
    return `Коротко: ${article.title}. ${article.summary || ''}`.trim();
  },

  async analyzeSentiment(article) {
    const score = SENTIMENT_WEIGHTS[article.sentiment] ?? 0;
    return { label: article.sentiment || 'neutral', score };
  },
};

module.exports = AIService;