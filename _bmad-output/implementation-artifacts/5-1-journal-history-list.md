Status: review

# Story 5.1: 历史日记列表

## Story

As a 想回顾过去的用户,
I want 按时间顺序查看我的所有日记,
so that 我能回顾自己的心路历程。

## Acceptance Criteria

1. **Given** 用户在首页
   **When** 点击底部 Tertiary 文字按钮 "查看过往记录"
   **Then** 页面淡入淡出切换到历史列表（0.3s Framer Motion）
   **And** 按时间倒序显示所有日记条目
   **And** 每条显示：日期、心情表情、日记摘要（前 50 字）、AI 金句（如果有）

2. **Given** 日记数量较多（>10 条）
   **When** 查看列表
   **Then** 列表可滚动，每条之间有 16px 间距

## Tasks / Subtasks

- [x] Task 1: 创建历史列表页面/组件 (AC: #1)
  - [x] 创建 `app/history/page.tsx` 或历史列表组件
  - [x] 从 store 读取所有 journals，按时间倒序排列
  - [x] 实现列表项布局：日期、心情表情、摘要前 50 字、金句
  - [x] 添加 Tertiary 按钮入口
- [x] Task 2: 实现页面切换动画 (AC: #1)
  - [x] 首页与历史列表之间使用 Framer Motion 淡入淡出（0.3s）
- [x] Task 3: 处理大量数据 (AC: #2)
  - [x] 确保列表可滚动
  - [x] 列表项之间 16px 间距

## Dev Notes

### 导航模式
- 首页底部 Tertiary 文字按钮："查看过往记录"
- 页面切换：淡入淡出 0.3s

### 列表项规格
- 日期：Noto Sans SC 12px，暖灰色
- 心情表情：对应图标
- 日记摘要：前 50 字
- AI 金句：如果有则显示

### References
- [Source: ux-design-specification.md#Navigation Patterns]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
