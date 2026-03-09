-- Reports redesign: add report_assessments junction table
-- reports.project_id is intentionally left in place (SQLite cannot drop columns easily).
-- Going forward, reports are linked to one or more assessments via this table.
CREATE TABLE IF NOT EXISTS report_assessments (
  report_id     TEXT NOT NULL REFERENCES reports(id) ON DELETE CASCADE,
  assessment_id TEXT NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
  PRIMARY KEY (report_id, assessment_id)
);
