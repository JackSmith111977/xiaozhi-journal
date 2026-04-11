Status: review

# Story 4.1: 自绘 SVG 波形图 + 7 天趋势

## Story

As a 想看自己心情变化的用户,
I want 看到过去 7 天的情绪波形图,
so that 我一眼就能了解自己的心情趋势。

## Acceptance Criteria

1. **Given** 用户打开首页
   **When** 页面渲染
   **Then** 显示 7 天情绪波形图（自绘 SVG `<polyline>`）
   **And** 图表尺寸：宽 100%（max 640px），高 120px
   **And** 波形线使用渐变色 `#A8C5A0` → `#D4856A`，`stroke-width: 1.5`
   **And** Y 轴映射 5 个心情等级（1=😡 到 5=😊）
   **And** 入场时有 0.8s 生长动画（Framer Motion `animate`）

2. **Given** 波形图有数据
   **When** 新的日记数据点出现
   **Then** 新数据点以弹性弹跳动画"生长"到波形图上
   **And** 每个数据点上方显示对应的心情表情图标

## Tasks / Subtasks

- [x] Task 1: 创建波形图组件 (AC: #1)
  - [x] 创建 `components/emotion-chart.tsx`
  - [x] 实现自绘 SVG `<polyline>` 波形
  - [x] 实现渐变色（`#A8C5A0` → `#D4856A`）
  - [x] 实现 Y 轴 5 级心情映射
  - [x] 添加 0.8s 入场生长动画（Framer Motion）
- [x] Task 2: 实现数据点更新 (AC: #2)
  - [x] 新数据点弹性弹跳动画添加到波形图
  - [x] 数据点上方显示对应心情表情图标

## Dev Notes

### 波形图规格
- 尺寸：宽 100%（max 640px），高 120px
- 波形线：渐变 `#A8C5A0` → `#D4856A`，`stroke-width: 1.5`
- Y 轴：1=😡, 2=😔, 3=😐, 4=😊, 5=😴
- 动画：0.8s 入场生长，新数据点弹性弹跳

### 数据来源
- 从 Zustand store 读取 journals
- 按最近 7 天聚合数据

### 技术选择
- 使用自绘 SVG（非 recharts），Framer Motion 动画
- `<polyline>` 绘制波形线

### References
- [Source: architecture.md#Frontend Architecture]
- [Source: ux-design-specification.md#WaveChart]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
