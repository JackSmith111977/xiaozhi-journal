Status: review

# Story 5.2: 单条日记详情

## Story

As a 想深入了解某篇日记的用户,
I want 点击查看完整内容,
so that 我能重新阅读日记和 AI 回应。

## Acceptance Criteria

1. **Given** 用户在历史列表中
   **When** 点击某条日记
   **Then** 展示完整日记：日期、心情表情、正文、小知回应气泡、金句卡片
   **And** 布局与首页相同，但内容完整显示

2. **Given** 用户查看完详情
   **When** 点击返回或按 Esc
   **Then** 返回历史列表，保持滚动位置

## Tasks / Subtasks

- [x] Task 1: 创建日记详情页面/组件 (AC: #1)
  - [x] 创建 `app/history/[id]/page.tsx` 或详情组件
  - [x] 展示完整内容：日期、心情表情、正文、小知气泡、金句卡片
  - [x] 复用已有的 XiaozhiBubble 和 GoldenQuote 组件
- [x] Task 2: 实现返回交互 (AC: #2)
  - [x] 实现返回按钮
  - [x] 实现 Esc 键返回列表
  - [x] 保持滚动位置

## Dev Notes

### 复用组件
- XiaozhiBubble：小知回应气泡
- GoldenQuote：金句卡片
- MoodSelector：心情表情（只读模式）

### 路由策略
- 使用 Next.js App Router 路由：`/history/[id]`
- 或使用 Modal/Dialog 模式展示详情

### References
- [Source: epics.md#Story 5.2]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
