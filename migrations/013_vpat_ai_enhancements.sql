ALTER TABLE vpat_criterion_rows ADD COLUMN ai_referenced_issues TEXT;
ALTER TABLE vpat_criterion_rows ADD COLUMN ai_suggested_conformance TEXT
  CHECK (ai_suggested_conformance IN ('supports', 'does_not_support', 'not_applicable'));
