-- Migration 015: Add translation columns to criteria table
-- Adds nullable name/description columns for French, Spanish, and German.
-- Seeded as NULL; professional translations will be populated separately.

ALTER TABLE criteria ADD COLUMN name_fr TEXT;
ALTER TABLE criteria ADD COLUMN name_es TEXT;
ALTER TABLE criteria ADD COLUMN name_de TEXT;
ALTER TABLE criteria ADD COLUMN description_fr TEXT;
ALTER TABLE criteria ADD COLUMN description_es TEXT;
ALTER TABLE criteria ADD COLUMN description_de TEXT;
