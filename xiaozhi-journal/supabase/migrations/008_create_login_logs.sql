-- Create login_logs table for auditing user login history
CREATE TABLE IF NOT EXISTS login_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  login_time timestamptz NOT NULL DEFAULT now(),
  ip_address text,
  device_info text,
  login_method text NOT NULL CHECK (login_method IN ('email', 'wechat'))
);

-- Indexes for efficient querying
CREATE INDEX IF NOT EXISTS idx_login_logs_user_id ON login_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_login_logs_time ON login_logs(login_time DESC);

-- Enable Row Level Security
ALTER TABLE login_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Users can only view their own login logs
CREATE POLICY "Users can view own login logs"
  ON login_logs FOR SELECT
  USING (auth.uid() = user_id);

-- Allow authenticated users to insert their own login logs
CREATE POLICY "Authenticated users can insert login logs"
  ON login_logs FOR INSERT
  WITH CHECK (auth.uid() = user_id);
