# Supabase SQL 编写规范

## 1. 表定义规范

### 1.1 基本结构

```sql
CREATE TABLE IF NOT EXISTS table_name (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  -- 业务字段
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
```

### 1.2 字段约定

| 字段 | 类型 | 约束 | 说明 |
|------|------|------|------|
| `id` | `uuid` | `PRIMARY KEY DEFAULT gen_random_uuid()` | 主键 |
| `user_id` | `uuid` | `NOT NULL REFERENCES profiles(id) ON DELETE CASCADE` | 外键 |
| `created_at` | `timestamptz` | `NOT NULL DEFAULT now()` | 创建时间 |
| `updated_at` | `timestamptz` | `NOT NULL DEFAULT now()` | 更新时间 |

### 1.3 状态/枚举字段

使用 `text` + `CHECK` 约束，不依赖 `ENUM`：

```sql
status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),
```

### 1.4 可选字段

```sql
avatar_url text,  -- NULL 表示未设置
nickname text NOT NULL DEFAULT '',  -- 空字符串是有效值
```

## 2. 索引规范

### 2.1 必须创建索引的字段

- 所有外键字段
- 常用 WHERE/ORDER BY 字段
- 复合查询使用复合索引

```sql
-- 单列索引
CREATE INDEX IF NOT EXISTS idx_table_user_id ON table_name(user_id);

-- 复合索引（覆盖最常见查询模式）
CREATE INDEX IF NOT EXISTS idx_table_user_created ON table_name(user_id, created_at DESC);
```

### 2.2 命名约定

`idx_<table_name>_<column(s)>`

## 3. RLS 策略规范

### 3.1 标准模式（单用户隔离）

```sql
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only access their own data"
  ON table_name
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

### 3.2 公开可读 + 私有写

```sql
ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can read"
  ON table_name
  FOR SELECT
  USING (true);

CREATE POLICY "Owner can write"
  ON table_name
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

### 3.3 认证用户可读

```sql
CREATE POLICY "Authenticated users can read"
  ON table_name
  FOR SELECT
  USING (auth.role() = 'authenticated');

CREATE POLICY "Users can only write their own"
  ON table_name
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);
```

## 4. Trigger 规范

### 4.1 自动更新 updated_at

```sql
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_<table>_updated_at
  BEFORE UPDATE ON <table>
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();
```

### 4.2 Auth 用户自动创建 Profile

```sql
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, nickname)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(split_part(NEW.email, '@', 1), 'user')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();
```

## 5. 安全规范

### 5.1 禁止

- 明文存储密钥/密码
- `SECURITY DEFINER` 函数中不校验 `auth.uid()`
- 无 RLS 的表（除非确实是公开数据）
- `SELECT *` 在生产代码中（迁移脚本除外）

### 5.2 推荐

- 使用 `SECURITY DEFINER` 时需标注原因
- 所有写入操作必须有 `auth.uid()` 校验
- 敏感数据使用 `pgcrypto` 加密

## 6. 迁移文件头部注释

```sql
-- Migration NNN: 简短描述
-- 功能：一句话说明
-- 影响：创建/修改/删除哪些表
```

## 7. 幂等性

所有 DDL 语句必须幂等：

- `CREATE TABLE IF NOT EXISTS`
- `CREATE INDEX IF NOT EXISTS`
- `CREATE POLICY IF NOT EXISTS`（PG 15+）
- `CREATE OR REPLACE FUNCTION`
- `ALTER TABLE ... ENABLE ROW LEVEL SECURITY`（重复执行无影响）

## 8. 函数与视图

### 8.1 函数

```sql
CREATE OR REPLACE FUNCTION function_name(arg_name arg_type)
RETURNS return_type AS $$
BEGIN
  -- 函数体
  -- SECURITY DEFINER：以函数所有者权限执行，需明确授权原因
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 8.2 视图

```sql
CREATE OR REPLACE VIEW view_name AS
SELECT id, user_id, title, created_at
FROM journals
WHERE status = 'published';
-- 视图继承基表的 RLS 策略
```

## 9. Storage Bucket

```sql
-- 创建 Bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', false);

-- Bucket RLS：用户只能管理自己的文件
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage own avatars"
  ON storage.objects
  FOR ALL
  USING (auth.uid() = (storage.foldername(name))[1]::uuid)
  WITH CHECK (auth.uid() = (storage.foldername(name))[1]::uuid);
```
