-- Clear existing VPAT data (clean slate per design decision)
DELETE FROM vpats;

-- Unified criteria catalog
CREATE TABLE criteria (
  id TEXT PRIMARY KEY,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT NOT NULL DEFAULT '',
  standard TEXT NOT NULL CHECK (standard IN ('WCAG', '508', 'EN301549')),
  chapter_section TEXT NOT NULL,
  wcag_version TEXT CHECK (wcag_version IN ('2.0', '2.1', '2.2') OR wcag_version IS NULL),
  level TEXT CHECK (level IN ('A', 'AA', 'AAA') OR level IS NULL),
  editions TEXT NOT NULL DEFAULT '[]',
  product_types TEXT NOT NULL DEFAULT '[]',
  wcag_equivalent_id TEXT REFERENCES criteria(id),
  sort_order INTEGER NOT NULL DEFAULT 0
);

-- Normalized criterion rows (replaces criteria_rows JSON blob)
CREATE TABLE vpat_criterion_rows (
  id TEXT PRIMARY KEY,
  vpat_id TEXT NOT NULL REFERENCES vpats(id) ON DELETE CASCADE,
  criterion_id TEXT NOT NULL REFERENCES criteria(id),
  conformance TEXT NOT NULL DEFAULT 'not_evaluated'
    CHECK (conformance IN ('supports', 'partially_supports', 'does_not_support', 'not_applicable', 'not_evaluated')),
  remarks TEXT,
  ai_confidence TEXT CHECK (ai_confidence IN ('high', 'medium', 'low') OR ai_confidence IS NULL),
  ai_reasoning TEXT,
  last_generated_at TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(vpat_id, criterion_id)
);

-- Add new fields to vpats (old wcag_scope/criteria_rows columns left in place but unused)
ALTER TABLE vpats ADD COLUMN standard_edition TEXT NOT NULL DEFAULT 'WCAG'
  CHECK (standard_edition IN ('WCAG', '508', 'EU', 'INT'));
ALTER TABLE vpats ADD COLUMN product_scope TEXT NOT NULL DEFAULT '["web"]';
