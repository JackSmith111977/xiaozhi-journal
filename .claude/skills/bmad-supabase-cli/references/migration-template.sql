-- Migration NNN: 简短描述
-- 功能：一句话说明此迁移的作用
-- 影响：创建/修改/删除了哪些对象

-- ============================================
-- 1. 创建表
-- ============================================

CREATE TABLE IF NOT EXISTS table_name (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,

  -- 业务字段
  name text NOT NULL,
  description text DEFAULT '',
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'published', 'archived')),

  -- 审计字段
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================
-- 2. 创建索引
-- ============================================

-- 外键索引（查询性能）
CREATE INDEX IF NOT EXISTS idx_table_user_id ON table_name(user_id);

-- 常用查询复合索引
CREATE INDEX IF NOT EXISTS idx_table_user_created ON table_name(user_id, created_at DESC);

-- ============================================
-- 3. 启用 RLS
-- ============================================

ALTER TABLE table_name ENABLE ROW LEVEL SECURITY;

-- 标准用户隔离策略
CREATE POLICY "Users can only access their own data"
  ON table_name
  FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- ============================================
-- 4. Trigger（可选）
-- ============================================

-- 自动更新 updated_at（如果此文件是首个定义此函数的迁移，取消注释）
-- CREATE OR REPLACE FUNCTION update_updated_at_column()
-- RETURNS TRIGGER AS $$
-- BEGIN
--   NEW.updated_at = now();
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;
--
-- CREATE TRIGGER update_<table>_updated_at
--   BEFORE UPDATE ON <table>
--   FOR EACH ROW
--   EXECUTE FUNCTION update_updated_at_column();
