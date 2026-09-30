-- ============================================================
-- NAIAN — Regional News Intelligence Platform
-- Міграція 001: Початкова схема PostgreSQL
-- ============================================================

-- Підключення розширень
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- ДОВІДНИКИ
-- ============================================================

-- Регіони
CREATE TABLE regions (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(150) NOT NULL UNIQUE,
    slug            VARCHAR(150) NOT NULL UNIQUE,
    rss_query       TEXT NOT NULL,
    country         VARCHAR(100) DEFAULT 'Україна',
    timezone        VARCHAR(50) DEFAULT 'Europe/Kyiv',
    lat             DECIMAL(10, 7),
    lng             DECIMAL(10, 7),
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE regions IS 'Довідник регіонів для моніторингу новин';
COMMENT ON COLUMN regions.rss_query IS 'Пошуковий запит для Google News RSS';
COMMENT ON COLUMN regions.lat IS 'Широта центру регіону';
COMMENT ON COLUMN regions.lng IS 'Довгота центру регіону';

-- Теми
CREATE TABLE topics (
    id              SERIAL PRIMARY KEY,
    name            VARCHAR(150) NOT NULL UNIQUE,
    slug            VARCHAR(150) NOT NULL UNIQUE,
    description     TEXT,
    icon            VARCHAR(50),
    is_active       BOOLEAN DEFAULT TRUE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE topics IS 'Довідник тем для категоризації новин';

-- Зв''язок регіон ↔ тема (вага теми в регіоні)
CREATE TABLE region_topics (
    region_id       INT NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
    topic_id        INT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    weight          DECIMAL(3, 2) DEFAULT 1.00,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    PRIMARY KEY (region_id, topic_id)
);

COMMENT ON TABLE region_topics IS 'Вага теми в регіоні (0.00–1.00) для пріоритизації';

-- ============================================================
-- СТАТТІ
-- ============================================================

CREATE TABLE articles (
    id              SERIAL PRIMARY KEY,
    region_id       INT NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    url             TEXT NOT NULL,
    source          VARCHAR(255),
    author          VARCHAR(255),
    content         TEXT,
    raw_text        TEXT,
    content_hash    VARCHAR(64),
    summary         TEXT,
    sentiment       VARCHAR(20) CHECK (sentiment IN ('positive', 'negative', 'neutral', 'mixed')),
    published_at    TIMESTAMP WITH TIME ZONE,
    fetched_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_duplicate    BOOLEAN DEFAULT FALSE,
    metadata        JSONB DEFAULT '{}'::jsonb,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE articles IS 'Зібрані новинні статті з RSS-стрічок';
COMMENT ON COLUMN articles.url IS 'Унікальний URL статті (первинний ключ дедуплікації)';
COMMENT ON COLUMN articles.content_hash IS 'SHA-256 хеш контенту для дедуплікації за змістом';
COMMENT ON COLUMN articles.metadata IS 'Додаткові дані: рейтинг, мова, категорія тощо';
COMMENT ON COLUMN articles.sentiment IS 'Загальний тон статті, визначений AI';

-- Зв''язок стаття ↔ тема
CREATE TABLE article_topics (
    article_id      INT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    topic_id        INT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    confidence      DECIMAL(3, 2) DEFAULT 1.00,
    PRIMARY KEY (article_id, topic_id)
);

COMMENT ON TABLE article_topics IS 'Прив''язка статей до тем з рівнем впевненості AI';

-- ============================================================
-- AI-АНАЛІЗ СТАТЕЙ
-- ============================================================

CREATE TABLE ai_analysis (
    id              SERIAL PRIMARY KEY,
    article_id      INT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    key_findings    TEXT,
    sentiment       VARCHAR(20) CHECK (sentiment IN ('positive', 'negative', 'neutral', 'mixed')),
    sentiment_score DECIMAL(5, 4),
    entities        JSONB DEFAULT '[]'::jsonb,
    topics_extracted JSONB DEFAULT '[]'::jsonb,
    summary         TEXT,
    tokens_used     INT,
    model_used      VARCHAR(100),
    analyzed_at     TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (article_id)
);

COMMENT ON TABLE ai_analysis IS 'Результати AI-аналізу кожної статті';
COMMENT ON COLUMN ai_analysis.entities IS 'Витягнуті сутності: організації, люди, місця';
COMMENT ON COLUMN ai_analysis.topics_extracted IS 'AI-визначені теми статті';
COMMENT ON COLUMN ai_analysis.sentiment_score IS 'Числова оцінка тональності (-1.0 до 1.0)';

-- ============================================================
-- ПОДІЇ
-- ============================================================

CREATE TABLE events (
    id              SERIAL PRIMARY KEY,
    region_id       INT NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    description     TEXT,
    significance    VARCHAR(20) CHECK (significance IN ('critical', 'high', 'medium', 'low')),
    importance_score INT CHECK (importance_score BETWEEN 0 AND 100),
    importance_factors JSONB DEFAULT '{}'::jsonb,
    category        VARCHAR(100),
    date_range      TSRANGE,
    source_count    INT DEFAULT 1,
    ai_summary      TEXT,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE events IS 'Витягнуті зі статей події';
COMMENT ON COLUMN events.importance_score IS 'Багатофакторна оцінка важливості (0–100)';
COMMENT ON COLUMN events.importance_factors IS 'Фактори оцінки: {source_reach, recency, mentions, sentiment}';
COMMENT ON COLUMN events.date_range IS 'Часовий діапазон події (tsrange)';
COMMENT ON COLUMN events.source_count IS 'Кількість унікальних джерел, що висвітлюють подію';

-- Зв''язок подія ↔ джерело (стаття)
CREATE TABLE event_sources (
    event_id        INT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    article_id      INT NOT NULL REFERENCES articles(id) ON DELETE CASCADE,
    quote           TEXT,
    PRIMARY KEY (event_id, article_id)
);

COMMENT ON TABLE event_sources IS 'Статті-джерела, що згадують подію';

-- ============================================================
-- ГЕОГРАФІЯ ПОДІЙ
-- ============================================================

CREATE TABLE event_locations (
    id              SERIAL PRIMARY KEY,
    event_id        INT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    city            VARCHAR(200),
    district        VARCHAR(200),
    address         TEXT,
    lat             DECIMAL(10, 7),
    lng             DECIMAL(10, 7),
    place_name      VARCHAR(300),
    place_type      VARCHAR(100),
    confidence      DECIMAL(3, 2) DEFAULT 1.00,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE event_locations IS 'Географічні прив''язки подій';
COMMENT ON COLUMN event_locations.place_type IS 'Тип місця: office, transport, hospital, school тощо';
COMMENT ON COLUMN event_locations.confidence IS 'Впевненість AI у визначенні локації (0–1)';

-- Згадки подій (для трендів)
CREATE TABLE event_mentions (
    event_id        INT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    mention_date    DATE NOT NULL DEFAULT CURRENT_DATE,
    mention_count   INT DEFAULT 1,
    first_seen      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_seen       TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    trend_direction VARCHAR(10) CHECK (trend_direction IN ('up', 'down', 'stable')),
    PRIMARY KEY (event_id, mention_date)
);

COMMENT ON TABLE event_mentions IS 'Щоденний підрахунок згадок подій для трендів';

-- ============================================================
-- ЗВІТИ
-- ============================================================

CREATE TABLE reports (
    id              SERIAL PRIMARY KEY,
    region_id       INT NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
    title           TEXT NOT NULL,
    summary         TEXT NOT NULL,
    period_start    TIMESTAMP WITH TIME ZONE,
    period_end      TIMESTAMP WITH TIME ZONE,
    ai_model        VARCHAR(100),
    tokens_used     INT,
    metadata        JSONB DEFAULT '{}'::jsonb,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE reports IS 'Аналітичні зведення по регіонах і темах';

-- Зв''язок звіт ↔ тема
CREATE TABLE report_topics (
    report_id       INT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    topic_id        INT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
    PRIMARY KEY (report_id, topic_id)
);

-- Зв''язок звіт ↔ подія
CREATE TABLE report_events (
    report_id       INT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
    event_id        INT NOT NULL REFERENCES events(id) ON DELETE CASCADE,
    event_order     INT DEFAULT 0,
    PRIMARY KEY (report_id, event_id)
);

-- ============================================================
-- ТРЕНДИ
-- ============================================================

CREATE TABLE trend_snapshots (
    id              SERIAL PRIMARY KEY,
    region_id       INT NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
    topic_id        INT REFERENCES topics(id) ON DELETE SET NULL,
    snapshot_date   DATE NOT NULL DEFAULT CURRENT_DATE,
    articles_count  INT DEFAULT 0,
    events_count    INT DEFAULT 0,
    avg_importance  DECIMAL(5, 2),
    top_event_id    INT REFERENCES events(id) ON DELETE SET NULL,
    metadata        JSONB DEFAULT '{}'::jsonb,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE trend_snapshots IS 'Щоденні знімки метрик для побудови трендів';

CREATE TABLE trend_alerts (
    id              SERIAL PRIMARY KEY,
    region_id       INT NOT NULL REFERENCES regions(id) ON DELETE CASCADE,
    topic_id        INT REFERENCES topics(id) ON DELETE SET NULL,
    alert_type      VARCHAR(50) NOT NULL,
    old_value       DECIMAL(10, 2),
    new_value       DECIMAL(10, 2),
    change_pct      DECIMAL(7, 2),
    message         TEXT NOT NULL,
    is_read         BOOLEAN DEFAULT FALSE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE trend_alerts IS 'Повідомлення про різкі зміни в трендах';
COMMENT ON COLUMN trend_alerts.alert_type IS 'spike, drop, new_trending, threshold';

-- ============================================================
-- AI-ЧАТ
-- ============================================================

CREATE TABLE chat_sessions (
    id              SERIAL PRIMARY KEY,
    user_id         VARCHAR(100) NOT NULL DEFAULT 'default_user',
    title           TEXT,
    region_id       INT REFERENCES regions(id) ON DELETE SET NULL,
    context_snapshot JSONB DEFAULT '{}'::jsonb,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE chat_sessions IS 'Сесії AI-чату по новинах регіону';
COMMENT ON COLUMN chat_sessions.context_snapshot IS 'Знімок контексту: регіон, теми, період';

CREATE TABLE chat_messages (
    id              SERIAL PRIMARY KEY,
    session_id      INT NOT NULL REFERENCES chat_sessions(id) ON DELETE CASCADE,
    role            VARCHAR(20) NOT NULL CHECK (role IN ('user', 'assistant', 'system')),
    content         TEXT NOT NULL,
    tokens_used     INT,
    model_used      VARCHAR(100),
    referenced_events   INT[] DEFAULT '{}',
    referenced_articles INT[] DEFAULT '{}',
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE chat_messages IS 'Повідомлення AI-чату';
COMMENT ON COLUMN chat_messages.referenced_events IS 'ID подій, на які посилається повідомлення';
COMMENT ON COLUMN chat_messages.referenced_articles IS 'ID статей, на які посилається повідомлення';

-- ============================================================
-- ЖУРНАЛ ІМПОРТУ
-- ============================================================

CREATE TABLE import_log (
    id              SERIAL PRIMARY KEY,
    region_id       INT REFERENCES regions(id) ON DELETE SET NULL,
    topic_id        INT REFERENCES topics(id) ON DELETE SET NULL,
    status          VARCHAR(20) NOT NULL CHECK (status IN ('running', 'completed', 'failed')),
    articles_fetched INT DEFAULT 0,
    duplicates_found INT DEFAULT 0,
    events_extracted INT DEFAULT 0,
    error_message   TEXT,
    started_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at    TIMESTAMP WITH TIME ZONE
);

COMMENT ON TABLE import_log IS 'Журнал запусків імпорту новин';