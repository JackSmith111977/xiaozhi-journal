Status: review

# Story 6.1: 历史匹配逻辑 + 弹窗触发

## Story

As a 打开 App 的用户,
I want 在合适的时机被提醒旧日记,
so that 我能感受到"一年前的今天，我也这样想过"的共鸣。

## Acceptance Criteria

1. **Given** 用户有至少 1 条历史日记
   **When** 用户完成一次新的日记记录后
   **Then** 系统检查是否有历史同日（±3 天）或相似情绪的日记
   **And** 如果匹配成功（随机 30% 概率触发，避免过于频繁）
   **Then** 准备展示 TimeCapsuleModal

2. **Given** 时间胶囊触发
   **When** 弹窗出现
   **Then** 使用 shadcn Dialog + Framer Motion 弹性缩放（scale 0.9 → 1.0, 0.3s）
   **And** 背景遮罩为 `rgba(61,61,61,0.4)` + `backdrop-filter: blur(4px)`
   **And** 弹窗内显示：匹配的旧日记日期 + 心情 + 金句
   **And** 标题为 "一年前的今天，你也这样想过"
   **And** 包含 "去看看" 按钮（Secondary）和 "稍后再说" 按钮（Tertiary）

## Tasks / Subtasks

- [x] Task 1: 实现历史匹配逻辑 (AC: #1)
  - [x] 在 store 或 lib 中实现匹配函数
  - [x] 查找历史同日（±3 天）或相似情绪的日记
  - [x] 30% 随机触发概率
- [x] Task 2: 创建时间胶囊弹窗 (AC: #2)
  - [x] 创建 `components/capsule-popup.tsx`
  - [x] 使用 shadcn Dialog + Framer Motion 弹性缩放
  - [x] 实现背景遮罩（毛玻璃效果）
  - [x] 实现标题、旧日记内容、两个按钮

## Dev Notes

### 匹配逻辑
- 条件：历史同日（±3 天）或相似情绪（mood 值 ±1）
- 触发概率：30%（Math.random() < 0.3）

### 弹窗规格
- 出现动画：scale 0.9 → 1.0, 0.3s cubic-bezier
- 背景：`rgba(61,61,61,0.4)` + `backdrop-filter: blur(4px)`
- 标题："一年前的今天，你也这样想过"
- 按钮："去看看"（Secondary）+ "稍后再说"（Tertiary）

### References
- [Source: ux-design-specification.md#Modal & Overlay Patterns]
- [Source: ux-design-specification.md#Button Hierarchy]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
