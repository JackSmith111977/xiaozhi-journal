-- Migration 003: Create ai_usage table
-- Tracks daily AI usage per user (platform calls vs BYOK calls)
-- RLS: users can only access their own usage records

CREATE TABLE IF NOT EXISTS ai_usage (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  date date NOT NULL,
  platform_calls int NOT NULL DEFAULT 0,
  byok_calls int NOT NULL DEFAULT 0,
  tier text DEFAULT 'free',
  UNIQUE(user_id, date)
);

CREATE INDEX IF NOT EXISTS idx_ai_usage_user_id ON ai_usage(user_id);

ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own AI usage"
  ON ai_usage
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
