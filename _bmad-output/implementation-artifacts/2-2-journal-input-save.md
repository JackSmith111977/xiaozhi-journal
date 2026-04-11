Status: review

# Story 2.2: 日记输入框 + 保存

## Story

As a 选择了心情的用户,
I want 一个温和无压力的输入框写日记,
so that 我可以自由表达今天的感受。

## Acceptance Criteria

1. **Given** 用户已选择心情表情
   **When** 输入框出现
   **Then** 输入框为聊天气泡风格：无外框，底部 2px 暖灰线，圆角底部
   **And** placeholder 为 "随便写点什么吧，哪怕只有一句话"
   **And** 高度自动增长，最多 200px，超出可滚动
   **And** 不显示字数提示

2. **Given** 用户在输入框中输入内容
   **When** 点击 Primary 按钮（暖珊瑚实心，白字，圆角 12px）或按 Ctrl/Cmd + Enter
   **Then** 日记内容 + 心情被保存到 IndexedDB（调用 `addJournal()`）
   **And** 输入框淡出
   **And** 状态更新为 `pending`
   **And** 显示 "记下了 ✨" 成功提示（柔绿背景，3 秒后淡出）

3. **Given** 用户输入了内容但刷新页面
   **When** 页面重新加载
   **Then** 输入框中的草稿不丢失（自动保存到 IndexedDB，刷新后可恢复）

## Tasks / Subtasks

- [x] Task 1: 创建日记输入框组件 (AC: #1)
  - [x] 创建 `components/journal-input.tsx`
  - [x] 实现聊天气泡风格输入框（无外框，底部 2px 暖灰线）
  - [x] 实现自动高度增长（max 200px）
  - [x] 设置 placeholder 文案
- [x] Task 2: 实现保存逻辑 (AC: #2)
  - [x] 实现 Primary 按钮点击保存
  - [x] 实现 Ctrl/Cmd + Enter 快捷键保存
  - [x] 调用 store.addJournal() 写入 IndexedDB
  - [x] 实现成功提示（"记下了 ✨"，柔绿背景，3 秒淡出）
- [x] Task 3: 实现草稿自动保存 (AC: #3)
  - [x] 输入内容时自动保存到 IndexedDB（debounce）
  - [x] 页面加载时检查并恢复草稿

## Dev Notes

### 按钮层级
- **Primary**：暖珊瑚 `#D4856A` 实心，白字，圆角 12px — "发送"日记

### 反馈模式
- **成功**：柔绿 `#A8C5A0` 背景 + 白底卡片，弹性滑入，3 秒后淡出
- 成功文案："记下了 ✨"（非"保存成功"）

### 草稿策略
- 使用 debounce（300ms）自动保存到 IndexedDB
- 刷新页面时从 IndexedDB 恢复未发送的草稿

### References
- [Source: ux-design-specification.md#Form Patterns]
- [Source: ux-design-specification.md#Feedback Patterns]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
