-- SQLite does not support DROP CONSTRAINT, so we recreate the vpats table
-- to update the status CHECK constraint to allow 'reviewed' in addition to
-- 'draft' and 'published'.
--
-- NOTE: The migration runner wraps each migration in a transaction. PRAGMA
-- foreign_keys is a connection-level setting that cannot be changed inside a
-- transaction in SQLite, so the PRAGMA OFF/ON below has no effect inside the
-- transaction boundary. This works safely today because better-sqlite3 leaves
-- foreign key enforcement OFF by default. If the app ever enables foreign keys
-- at connection startup, this migration should be run outside a transaction or
-- the runner should be updated to handle table-rebuild migrations specially.

PRAGMA foreign_keys = OFF;

CREATE TABLE vpats_new (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  standard_edition TEXT NOT NULL DEFAULT 'WCAG'
    CHECK (standard_edition IN ('WCAG', '508', 'EU', 'INT')),
  wcag_version TEXT NOT NULL DEFAULT '2.1',
  wcag_level TEXT NOT NULL DEFAULT 'AA',
  product_scope TEXT NOT NULL DEFAULT '["web"]',
  status TEXT NOT NULL DEFAULT 'draft'
    CHECK (status IN ('draft', 'reviewed', 'published')),
  version_number INTEGER NOT NULL DEFAULT 1,
  published_at TEXT,
  reviewed_by TEXT,
  reviewed_at TEXT,
  wcag_scope TEXT DEFAULT '[]',
  criteria_rows TEXT DEFAULT '[]',
  ai_generated INTEGER NOT NULL DEFAULT 0,
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO vpats_new
  SELECT
    id, project_id, title, description,
    standard_edition, wcag_version, wcag_level, product_scope,
    status, version_number, published_at, reviewed_by, reviewed_at,
    wcag_scope, criteria_rows, ai_generated, created_by,
    created_at, updated_at
  FROM vpats;

DROP TABLE vpats;
ALTER TABLE vpats_new RENAME TO vpats;

PRAGMA foreign_keys = ON;
