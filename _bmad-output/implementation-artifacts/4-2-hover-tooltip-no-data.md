Status: review

# Story 4.2: Hover 数据点 + 无数据引导

## Story

As a 查看波形图的用户,
I want 悬停时看到具体信息,
so that 我能了解某一天的详细心情。

## Acceptance Criteria

1. **Given** 波形图已渲染
   **When** 鼠标悬停在数据点上
   **Then** 显示 tooltip：日期 + 心情表情 + 日记摘要（前 20 字）
   **And** 数据点高亮放大（scale 1.5）

2. **Given** 波形图无数据（首次使用且种子未加载）
   **When** 页面渲染
   **Then** 显示一条浅灰色装饰线 + 引导文案："你的第一条日记从这里开始 ✨"
   **And** 引导文字使用暖灰色 `#8A817C`，Noto Sans SC 14px

## Tasks / Subtasks

- [x] Task 1: 实现 Hover 交互 (AC: #1)
  - [x] 在波形图数据点上添加 hover 事件
  - [x] 实现 tooltip 组件（日期 + 心情表情 + 摘要前 20 字）
  - [x] 数据点高亮放大（scale 1.5）
- [x] Task 2: 实现无数据引导 (AC: #2)
  - [x] 检测 journals 为空时显示引导状态
  - [x] 绘制浅灰色装饰线
  - [x] 显示引导文案（暖灰色，Noto Sans SC 14px）

## Dev Notes

### Tooltip 规格
- 内容：日期 + 心情表情 + 日记摘要（前 20 字）
- 位置：数据点上方
- 样式：白底 + 暖灰阴影

### 空状态样式
- 装饰线：浅灰色 `<polyline>`
- 引导文案：暖灰色 `#8A817C`，Noto Sans SC 14px

### References
- [Source: ux-design-specification.md#Empty & Loading States]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
