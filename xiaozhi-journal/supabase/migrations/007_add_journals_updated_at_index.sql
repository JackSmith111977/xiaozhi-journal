-- Migration 007: Add journals (user_id, updated_at DESC) index
-- Supports last-write-wins conflict resolution queries that sort by updated_at

CREATE INDEX IF NOT EXISTS idx_journals_user_updated ON journals(user_id, updated_at DESC);
