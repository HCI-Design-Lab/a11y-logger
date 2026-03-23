CREATE TABLE vpat_snapshots (
  id TEXT PRIMARY KEY,
  vpat_id TEXT NOT NULL REFERENCES vpats(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  published_at TEXT NOT NULL,
  snapshot TEXT NOT NULL
);

CREATE INDEX idx_vpat_snapshots_vpat_id ON vpat_snapshots(vpat_id);
