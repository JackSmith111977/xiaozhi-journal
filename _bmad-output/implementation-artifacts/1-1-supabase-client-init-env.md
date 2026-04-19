Status: review

# Story 1.1: Supabase 客户端初始化 + 环境变量配置

## Story

As a 开发者,
I want 初始化 Supabase 客户端并配置环境变量,
So that 后续所有 Supabase 操作都有统一的基础设施。

## Acceptance Criteria

1. **Given** 现有项目 `xiaozhi-journal/`
   **When** 执行 `npm install @supabase/supabase-js`
   **Then** 依赖安装成功，无报错

2. **Given** 依赖已安装
   **When** 在 `src/lib/supabase.ts` 创建 Supabase 客户端
   **Then** 使用 `createClient(SUPABASE_URL, SUPABASE_ANON_KEY)` 初始化
   **And** 从 `process.env.NEXT_PUBLIC_SUPABASE_URL` 和 `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY` 读取配置
   **And** 导出为 `supabase` 单例

3. **Given** `supabase.ts` 创建完毕
   **When** 在 `.env.local` 中配置环境变量
   **Then** 包含 `NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co`
   **And** 包含 `NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx`
   **And** `.env.example` 中包含上述变量占位符
   **And** `.gitignore` 包含 `.env.local`

4. **Given** 配置完成
   **When** 在任意组件中 `import { supabase } from '@/lib/supabase'`
   **Then** 可调用 `supabase.from('profiles').select()` 无报错（表不存在时返回错误但客户端正常）

## Tasks / Subtasks

- [x] Task 1: 安装 Supabase 客户端依赖 (AC: #1)
  - [x] 执行 `npm install @supabase/supabase-js`
- [x] Task 2: 创建 Supabase 客户端模块 (AC: #2, #4)
  - [x] 创建 `src/lib/supabase.ts`
  - [x] 使用 `createClient()` 初始化，从环境变量读取配置
  - [x] 导出为单例 `supabase`
- [x] Task 3: 配置环境变量文件 (AC: #3)
  - [x] 创建 `.env.example` 文件，包含占位符
  - [x] 确认 `.gitignore` 包含 `.env.local`（已有 `.env*` 通配符覆盖）

## Dev Notes

### 架构约束

- **项目起点**：保留现有 `xiaozhi-journal/` 项目，不重新初始化。70%+ 前端组件可复用
- **包管理器**：使用 `npm`（非 pnpm/yarn），遵循 `package.json` 现有依赖管理方式
- **文件命名**：lib 文件使用 camelCase（`supabase.ts`），与现有 `db.ts`、`ai.ts` 一致
- **导入别名**：`@/*` 映射到 `./src/*`，已在 `tsconfig.json` 中配置

### 技术规格

- **@supabase/supabase-js 版本**：最新稳定版 2.103.3（2026-04），与 Next.js 16 App Router 兼容
- **客户端初始化**：使用 `createClient(url, anonKey)`，非 SSR 模式（此 Story 仅客户端 SDK）
- **环境变量前缀**：必须使用 `NEXT_PUBLIC_` 前缀才能在客户端代码中访问
- **单例模式**：模块级变量 + 导出，避免每次 import 创建新实例

### Supabase 客户端代码模板

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)
```

### 测试标准

- 本项目不写单元测试，手动验证
- 验证点：
  1. `npm install @supabase/supabase-js` 无报错
  2. `npm run dev` 启动无报错
  3. 在浏览器控制台或组件中 `import { supabase }` 可调用

### 后续 Story 依赖

- **Story 1.2**（IndexedDB 缓存层重构）依赖本 Story 创建的 `supabase` 单例
- **Story 9.1**（Supabase 数据库迁移）是独立的基础设施 Story，可在 Supabase Dashboard 中执行

### References

- [Source: architecture.md#Core Architectural Decisions — Supabase PostgreSQL]
- [Source: architecture.md#Starter Template Evaluation]
- [Source: epics.md#Epic 1: 项目基础适配 → Story 1.1]
- [Source: project-context.md#Technology Stack & Dependencies]
- [Source: project-context.md#AI Agent Rules — Rule 2 (no API key exposure)]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

- 安装 @supabase/supabase-js@2.103.3，无报错
- 创建 `src/lib/supabase.ts`，使用 `createClient()` 从环境变量初始化单例
- 创建 `.env.example` 模板，`.gitignore` 已有 `.env*` 通配符覆盖
- TypeScript 编译通过（`tsc --noEmit` 无报错）

### File List

- `package.json` — 新增 @supabase/supabase-js 依赖
- `src/lib/supabase.ts` — Supabase 客户端单例
- `.env.example` — 环境变量占位符模板
