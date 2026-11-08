ALTER TABLE tasks ADD COLUMN package_name TEXT;
ALTER TABLE tasks ADD COLUMN package_locked INTEGER NOT NULL DEFAULT 0 CHECK(package_locked IN (0,1));

CREATE TABLE task_comments (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  task_id TEXT NOT NULL REFERENCES tasks(id) ON DELETE CASCADE,
  author_id TEXT NOT NULL REFERENCES users(id),
  author_role TEXT NOT NULL CHECK(author_role IN ('contributor','reviewer')),
  message TEXT NOT NULL,
  package_version TEXT,
  package_name TEXT,
  created_at INTEGER NOT NULL
);
CREATE INDEX task_comments_task ON task_comments(task_id, id DESC);
