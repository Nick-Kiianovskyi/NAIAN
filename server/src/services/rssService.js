/**
 * RSSService — MOCK ONLY.
 * Не выполняет HTTP-запросов к реальным RSS/Atom лентам.
 * Возвращает детерминированный набор «сырых» элементов ленты для дальнейшей обработки.
 */

const MOCK_FEEDS = [
  { source: 'Мок-Новини', domain: 'mock-news.local', language: 'uk' },
  { source: 'Мок-Прес', domain: 'mock-press.local', language: 'uk' },
  { source: 'Мок-Тиждень', domain: 'mock-week.local', language: 'uk' },
];

const MOCK_HEADLINES = [
  'Набули чинності нові правила для малого бізнесу',
  'Відкрито новий освітній центр',
  'Відбулися громадські слухання щодо бюджету',
  'Транспортна інфраструктура отримала нові рухомі склади',
  'Економічні показники регіону зросли за квартал',
  'Запущено нову станцію очищення води',
  'Спортивна команда здобула перемогу в міжрегіональному турнірі',
  'Місцева громада підтримала екологічну ініціативу',
];

const MOCK_SUMMARIES = [
  'Матеріал підготовлено на основі відкритих даних та офіційних повідомлень.',
  'Експерти зазначають, що зміни матимуть довгостроковий вплив на регіон.',
  'За даними органів місцевого самоврядування, роботи виконуються за графіком.',
  'Громадськість критикує темпи виконання робіт та вимагає додаткового контролю.',
];

const slugify = (value) =>
  String(value)
    .toLowerCase()
    .replace(/[^a-z0-9а-яіїєґ]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

const RSSService = {
  /**
   * @returns {Promise<Array<{title,url,source,summary,publishedAt,regionId,topicIds,sentiment,raw,contentHash}>>}
   */
  async fetchArticles({ region, topics = [], limit = MOCK_HEADLINES.length } = {}) {
    if (!region) {
      throw new Error('RSSService.fetchArticles: region is required');
    }

    const now = Date.now();
    const batch = String(now);

    return MOCK_HEADLINES.slice(0, limit).map((headline, index) => {
      const feed = MOCK_FEEDS[index % MOCK_FEEDS.length];
      const title = `${headline} — ${region.name}`;
      const url = `https://${feed.domain}/${slugify(region.slug || region.name)}/${slugify(headline)}-${batch}-${index}`;

      return {
        title,
        url,
        source: feed.source,
        summary: MOCK_SUMMARIES[index % MOCK_SUMMARIES.length],
        publishedAt: new Date(now - index * 65 * 60 * 1000),
        regionId: region.id,
        topicIds: topics.length ? [topics[index % topics.length].id] : [],
        sentiment: ['positive', 'neutral', 'neutral', 'negative'][index % 4],
        raw: {
          feed_url: `https://${feed.domain}/rss`,
          feed_domain: feed.domain,
          language: feed.language,
          guid: `mock-${batch}-${index}`,
        },
        contentHash: `mock:${batch}:${index}`,
      };
    });
  },

  async fetchFeeds() {
    return MOCK_FEEDS.map((f) => ({
      name: f.source,
      url: `https://${f.domain}/rss`,
      domain: f.domain,
      language: f.language,
      is_mock: true,
    }));
  },
};

module.exports = RSSService;