-- Migration 006: Create app_meta table
-- Stores per-user app metadata as key-value pairs (jsonb)
-- RLS: users can only access their own app meta

CREATE TABLE IF NOT EXISTS app_meta (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  key text NOT NULL,
  value jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, key)
);

CREATE INDEX IF NOT EXISTS idx_app_meta_user_id ON app_meta(user_id);
CREATE INDEX IF NOT EXISTS idx_app_meta_key ON app_meta(key);

ALTER TABLE app_meta ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own app meta"
  ON app_meta
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
