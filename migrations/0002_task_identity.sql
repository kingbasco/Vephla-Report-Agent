-- Additive migration: preserve legacy index statuses; do not apply them to edited assignments.
CREATE TABLE IF NOT EXISTS task_status_v2 (
  report_date TEXT NOT NULL,
  slot INTEGER NOT NULL CHECK(slot BETWEEN 1 AND 4),
  task_id TEXT NOT NULL CHECK(length(task_id) = 64 AND task_id NOT GLOB '*[^a-f0-9]*'),
  status TEXT NOT NULL DEFAULT 'unverified' CHECK(status IN ('completed','in-progress','blocked','unverified')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY(report_date,slot,task_id)
);
