Status: review

# Story 1.3: 种子数据注入 + 空状态引导

## Story

As a 首次打开的用户,
I want 看到预设的演示内容和友好的引导,
So that 我不是面对空白页面，能立即理解这个 App 是做什么的。

## Acceptance Criteria

1. **Given** IndexedDB 为空（首次访问）
   **When** 应用启动时检查 `appMeta.seedDataLoaded`
   **Then** 如果未设置，自动写入 3 条预设日记数据（焦虑/开心/平静，含 AI 回应和金句）
   **And** 设置 `appMeta.seedDataLoaded = true`
   **And** 3 条数据的 timestamp 分别为 3 天前、昨天、今天

2. **Given** 无历史数据（非种子场景）
   **When** 用户看到首页
   **Then** 显示空状态引导（`empty-state.tsx`）：插画 + "你的第一条日记从这里开始 ✨"
   **And** 插画有 2s 循环微浮动动画（Framer Motion）
   **And** 引导文案使用朋友语气（符合 UX-DR18）
   **And** 波形图显示浅灰色装饰线 + 引导文案（符合 UX-DR22 空状态）

## Tasks / Subtasks

- [x] Task 1: 种子数据注入 (AC: #1)
  - [x] 审查现有 `seed-data.ts` 和 `page.tsx` 中的 seeding 逻辑是否满足 AC
  - [x] 确认 seed 数据包含 `aiResponse`, `goldenQuote`, `moodLabel`
  - [x] 确认 `appMeta.seedDataLoaded` 检查逻辑正确（防重复注入）

- [x] Task 2: 空状态 UI 审查与修复 (AC: #2)
  - [x] 审查现有 `empty-state.tsx`：确认有 2s 浮动动画、插画、引导文案
  - [x] 审查 `emotion-chart.tsx` 空状态：确认有浅灰色装饰线 + 引导文案
  - [x] 确认文案使用朋友语气，无居高临下感

## Dev Notes

### 前置 Story 依赖

- **Story 1.1**（已完成）：Supabase 客户端初始化
- **Story 1.2**（已完成）：IndexedDB 缓存层重构 + `markSynced`、`deleteJournal`、`syncToSupabase`

### 当前代码库状态（重要）

通过代码扫描发现，**大部分功能已存在**：

1. **`seed-data.ts` 已完整实现**：
   - ✅ 3 条种子数据：焦虑(mood=2)、开心(mood=4)、平静(mood=3)
   - ✅ 每条含 `aiResponse`, `goldenQuote`, `moodLabel`
   - ✅ timestamp 分别为 3 天前、昨天、今天

2. **`page.tsx` 已有 seeding 逻辑**：
   - ✅ `seedData` 函数检查 `getMeta('seedDataLoaded')`
   - ✅ 写入 3 条 SEED_JOURNALS 到 IndexedDB
   - ✅ 设置 `appMeta.seedDataLoaded = true`
   - ✅ 使用 `seedingRef` 防止并发重复

3. **`empty-state.tsx` 已实现**：
   - ✅ Framer Motion 2s 循环浮动动画（`animate={{ y: [0, -6, 0] }}`）
   - ✅ SVG 圆环 + ✨ 图标
   - ✅ 引导文案："你的第一条日记从这里开始 ✨"

4. **`emotion-chart.tsx` 已有空状态处理**：
   - ✅ 无数据时显示浅灰色虚线装饰线 + 引导文案
   - ✅ 数据 < 2 条时显示"再多写几天，波形图就会长出来 ✨"

### 潜在问题

1. **种子数据 status 为 `ai_done` 但 `page.tsx` 的 `processPending` 可能重复处理**：种子数据的 status 是 `ai_done`，不会被 `getPendingJournals()` 匹配，不会重复调用 AI。✅ 安全。

2. **`empty-state.tsx` 文案颜色**：当前为 `#8A817C`（暖灰色），符合 UX-DR22 要求。✅ 安全。

3. **种子数据重复注入风险**：`getMeta('seedDataLoaded')` 检查 + `seedingRef` 双重保护，不会重复注入。✅ 安全。

### 本次 Story 主要工作

本 Story 的核心是**审查和验证**已有实现是否符合 AC，而非从头实现。可能的修改点：

1. **空状态文案增强**（P2 优化）：当前空状态只有简单一行文案。可以考虑增加第二行更温暖的引导，如 "写点什么吧，小知会认真听" — 但这不是必须的，取决于对 UX 的判断。

2. **种子数据 ID 生成**：`page.tsx` 中使用 `crypto.randomUUID()` 生成 ID，但种子数据在 `seed-data.ts` 中 `Omit<Journal, 'id'>` 不含 ID。当前实现正确，无需修改。

### 架构约束

- **文件命名**：组件文件 kebab-case，与现有模式一致
- **动画**：使用 Framer Motion，`prefers-reduced-motion` 场景跳过动画（本项目未考虑无障碍，可后续添加）
- **设计 Token**：暖灰 `#8A817C`，装饰线 `#E8E0D8`

### 测试标准

- 本项目不写单元测试，手动验证
- 验证点：
  1. 清空 IndexedDB 后刷新页面，3 条种子数据自动写入
  2. 再次刷新页面，种子数据不重复注入
  3. 空状态引导组件正常显示（无数据时）
  4. 波形图空状态引导正常显示
  5. `npm run dev` 启动无报错
  6. TypeScript 编译通过（`tsc --noEmit` 无报错）

### File List (预期)

- 可能无需修改（已有实现已满足 AC）
- 如有修改，预期为：`src/components/empty-state.tsx`（文案增强）

### References

- [Source: epics.md#Epic 1 → Story 1.3]
- [Source: architecture.md#UX Design Requirements]
- [Source: ux-design-specification.md#UX-DR11 EmptyState, UX-DR22]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

- 代码扫描确认：种子数据注入和空状态 UI 已在早期开发中完整实现
- `seed-data.ts` — 3 条种子数据完整，含 AI 回应、金句、情绪标签
- `page.tsx` — `seedData` 函数有 `getMeta('seedDataLoaded')` 防重复保护
- `empty-state.tsx` — 2s Framer Motion 浮动动画 + SVG 插画 + 朋友语气引导文案
- `emotion-chart.tsx` — 无数据时浅灰色虚线装饰线 + 引导文案
- 所有 Acceptance Criteria 已满足，无需修改任何代码

### File List

- 无修改 — 已有实现已满足全部 AC

## Change Log

Story 1.3 为审查验证型 Story，确认现有代码已满足全部 Acceptance Criteria，无需新增或修改文件。
