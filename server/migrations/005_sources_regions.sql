-- ============================================================
-- NAIAN — Міграція 005: Джерела (СМІ) та мультирегіональність статей
-- ============================================================

-- sources
-- Призначення: довідник медіа-джерел (СМИ) з метаданими: домен, тип,
-- рівень довіри, мова, пріоритет збору. Раніше існував лише текстовий
-- стовпець articles.source — це не покривало потребу в сутності джерела.
CREATE TABLE sources (
    id                SERIAL PRIMARY KEY,
    name              VARCHAR(255) NOT NULL,
    domain            VARCHAR(255),
    type              VARCHAR(50) NOT NULL DEFAULT 'news'
                      CHECK (type IN ('news', 'tv', 'radio', 'blog', 'telegram', 'other')),
    country           CHAR(2) NOT NULL DEFAULT 'UA',
    language          VARCHAR(10) NOT NULL DEFAULT 'uk',
    reliability       DECIMAL(3, 2) DEFAULT 0.50 CHECK (reliability BETWEEN 0 AND 1),
    bias              VARCHAR(30) CHECK (bias IN ('neutral', 'pro-government', 'opposition', 'independent', 'unknown')),
    scraping_priority INT NOT NULL DEFAULT 1 CHECK (scraping_priority BETWEEN 1 AND 5),
    is_active         BOOLEAN NOT NULL DEFAULT TRUE,
    created_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at        TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE sources IS 'Довідник медіа-джерел';
COMMENT ON COLUMN sources.reliability IS 'Рівень довіри до джерела (0–1)';
COMMENT ON COLUMN sources.bias IS 'Оцінка політичного нахилу видання';
COMMENT ON COLUMN sources.scraping_priority IS 'Пріоритет збору новин з цього джерела (1–5)';

CREATE UNIQUE INDEX idx_sources_domain ON sources(domain) WHERE domain IS NOT NULL;
CREATE INDEX idx_sources_name ON sources(name);
CREATE INDEX idx_sources_type ON sources(type);
CREATE INDEX idx_sources_active ON sources(is_active) WHERE is_active = TRUE;

-- Зв'язок стаття ↔ джерело: додаємо FK до існуючої таблиці articles.
-- articles.source залишається денормалізованою назвою для сумісності.
ALTER TABLE articles
    ADD COLUMN source_id INT REFERENCES sources(id) ON DELETE SET NULL;

CREATE INDEX idx_articles_source_id ON articles(source_id);

-- article_regions
-- Призначення: багаторегіональна прив'язка статтей (M:M). articles.region_id
-- зберігає ПЕРВИННИЙ регіон вибірки, ця таблиця розширює охоплення на інші
-- регіони, що важливо для подій, які зачіпають кілька областей.
CREATE TABLE article_regions (
    article_id      INT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    region_id       INT NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
    is_primary      BOOLEAN NOT NULL DEFAULT FALSE,
    confidence      DECIMAL(3, 2) NOT NULL DEFAULT 1.00 CHECK (confidence BETWEEN 0 AND 1),
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (article_id, region_id)
);

COMMENT ON TABLE article_regions IS 'Прив''язка статей до кількох регіонів';
COMMENT ON COLUMN article_regions.is_primary IS 'Чи є цей регіон первинним для статті';
COMMENT ON COLUMN article_regions.confidence IS 'Впевненість AI у прив''язці до регіону';

CREATE INDEX idx_article_regions_region ON article_regions(region_id);
CREATE INDEX idx_article_regions_primary ON article_regions(article_id) WHERE is_primary = TRUE;