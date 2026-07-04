CREATE TABLE IF NOT EXISTS config (
    id SERIAL PRIMARY KEY,
    data JSONB NOT NULL
);

CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    name TEXT NOT NULL,
    role TEXT NOT NULL,
    data JSONB -- extra metadata
);

CREATE TABLE IF NOT EXISTS mails (
    id TEXT PRIMARY KEY,
    metadata JSONB NOT NULL,
    pdf_path TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    version_id TEXT
);
