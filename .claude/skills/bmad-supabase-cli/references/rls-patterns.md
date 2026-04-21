# Supabase RLS 策略模式

## 模式 1：完全用户隔离（最常用）

适用于：journals、ai_usage、subscriptions 等私有数据

```sql
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own data"
  ON table_name
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

- `USING`：控制 SELECT/UPDATE/DELETE 可见性
- `WITH CHECK`：控制 INSERT/UPDATE 写入权限

## 模式 2：公开可读 + 私有写

适用于：公共 profile 信息、公开内容

```sql
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read"
  ON table_name
  FOR SELECT
  USING (true);

CREATE POLICY "Authenticated users can insert"
  ON table_name
  FOR INSERT
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Owner can update"
  ON table_name
  FOR UPDATE
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);

CREATE POLICY "Owner can delete"
  ON table_name
  FOR DELETE
  USING (auth.uid() = id);
```

## 模式 3：认证用户可读 + 用户写

适用于：部分内容需要登录后可见的场景

```sql
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can read"
  ON table_name
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can write own"
  ON table_name
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

## 模式 4：profiles 表特殊模式

profiles 表的 `id` 等于 `auth.users.id`，不是 `user_id`

```sql
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own profile"
  ON profiles
  FOR ALL
  USING (auth.uid() = id)
  WITH CHECK (auth.uid() = id);
```

## 模式 5：软删除 + 用户隔离

```sql
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access their own (non-deleted)"
  ON table_name
  FOR SELECT
  USING (auth.uid() = user_id AND deleted_at IS NULL);

CREATE POLICY "Users can write own"
  ON table_name
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

## 安全注意事项

1. **始终启用 RLS**：每张表必须 `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`
2. **USING + WITH CHECK 配对**：防止读取和写入权限不一致
3. **不使用 `true` 作为写策略**：`FOR INSERT WITH CHECK (true)` 意味着任何人都能写入
4. **service_role 绕过 RLS**：服务端使用 service_role key 时绕过所有 RLS，客户端永远用 anon key
5. **auth.uid() 在匿名用户时为 NULL**：未登录用户 `auth.uid()` 返回 NULL，自然被 RLS 阻止

## 常见错误

| 错误 | 原因 | 修复 |
|------|------|------|
| `new row violates row-level security policy` | 写入者不是数据所有者 | 确保 `WITH CHECK (auth.uid() = user_id)` |
| `permission denied for table` | 未启用 RLS 或策略不匹配 | `ENABLE ROW LEVEL SECURITY` + 创建策略 |
| 匿名用户能读取数据 | 策略使用了 `USING (true)` | 改为 `USING (auth.uid() = user_id)` |
