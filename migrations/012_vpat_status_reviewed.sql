-- SQLite does not support DROP CONSTRAINT, so we recreate the vpats table
-- to update the status CHECK constraint to allow 'reviewed' in addition to
-- 'draft' and 'published'.
--
-- The migration runner wraps each migration in a transaction, and PRAGMA
-- foreign_keys cannot be changed inside a transaction in SQLite. Since the
-- app enables foreign_keys = ON at connection startup (index.ts), a naive
-- DROP TABLE vpats would cascade-delete all vpat_criterion_rows and
-- vpat_snapshots rows via their ON DELETE CASCADE constraints.
--
-- Fix: backup child rows before the drop, restore them after the rename.
-- All steps run inside the runner's transaction, so any failure rolls back cleanly.

-- Step 1: Backup child rows that CASCADE from vpats
CREATE TABLE _m012_criterion_rows_backup AS SELECT * FROM vpat_criterion_rows;
CREATE TABLE _m012_snapshots_backup AS SELECT * FROM vpat_snapshots;

-- Step 2: Delete child rows to prevent CASCADE when dropping vpats
DELETE FROM vpat_snapshots;
DELETE FROM vpat_criterion_rows;

-- Step 3: Recreate vpats with updated CHECK constraint
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

-- Step 4: Restore child rows
INSERT INTO vpat_criterion_rows SELECT * FROM _m012_criterion_rows_backup;
INSERT INTO vpat_snapshots SELECT * FROM _m012_snapshots_backup;

-- Step 5: Clean up backup tables
DROP TABLE _m012_criterion_rows_backup;
DROP TABLE _m012_snapshots_backup;
