CREATE TABLE contribution_quota_events (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES users(id),
  kind TEXT NOT NULL CHECK(kind IN ('submit','upload')),
  created_at INTEGER NOT NULL,
  byte_count INTEGER NOT NULL DEFAULT 0 CHECK(byte_count >= 0)
);
CREATE INDEX contribution_quota_user_window ON contribution_quota_events(user_id,kind,created_at);
CREATE INDEX contribution_quota_expiry ON contribution_quota_events(created_at);
