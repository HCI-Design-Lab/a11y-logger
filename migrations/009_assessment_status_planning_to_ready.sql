-- Rename assessment status 'planning' to 'ready'
PRAGMA foreign_keys = OFF;

UPDATE assessments SET status = 'ready' WHERE status = 'planning';

CREATE TABLE assessments_new (
  id TEXT PRIMARY KEY,
  project_id TEXT NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  test_date_start TEXT,
  test_date_end TEXT,
  status TEXT NOT NULL DEFAULT 'ready' CHECK (status IN ('ready', 'in_progress', 'completed')),
  assigned_to TEXT,
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

INSERT INTO assessments_new SELECT * FROM assessments;
DROP TABLE assessments;
ALTER TABLE assessments_new RENAME TO assessments;

PRAGMA foreign_keys = ON;
