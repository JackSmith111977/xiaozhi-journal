-- Migration 002: Create journals table
-- Stores journal entries with mood, AI response, golden quote
-- RLS: users can only access their own journals

CREATE TABLE IF NOT EXISTS journals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  content text NOT NULL DEFAULT '',
  mood int,
  mood_emoji text,
  ai_response text,
  golden_quote text,
  mood_label text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived', 'pending', 'ai_ready', 'ai_done')),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Composite index for the most common query: journals by user, ordered by date
CREATE INDEX IF NOT EXISTS idx_journals_user_created ON journals(user_id, created_at DESC);

ALTER TABLE journals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own journals"
  ON journals
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- Auto-update updated_at on row change
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_journals_updated_at
  BEFORE UPDATE ON journals
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
