-- Extend profiles table with account status and login statistics
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS login_count int DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_login timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status text DEFAULT 'active'
  CHECK (status IN ('active', 'suspended', 'deleted'));

-- Create a function to atomically increment login_count and update last_login
CREATE OR REPLACE FUNCTION increment_login_count(user_uuid uuid)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET login_count = login_count + 1,
      last_login = now()
  WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
