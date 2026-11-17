-- For the dedicated test-only D1 database. No production records.
CREATE TABLE IF NOT EXISTS task_status (
  report_date TEXT NOT NULL,
  slot INTEGER NOT NULL CHECK(slot BETWEEN 1 AND 4),
  task_index INTEGER NOT NULL CHECK(task_index >= 0),
  status TEXT NOT NULL DEFAULT 'unverified' CHECK(status IN ('completed','in-progress','blocked','unverified')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY(report_date,slot,task_index)
);
CREATE TABLE IF NOT EXISTS report_runs (
  id TEXT PRIMARY KEY,
  report_date TEXT NOT NULL,
  slot INTEGER NOT NULL CHECK(slot BETWEEN 1 AND 4),
  stage TEXT NOT NULL DEFAULT 'preview' CHECK(stage IN ('preview','draft','blocked','test-submitted')),
  content TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  UNIQUE(report_date,slot,stage)
);
CREATE INDEX IF NOT EXISTS idx_report_runs_date ON report_runs(report_date,slot);
