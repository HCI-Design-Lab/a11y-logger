-- Make reports.project_id nullable so reports can be created without a project_id,
-- linked instead to assessments via report_assessments.
-- SQLite does not support DROP NOT NULL directly, so we recreate the table.
PRAGMA foreign_keys = OFF;

CREATE TABLE reports_new (
  id TEXT PRIMARY KEY,
  project_id TEXT REFERENCES projects(id) ON DELETE CASCADE,
  type TEXT NOT NULL DEFAULT 'detailed' CHECK (type IN ('executive', 'detailed', 'custom')),
  title TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published')),
  content TEXT DEFAULT '{}',
  template_id TEXT,
  ai_generated INTEGER NOT NULL DEFAULT 0,
  created_by TEXT,
  published_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO reports_new SELECT * FROM reports;
DROP TABLE reports;
ALTER TABLE reports_new RENAME TO reports;

PRAGMA foreign_keys = ON;
