-- Better Auth normalizes email addresses. Stop rather than merge users
-- if the legacy data contains addresses that only differ by case.
CREATE UNIQUE INDEX users_email_nocase ON users(email COLLATE NOCASE);
UPDATE users SET email = lower(email), name = coalesce(name, '');

ALTER TABLE users ADD COLUMN image TEXT;
ALTER TABLE users ADD COLUMN updated_at TEXT;
UPDATE users SET updated_at = created_at;

CREATE TABLE auth_accounts (
    id TEXT PRIMARY KEY NOT NULL,
    accountId TEXT NOT NULL,
    providerId TEXT NOT NULL,
    userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    accessToken TEXT,
    refreshToken TEXT,
    idToken TEXT,
    accessTokenExpiresAt TEXT,
    refreshTokenExpiresAt TEXT,
    scope TEXT,
    password TEXT,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    UNIQUE (providerId, accountId)
);
CREATE INDEX auth_accounts_user ON auth_accounts(userId);

INSERT INTO auth_accounts (id, accountId, providerId, userId, password, createdAt, updatedAt)
SELECT id, id, 'credential', id, hashed_password, created_at, updated_at FROM users;
ALTER TABLE users DROP COLUMN hashed_password;

CREATE TABLE auth_sessions (
    id TEXT PRIMARY KEY NOT NULL,
    expiresAt TEXT NOT NULL,
    token TEXT NOT NULL UNIQUE,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL,
    ipAddress TEXT,
    userAgent TEXT,
    userId TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE
);
CREATE INDEX auth_sessions_user ON auth_sessions(userId);

CREATE TABLE auth_verifications (
    id TEXT PRIMARY KEY NOT NULL,
    identifier TEXT NOT NULL,
    value TEXT NOT NULL,
    expiresAt TEXT NOT NULL,
    createdAt TEXT NOT NULL,
    updatedAt TEXT NOT NULL
);
CREATE INDEX auth_verifications_identifier ON auth_verifications(identifier);

CREATE TABLE auth_rate_limits (
    id TEXT PRIMARY KEY NOT NULL,
    key TEXT NOT NULL UNIQUE,
    count INTEGER NOT NULL,
    lastRequest INTEGER NOT NULL
);

-- Old reset links cannot be consumed by Better Auth.
DROP TABLE password_reset_tokens;
