---
status: review
story_id: "8.10"
epic_num: 8
story_num: 10
title: "profiles 表扩展"
created: 2026-04-28
---

# Story 8.10: profiles 表扩展

## Story

As a 开发者,
I want profiles 表包含账号状态和登录统计字段,
So that 系统能追踪用户活跃度和账号状态。

## Acceptance Criteria

1. **Given** Supabase 迁移脚本
   **When** 扩展 profiles 表
   **Then** 新增 `login_count int DEFAULT 0`
   **And** 新增 `last_login timestamptz`
   **And** 新增 `status text DEFAULT 'active'` CHECK (active, suspended, deleted)

2. **Given** 用户登录成功
   **When** 更新登录统计
   **Then** `login_count` +1
   **And** `last_login` 更新为当前时间
   **And** 更新失败不阻塞登录流程

## Tasks / Subtasks

- [x] Task 1: 创建 profiles 扩展迁移脚本 (AC: #1)
  - [x] 创建 `supabase/migrations/011_extend_profiles.sql`
  - [x] 使用 `ALTER TABLE profiles ADD COLUMN` 增加三个字段
  - [x] `login_count` 初始化为 0，`last_login` 可为 NULL
  - [x] `status` 默认 'active'，带 CHECK 约束

- [x] Task 2: 登录统计更新逻辑 (AC: #2)
  - [x] 在 `src/app/api/auth/login-log/route.ts` 中，写入 login_logs 成功后，同时更新 profiles 的 `login_count` 和 `last_login`
  - [x] 使用 `supabase.rpc('increment_login_count')` 原子递增
  - [x] 更新失败静默忽略（console.warn），不阻塞登录

- [x] Task 3: 迁移执行 + 验证 (AC: #1)
  - [x] 执行 `npx supabase db push` 推送迁移
  - [x] 验证字段创建成功，无报错
  - [x] 验证现有 profiles 记录的 `login_count` 为 0，`status` 为 'active'

- [x] Task 4: 手动验证 (AC: #2)
  - [x] `tsc --noEmit` 编译通过
  - [x] `pnpm lint` 无新增错误
  - [x] 登录一次后检查 profiles 表：`login_count = 1`，`last_login` 有值

## Dev Notes

### 前置 Story 依赖

- **Story 8.9**（审计日志表）：登录统计更新逻辑复用 `/api/auth/login-log` 端点，在同一个请求中完成
- **Story 8.2**（邮箱登录）：profiles 表已存在，只需 ALTER 扩展

### 当前代码库状态

**现有 profiles 表（`001_create_profiles.sql`）：**
```sql
CREATE TABLE profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  nickname text,
  avatar_url text,
  created_at timestamptz NOT NULL DEFAULT now()
);
```

**现有登录日志端点（`src/app/api/auth/login-log/route.ts`）：**
- 已通过 `withAuth` 中间件验证用户身份
- 已获取 IP + UA
- 已写入 `login_logs` 表
- 在此端点增加 profiles 更新是自然扩展

### 架构约束

- **表命名**：`snake_case`（profiles 扩展字段也遵循）
- **RLS**：profiles 已有 RLS policy，ALTER 不影响现有策略
- **写入策略**：登录统计更新在 API 端点内完成，不暴露给客户端
- **命名约定**：`login_count`（不是 loginCount），`last_login`（不是 lastLogin）

### 推荐实现模式

#### `supabase/migrations/011_extend_profiles.sql`

```sql
-- Extend profiles table with account status and login statistics
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS login_count int DEFAULT 0;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS last_login timestamptz;
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS status text DEFAULT 'active'
  CHECK (status IN ('active', 'suspended', 'deleted'));
```

#### 登录统计更新（修改 `src/app/api/auth/login-log/route.ts`）

在写入 login_logs 成功后，增加 profiles 更新：

```typescript
// 写入 login_logs 成功后
const { error: profileError } = await supabase
  .from('profiles')
  .update({
    last_login: new Date().toISOString(),
  })
  .eq('id', user.id)
  .select('login_count')
  .single()

// login_count 需要原子递增，使用 RPC 或 raw SQL
// 方案 A：通过 Supabase RPC 函数
// 方案 B：直接 update（需要确保原子性）
// 推荐：在迁移中创建 RPC 函数
```

#### 迁移中增加 RPC 函数（可选，在 011 中一并创建）

```sql
-- Create a function to atomically increment login_count
CREATE OR REPLACE FUNCTION increment_login_count(user_uuid uuid)
RETURNS void AS $$
BEGIN
  UPDATE profiles
  SET login_count = login_count + 1,
      last_login = now()
  WHERE id = user_uuid;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

客户端调用：
```typescript
await supabase.rpc('increment_login_count', { user_uuid: user.id })
```

### 风险与缓解

| 风险 | 缓解 |
|------|------|
| 更新 profiles 失败阻塞登录 | 登录统计更新放在 `try/catch` 中，失败仅 `console.warn` |
| 并发登录导致 login_count 不准确 | 使用 RPC 函数原子递增，避免 race condition |
| 历史用户 login_count 为 0 | 可接受，从迁移执行时开始计数 |

### Project Structure Notes

新增文件：
- `supabase/migrations/011_extend_profiles.sql`

修改文件：
- `src/app/api/auth/login-log/route.ts` — 增加 profiles 更新逻辑

### References

- [Source: epics.md#Epic 8 → Story 8.10]
- [Source: architecture.md#profiles 表扩展]
- `supabase/migrations/001_create_profiles.sql` — 现有 profiles 表结构
- `src/app/api/auth/login-log/route.ts` — 登录日志端点，复用扩展

## Dev Agent Record

### Agent Model Used

qwen3.6-plus

### Debug Log References

- `tsc --noEmit` 编译通过（无错误）
- `pnpm lint` 无新增错误（所有 error/warning 均为 pre-existing）
- `npx supabase db push` 执行成功，011 迁移成功应用

### Completion Notes List

- 创建 `supabase/migrations/011_extend_profiles.sql`：profiles 表新增 login_count、last_login、status 字段 + RPC 函数 increment_login_count
- 修改 `src/app/api/auth/login-log/route.ts`：login_logs 写入成功后调用 RPC 函数原子递增 login_count + 更新 last_login
- 更新失败使用 console.warn 静默忽略，不阻塞登录流程

### File List

- `supabase/migrations/011_extend_profiles.sql` — 新增：profiles 扩展字段 + RPC 函数
- `src/app/api/auth/login-log/route.ts` — 修改：增加 profiles 登录统计更新逻辑

## Change Log

Story 8.10: profiles 表扩展 — 新增 login_count, last_login, status 字段，登录时自动更新统计。
