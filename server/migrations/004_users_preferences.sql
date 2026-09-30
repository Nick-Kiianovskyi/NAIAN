-- ============================================================
-- NAIAN — Міграція 004: Користувачі та налаштування
-- ============================================================

-- users
-- Призначення: облікові записи користувачів (аутентифікація, профілі,
-- власники чат-сесій, дайджестів та налаштувань). Раніше користувач був
-- лише рядком user_id у chat_sessions без повноцінної сутності.
CREATE TABLE users (
    id              SERIAL PRIMARY KEY,
    email           VARCHAR(255) NOT NULL UNIQUE,
    password_hash   VARCHAR(255) NOT NULL,
    display_name    VARCHAR(150),
    avatar_url      TEXT,
    role            VARCHAR(30) NOT NULL DEFAULT 'user'
                    CHECK (role IN ('user', 'analyst', 'admin')),
    status          VARCHAR(20) NOT NULL DEFAULT 'active'
                    CHECK (status IN ('active', 'blocked')),
    last_login_at   TIMESTAMP WITH TIME ZONE,
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

COMMENT ON TABLE users IS 'Облікові записи користувачів';
COMMENT ON COLUMN users.email IS 'Унікальний email для входу';
COMMENT ON COLUMN users.password_hash IS 'Хеш пароля (bcrypt/argon2)';
COMMENT ON COLUMN users.role IS 'Рівень доступу: user, analyst, admin';

CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_status ON users(status);

-- user_preferences
-- Призначення: налаштування підписки користувача на новини — вибір регіонів
-- і тем ЧЕРЕЗ ІСНУЮЧІ таблиці regions/topics (без дублювання довідників),
-- частота дайджестів і поріг важливості подій.
CREATE TABLE user_preferences (
    id              SERIAL PRIMARY KEY,
    user_id         INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    region_id       INT REFERENCES regions(id) ON DELETE SET NULL,
    topic_id        INT REFERENCES topics(id) ON DELETE SET NULL,
    digest_frequency VARCHAR(20) NOT NULL DEFAULT 'weekly'
                     CHECK (digest_frequency IN ('daily', 'weekly', 'monthly', 'off')),
    notify_email    BOOLEAN NOT NULL DEFAULT TRUE,
    importance_min  INT NOT NULL DEFAULT 0 CHECK (importance_min BETWEEN 0 AND 100),
    created_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at      TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE (user_id, region_id, topic_id),
    CONSTRAINT chk_pref_has_scope CHECK (region_id IS NOT NULL OR topic_id IS NOT NULL)
);

COMMENT ON TABLE user_preferences IS 'Підписки користувача на регіони/теми та налаштування сповіщень';
COMMENT ON COLUMN user_preferences.digest_frequency IS 'Частота формування дайджестів';
COMMENT ON COLUMN user_preferences.importance_min IS 'Мінімальна оцінка важливості подій для включення в дайджест';

CREATE INDEX idx_user_prefs_user ON user_preferences(user_id);
CREATE INDEX idx_user_prefs_region ON user_preferences(region_id);
CREATE INDEX idx_user_prefs_topic ON user_preferences(topic_id);