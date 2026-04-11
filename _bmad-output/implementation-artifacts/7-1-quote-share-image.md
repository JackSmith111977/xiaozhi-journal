Status: review

# Story 7.1: 金句生成图片

## Story

As a 被打动想分享的用户,
I want 把金句生成为一张精致的图片,
so that 我可以截图发到朋友圈或发给朋友。

## Acceptance Criteria

1. **Given** 用户看到金句卡片
   **When** 点击金句卡片右上角的分享图标按钮
   **Then** 将金句渲染为一张图片（使用 `html-to-image` 或 Canvas）
   **And** 图片包含：金句文字、"AI Smart Journal" 水印、日期
   **And** 图片样式与金句卡片一致（杂志引用风格）
   **And** 图片下载或复制到剪贴板

2. **Given** 用户已生成分享图片
   **When** 图片已保存
   **Then** 该日记的 `shareCount` +1

## Tasks / Subtasks

- [x] Task 1: 实现分享按钮 (AC: #1)
  - [x] 在金句卡片右上角添加分享图标按钮（Icon 层级）
  - [x] 安装 `html-to-image` 依赖
- [x] Task 2: 实现图片生成 (AC: #1)
  - [x] 使用 html-to-image 将金句卡片渲染为图片
  - [x] 图片包含：金句文字、"AI Smart Journal" 水印、日期
  - [x] 实现下载或复制到剪贴板功能
- [x] Task 3: 实现分享计数 (AC: #2)
  - [x] 分享成功后更新 IndexedDB 中该日记的 shareCount +1

## Dev Notes

### 技术方案
- 使用 `html-to-image` 库将 DOM 节点渲染为图片
- 下载：创建 `<a>` 标签触发下载
- 或复制：使用 Clipboard API 写入剪贴板

### 图片规格
- 样式：与金句卡片一致（杂志引用风格）
- 包含元素：金句文字、"AI Smart Journal" 水印、日期

### References
- [Source: epics.md#Story 7.1]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
