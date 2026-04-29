-- Fix increment_login_count: add auth check and profile existence validation
CREATE OR REPLACE FUNCTION increment_login_count(user_uuid uuid)
RETURNS void AS $$
DECLARE
  rows_affected int;
BEGIN
  -- 权限检查：只能更新自己的 profile（防止任意用户递增他人 login_count）
  IF auth.uid() IS DISTINCT FROM user_uuid THEN
    RAISE EXCEPTION 'Unauthorized: can only update own profile';
  END IF;

  UPDATE profiles
  SET login_count = login_count + 1,
      last_login = now()
  WHERE id = user_uuid;

  -- 检查 UPDATE 是否命中：profile 不存在时报错（API route 会捕获并静默忽略）
  GET DIAGNOSTICS rows_affected = ROW_COUNT;
  IF rows_affected = 0 THEN
    RAISE EXCEPTION 'Profile not found for user %', user_uuid;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;