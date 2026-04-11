Status: review

# Story 1.3: 种子数据注入 + 空状态引导

## Story

As a 首次打开的用户,
I want 看到预设的演示内容和友好的引导,
so that 我不是面对空白页面，能立即理解这个 App 是做什么的。

## Acceptance Criteria

1. **Given** IndexedDB 为空（首次访问）
   **When** 应用启动时检查 `appMeta.seedDataLoaded`
   **Then** 如果未设置，自动写入 3 条预设日记数据（焦虑/开心/平静，含 AI 回应和金句）
   **And** 设置 `appMeta.seedDataLoaded = true`
   **And** 3 条数据的 timestamp 分别为 3 天前、昨天、今天

2. **Given** 无历史数据（非种子场景）
   **When** 用户看到首页
   **Then** 显示空状态引导：插画 + "你的第一条日记从这里开始 ✨"
   **And** 插画有 2s 循环微浮动动画
   **And** 引导文案使用朋友语气（UX-DR18）

## Tasks / Subtasks

- [x] Task 1: 创建种子数据 (AC: #1)
  - [x] 在 `lib/seed-data.ts` 定义 3 条预设日记数据
  - [x] 实现 seedJournals() 函数，写入前检查 appMeta.seedDataLoaded
- [x] Task 2: 实现空状态组件 (AC: #2)
  - [x] 创建 `components/empty-state.tsx`
  - [x] 实现插画 + 温柔文案布局
  - [x] 添加 2s 循环微浮动动画（CSS @keyframes 或 Framer Motion）

## Dev Notes

### 预设数据
1. **三天前 · 焦虑** — "明天要交的方案还没写完，改了 3 版都不满意" → 金句："第 3 版不是失败，是第 3 次不肯妥协的自己"
2. **昨天 · 开心** — "今天被夸了！虽然只是一个小功能，但开心了一整天" → 金句："原来一个小小的肯定，就能让人开心一整天"
3. **今天 · 平静** — "周末的下午，什么都不想做，就这样吧" → 金句："允许自己什么都不做，本身就是一种勇敢"

### 文案规范
- 朋友语气，不用技术/产品术语
- 空状态："你的第一条日记从这里开始 ✨"（非"暂无数据"）

### References
- [Source: prd.md#Demo 示例数据]
- [Source: ux-design-specification.md#Empty & Loading States]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
