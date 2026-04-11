Status: review

# Story 3.2: 打字机动画 + 金句卡片

## Story

As a 等待 AI 回应的用户,
I want 看到文字逐字出现，然后金句翻转揭示,
so that 等待本身成为情感体验的一部分。

## Acceptance Criteria

1. **Given** 用户提交了日记，AI 调用开始
   **When** 等待 AI 响应
   **Then** 显示 TypingIndicator 组件："小知正在想..." + 3 个跳动圆点（暖灰色 `#8A817C`）

2. **Given** AI 响应到达
   **When** 响应数据可用
   **Then** 先显示 XiaozhiBubble 气泡，使用打字机动画（~50ms/字）
   **And** 打字机完成后 0.3s，QuoteCard 金句卡片 3D 翻转揭示（0.6s CSS 3D transform）
   **And** 金句卡片样式：左侧 3px 暖珊瑚装饰线，Noto Serif SC italic 20px，背景 `#F5EDE4`，圆角 24px

3. **Given** 用户开启了 `prefers-reduced-motion`
   **When** AI 响应到达
   **Then** 打字机动画和翻转动画被跳过，直接显示完整内容

## Tasks / Subtasks

- [x] Task 1: 实现打字机指示器 (AC: #1)
  - [x] 创建 `components/typing-indicator.tsx`
  - [x] 实现 "小知正在想..." + 3 个跳动圆点动画
  - [x] 使用 Framer Motion 实现跳动动画
- [x] Task 2: 实现小知回应气泡 (AC: #2)
  - [x] 创建 `components/xiaozhi-bubble.tsx`
  - [x] 实现打字机动画（~50ms/字）
  - [x] 左侧对齐，带气泡尾
- [x] Task 3: 实现金句卡片 (AC: #2, #3)
  - [x] 创建 `components/golden-quote.tsx`
  - [x] 实现 3D 翻转揭示动画（0.6s）
  - [x] 实现杂志引用样式（左侧 3px 暖珊瑚线，Noto Serif SC italic 20px）
  - [x] 实现 `prefers-reduced-motion` 降级

## Dev Notes

### 动效参数
- 打字机速度：~50ms/字
- 金句翻转：0.6s CSS 3D transform
- 翻转后延迟：打字机完成后 0.3s

### 金句卡片样式
- 左侧 3px 暖珊瑚装饰线
- Noto Serif SC italic 20px
- 背景 `#F5EDE4`
- 圆角 24px

### References
- [Source: ux-design-specification.md#QuoteCard]
- [Source: ux-design-specification.md#XiaozhiBubble]
- [Source: ux-design-specification.md#TypingIndicator]
- [Source: ux-design-specification.md#Motion & Animation Patterns]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
