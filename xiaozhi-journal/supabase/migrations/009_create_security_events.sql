-- Create security_events table for auditing security-related actions
CREATE TABLE IF NOT EXISTS security_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  event_type text NOT NULL CHECK (event_type IN (
    'password_change', 'email_change', 'api_key_add', 'api_key_delete'
  )),
  event_time timestamptz NOT NULL DEFAULT now(),
  ip_address text,
  details jsonb DEFAULT '{}'
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_security_events_user_id ON security_events(user_id);
CREATE INDEX IF NOT EXISTS idx_security_events_time ON security_events(event_time DESC);

-- Enable Row Level Security
ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view their own security events
CREATE POLICY "Users can view own security events"
  ON security_events FOR SELECT
  USING (auth.uid() = user_id);

-- Allow authenticated users to insert their own security events
CREATE POLICY "Authenticated users can insert security events"
  ON security_events FOR INSERT
  WITH CHECK (auth.uid() = user_id);
