-- Fix: Remove OR user_id IS NULL from security_events SELECT policy
-- Any authenticated user could previously view all NULL user_id events

DROP POLICY IF EXISTS "Users can view own security events" ON security_events;

CREATE POLICY "Users can view own security events"
  ON security_events FOR SELECT
  USING (auth.uid() = user_id);
