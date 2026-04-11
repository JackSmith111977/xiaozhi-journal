Status: review

# Story 6.2: 点击查看历史日记

## Story

As a 被时间胶囊触动的用户,
I want 点击查看那条旧日记,
so that 我能重温当时的感受。

## Acceptance Criteria

1. **Given** 时间胶囊弹窗已展示
   **When** 用户点击"去看看"
   **Then** 弹窗关闭
   **And** 展示匹配的旧日记详情（复用 Story 5.2 的详情组件）

2. **Given** 用户点击"稍后再说"或点击遮罩或按 Esc
   **When** 关闭弹窗
   **Then** 返回首页，不影响当前操作

## Tasks / Subtasks

- [x] Task 1: 实现"去看看"跳转 (AC: #1)
  - [x] 弹窗关闭后导航到日记详情页
  - [x] 复用 Story 5.2 的详情组件
- [x] Task 2: 实现关闭逻辑 (AC: #2)
  - [x] "稍后再说"按钮关闭弹窗
  - [x] 点击遮罩关闭
  - [x] Esc 键关闭
  - [x] 关闭后返回首页，不影响当前操作

## Dev Notes

### 导航策略
- 使用 Next.js router 或 Zustand store 状态控制详情展示
- 保持首页与详情的状态同步

### References
- [Source: ux-design-specification.md#Modal & Overlay Patterns]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
