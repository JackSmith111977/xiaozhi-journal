Status: review

# Story 3.3: 离线处理 + 异步 AI 回调

## Story

As a 网络断开时的用户,
I want 日记仍然能保存,
so that 我不会丢失任何记录。

## Acceptance Criteria

1. **Given** 用户网络断开
   **When** 用户提交日记
   **Then** 日记成功写入 IndexedDB，status 标记为 `pending`
   **And** 显示 "日记已保存，小知在路上~"（暖灰提示条，非红色报错）
   **And** 不出现任何错误弹窗

2. **Given** 网络恢复
   **When** 浏览器检测到在线
   **Then** 自动调用 `POST /api/journal` 处理 pending 状态的日记
   **And** AI 回应到达后更新该日记的 `aiResponse`, `goldenQuote`, `status='ai_done'`

## Tasks / Subtasks

- [x] Task 1: 实现离线保存 (AC: #1)
  - [x] 在 journal-input 中检测网络状态（navigator.onLine）
  - [x] 离线时仍然保存到 IndexedDB，status 标记为 `pending`
  - [x] 显示暖灰提示条："日记已保存，小知在路上~"
- [x] Task 2: 实现异步 AI 回调 (AC: #2)
  - [x] 监听 online 事件
  - [x] 网络恢复后自动查询所有 pending 状态的日记
  - [x] 逐条调用 `POST /api/journal` 获取 AI 回应
  - [x] 更新 IndexedDB 中的 aiResponse, goldenQuote, status='ai_done'

## Dev Notes

### 网络状态检测
- 使用 `navigator.onLine` 检测当前网络状态
- 监听 `window.addEventListener('online', ...)` 和 `window.addEventListener('offline', ...)`

### 提示条样式
- 背景：浅米色 `#F5EDE4`
- 文字：暖灰色 `#8A817C`
- 非红色报错，保持温度

### 重试策略
- 网络恢复后自动处理所有 pending 日记
- 使用队列模式，逐条处理

### References
- [Source: architecture.md#Error Handling Patterns]
- [Source: prd.md#空状态与 Fallback 设计]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
