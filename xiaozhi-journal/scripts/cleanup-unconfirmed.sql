-- Cleanup Unconfirmed Email Accounts
-- Run this script to delete users who registered but never confirmed their email
-- within 7 days. This prevents stale unconfirmed accounts from accumulating.
--
-- Usage: supabase db execute -f scripts/cleanup-unconfirmed.sql
-- Or schedule via pg_cron:
--   SELECT cron.schedule('cleanup-unconfirmed', '0 3 * * *', $$
--     DELETE FROM auth.users
--     WHERE email_confirmed_at IS NULL
--       AND created_at < now() - interval '7 days';
--   $$);

-- Delete unconfirmed users older than 7 days
-- The profiles table has ON DELETE CASCADE so profiles are automatically removed
DELETE FROM auth.users
WHERE email_confirmed_at IS NULL
  AND created_at < now() - interval '7 days';
