CREATE TABLE vpat_criterion_components (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  criterion_row_id TEXT NOT NULL REFERENCES vpat_criterion_rows(id) ON DELETE CASCADE,
  component_name TEXT NOT NULL,
  conformance TEXT NOT NULL DEFAULT 'not_evaluated'
    CHECK (conformance IN ('not_evaluated','supports','partially_supports','does_not_support','not_applicable')),
  remarks TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(criterion_row_id, component_name)
);
CREATE INDEX idx_vpat_criterion_components_row_id ON vpat_criterion_components(criterion_row_id);
