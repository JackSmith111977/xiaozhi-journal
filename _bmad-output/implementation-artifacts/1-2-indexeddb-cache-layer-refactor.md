Status: review

# Story 1.2: IndexedDB 缓存层重构 + Supabase 同步接口

## Story

As a 开发者,
I want 将 IndexedDB 从"唯一数据源"改为"缓存层",
So that 数据先写本地再同步到 Supabase，实现离线优先。

## Acceptance Criteria

1. **Given** 现有 `lib/db.ts`（IndexedDB CRUD）
   **When** 重构 `lib/db.ts` 为 `CacheProvider` 接口
   **Then** 保留 `getJournals()`, `addJournal()`, `updateJournal()`, `deleteJournal()` 方法
   **And** 新增 `getPendingJournals()`（status 为 `pending` 的待同步条目）
   **And** 新增 `markSynced(id)`（标记已同步）
   **And** 新增 `syncToSupabase(journals: Journal[])`（批量标记同步）
   **And** 新增 `setMeta(key, value)` / `getMeta(key)`

2. **Given** `CacheProvider` 接口完成
   **When** 在 `store/journal.ts` 重构 Zustand store
   **Then** 保留现有 state：`journals: Journal[]`, `loading: boolean`, `error: string | null`
   **And** 新增 state：`isSyncing: boolean`（同步中状态）
   **And** actions 改为先写 IndexedDB 再异步触发 Supabase sync
   **And** 所有更新使用不可变模式

3. **Given** 同步函数完成
   **When** 网络可用且用户已登录
   **Then** `syncToSupabase()` 将 `pending` 状态的日记写入 Supabase `journals` 表
   **And** 成功后调用 `markSynced(id)` 更新 IndexedDB 状态
   **And** 同步错误时静默失败，不阻塞用户操作

## Tasks / Subtasks

- [x] Task 1: 重构 `lib/db.ts` 为 CacheProvider 接口 (AC: #1)
  - [x] 保留现有方法：`getJournals()`, `addJournal()`, `updateJournal()`
  - [x] 新增 `deleteJournal(id: string)` 方法（AC 要求但目前缺失）
  - [x] 保留现有 `getPendingJournals()`, `setMeta()`, `getMeta()`
  - [x] 新增 `markSynced(id: string)` — 将 journal.status 从 `pending` 改为 `ai_done`
  - [x] 新增 `syncToSupabase(journals: Journal[])` — 调用 Supabase 批量 upsert（此时为 stub，Epic 9 表创建前静默返回）

- [x] Task 2: 重构 Zustand store (AC: #2)
  - [x] 新增 `isSyncing: boolean` state
  - [x] `addJournal` action 改为：先写 IndexedDB → 异步调用 `syncToSupabase` → 设置 `isSyncing`
  - [x] 确保所有 state 更新使用不可变模式（已有，保持不变）

- [x] Task 3: 同步函数实现 (AC: #3)
  - [x] `syncToSupabase` 实现：检查 Supabase 客户端可用性 → 检查用户登录状态 → 批量 upsert 到 `journals` 表
  - [x] 成功后调用 `markSynced(id)` 更新 IndexedDB
  - [x] 错误处理：`try/catch` 静默失败，`console.warn` 日志，不抛异常

## Dev Notes

### 架构约束

- **项目起点**：保留现有 `xiaozhi-journal/` 项目，不重新初始化
- **包管理器**：使用 `pnpm`（已正式采纳为项目包管理器），遵循 `package.json` 中 `packageManager` 字段声明
- **文件命名**：lib 文件使用 camelCase（`db.ts`），与现有 `supabase.ts`、`ai.ts` 一致
- **导入别名**：`@/*` 映射到 `./src/*`，已在 `tsconfig.json` 中配置
- **离线优先架构**：用户输入 → IndexedDB（本地缓存）→ 后台同步 Supabase → Zustand store 更新 → 组件重渲染

### 前置 Story 依赖

- **Story 1.1**（已完成）：创建了 `src/lib/supabase.ts` Supabase 客户端单例
  - 本 Story 的 `syncToSupabase` 函数会 import 该客户端

### 当前代码库状态（重要）

通过代码扫描发现：

1. **`lib/db.ts` 已有部分 AC 方法**：
   - ✅ `getJournals()`, `addJournal()`, `updateJournal()`, `getJournalById()` — 已存在
   - ✅ `getPendingJournals()` — 已存在（使用 `getAllFromIndex('journals', 'status', 'pending')`）
   - ✅ `setMeta()`, `getMeta()` — 已存在
   - ❌ `deleteJournal(id)` — **缺失**，需新增
   - ❌ `markSynced(id)` — **缺失**，需新增
   - ❌ `syncToSupabase(journals)` — **缺失**，需新增

2. **`store/journal.ts` 当前状态**：
   - 已有 `journals`, `loading`, `error`, `selectedMood`, `draftContent`, `aiWaiting`, `latestAIResponse`
   - 缺少 `isSyncing` state
   - `addJournal` 目前只写 IndexedDB，不触发同步

3. **`page.tsx` 已有在线同步逻辑**：
   - `useEffect` 监听 `navigator.onLine`，在线时调用 `getPendingJournals()` + `fetch('/api/journal')`
   - 这个逻辑是调用 `/api/journal` Route Handler 获取 AI 回应，而非直接同步到 Supabase
   - 本 Story 的 `syncToSupabase` 是另一个层面：将 pending 数据写入 Supabase `journals` 表

### 技术规格

- **Supabase journals 表结构**（参考 architecture.md）：
  ```
  journals: id uuid PK, user_id uuid FK, content text, mood int, mood_emoji text,
  ai_response text, golden_quote text, mood_label text, created_at timestamptz, status text
  ```
- **字段映射**：前端 `camelCase` → 数据库 `snake_case`
  - `moodEmoji` → `mood_emoji`, `aiResponse` → `ai_response`, `goldenQuote` → `golden_quote`, `moodLabel` → `mood_label`
- **冲突解决**：last-write-wins（upsert 时以 `id` 为准）
- **认证状态**：Epic 8（用户注册登录）尚未实现，`syncToSupabase` 需检查 `supabase.auth.getUser()`，未登录时静默返回
- **DB 版本**：当前 IndexedDB 版本为 1，不需要升级（不修改 store 结构）

### syncToSupabase 实现要点

```typescript
import { supabase } from './supabase'

export async function syncToSupabase(journals: Journal[]) {
  if (journals.length === 0) return

  // 检查用户登录状态
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return // 未登录，静默返回

  // 批量 upsert 到 Supabase
  const records = journals.map(j => ({
    id: j.id,
    user_id: user.id,
    content: j.content,
    mood: j.mood,
    mood_emoji: j.moodEmoji,
    ai_response: j.aiResponse,
    golden_quote: j.goldenQuote,
    mood_label: j.moodLabel,
    created_at: j.timestamp,
    status: j.status,
  }))

  const { error } = await supabase
    .from('journals')
    .upsert(records)

  if (error) {
    console.warn('[CacheProvider] syncToSupabase failed:', error.message)
    return // 静默失败，不阻塞
  }

  // 成功后标记已同步
  for (const j of journals) {
    await markSynced(j.id)
  }
}
```

### 注意事项

1. **Epic 9 数据库表尚未创建**：`syncToSupabase` 在 Epic 9（Story 9.1）执行前会因表不存在而失败，这是预期的。当前只需保证函数逻辑正确，静默失败即可。

2. **不破坏现有行为**：`page.tsx` 中的在线同步逻辑（调用 `/api/journal` 获取 AI 回应）应保持不变。本 Story 新增的 `syncToSupabase` 是额外的云端同步层。

3. **`deleteJournal` 实现**：简单调用 `db.delete('journals', id)`，同时清理 Zustand store 中对应条目。

### 测试标准

- 本项目不写单元测试，手动验证
- 验证点：
  1. `pnpm dev` 启动无报错
  2. 添加日记后 IndexedDB 中有数据，status 为 `pending`
  3. `markSynced(id)` 调用后 status 变为 `ai_done`
  4. 未登录时 `syncToSupabase` 不报错
  5. TypeScript 编译通过（`tsc --noEmit` 无报错）

### File List (预期修改)

- `src/lib/db.ts` — 新增 `deleteJournal`, `markSynced`, `syncToSupabase`
- `src/store/journal.ts` — 新增 `isSyncing` state，重构 `addJournal` 触发同步
- `src/types/index.ts` — 可能不需要修改（现有 `Journal` 类型已包含 `status` 字段）

### References

- [Source: architecture.md#Data Architecture — 缓存策略]
- [Source: architecture.md#Implementation Patterns & Consistency Rules]
- [Source: architecture.md#Project Structure — src/lib/db.ts 描述]
- [Source: epics.md#Epic 1 → Story 1.2]
- [Source: project-context.md#Technology Stack — idb 8.0.3, Zustand 5.0.12]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

- `tsc --noEmit` 编译通过，无报错
- `pnpm dev` 启动正常（已有实例在 3000 端口运行）
- `lib/db.ts` 新增 3 个函数：`deleteJournal`, `markSynced`, `syncToSupabase`
- `store/journal.ts` 新增 `isSyncing` state，`addJournal` 改为先写 IndexedDB 再异步触发 Supabase 同步
- 同步逻辑在未登录/表不存在时静默失败，不阻塞用户操作

### Change Log

- 修复 P1 `markSynced` 直接 mutate journal 对象 → 改为展开创建新对象后再 `put`

### File List

- `src/lib/db.ts` — 新增 `deleteJournal`, `markSynced`, `syncToSupabase`，import supabase 客户端
- `src/store/journal.ts` — 新增 `isSyncing` state，重构 `addJournal` 触发异步同步
