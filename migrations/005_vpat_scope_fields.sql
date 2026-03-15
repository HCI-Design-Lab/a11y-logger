-- Add WCAG version and conformance level scope fields to vpats table
ALTER TABLE vpats ADD COLUMN wcag_version TEXT NOT NULL DEFAULT '2.1';
ALTER TABLE vpats ADD COLUMN wcag_level TEXT NOT NULL DEFAULT 'AA';
