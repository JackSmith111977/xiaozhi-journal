Status: done

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

- [x] Task 1: 实现独立 EmotionTooltip 组件 (AC: #1)
  - [x] 新建 `src/components/emotion-tooltip.tsx`
  - [x] 实现 `position: fixed` 定位 + `getBoundingClientRect` 坐标映射
  - [x] 实现边界 clamp（防止溢出视口）
  - [x] 实现 Framer Motion 淡入淡出动画
  - [x] 实现 resize 监听自动重新计算位置
- [x] Task 2: 集成到 EmotionChart (AC: #1)
  - [x] 添加 `svgRef` 到 emotion-chart
  - [x] 移除内联 SVG tooltip（`<motion.g>` 块）
  - [x] 渲染 `EmotionTooltip` 组件
- [x] Task 3: 无数据引导 (AC: #2)
  - [x] 检测 journals 为空时显示引导状态
  - [x] 绘制浅灰色装饰线
  - [x] 显示引导文案（暖灰色，Noto Sans SC 14px）

## Dev Notes

### Tooltip 规格
- **实现方式**：独立 HTML 组件 `emotion-tooltip.tsx`，非内联 SVG
- **内容**：日期 + 心情标签 + 日记摘要（前 20 字，超出 truncate）
- **定位**：数据点上方 8px 居中，边缘数据点自动 clamp 防止溢出视口
- **样式**：`#F5EDE4` 背景 + `#E8E0D8` 边框 + `rounded-xl` + `shadow-lg`
- **位置计算**：通过 `getBoundingClientRect` 映射 SVG viewBox 坐标到屏幕像素
- **动画**：Framer Motion 淡入淡出（`opacity: 0 → 1, y: 5 → 0`, 0.15s）
- **交互**：`pointer-events-none` 不拦截鼠标事件
- **响应式**：窗口 resize 时自动重新计算位置

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

### Completion Notes List

**Task 1: 实现独立 EmotionTooltip 组件**
- 新建 `src/components/emotion-tooltip.tsx`
- 使用 `position: fixed` 定位，完全脱离 SVG viewBox 裁剪上下文
- `computePos()` 通过 `getBoundingClientRect` 映射 SVG viewBox 坐标到屏幕像素
- 边界 clamp：`Math.max(margin, Math.min(window.innerWidth - tw - margin, left))`，确保永远在视口内
- Fallback 尺寸（`TOOLTIP_MAX_WIDTH + TOOLTIP_PADDING_X`, `TOOLTIP_HEIGHT`）用于首次渲染时元素尚未测量的情况
- `useEffect` 替代 `useLayoutEffect`，确保 paint 后测量尺寸准确
- resize 监听自动重新计算位置
- **z-index 修复**：初始使用 `z-50` 但被 SVG stacking context 遮挡，改为 `style={{ zIndex: 9999 }}` 确保始终在最上层

**Task 2: 集成到 EmotionChart**
- `emotion-chart.tsx` 添加 `svgRef` 引用
- 移除内联 SVG `<motion.g>` tooltip 块
- **将 `<EmotionTooltip>` 渲染位置从 SVG 内部移到 `<svg>` 外部作为兄弟元素** — 避免 tooltip 触发 `onMouseLeave` 事件导致闪烁
- `AnimatePresence` 保留在 `<motion.div>` 层级，负责进出动画

**浏览器验证：**
- Next.js DevTools `console_messages`: 0 errors, 0 warnings
- 左侧数据点 tooltip 正常显示，无截断
- 右侧数据点 tooltip 正常显示，无截断
- 所有 tooltip 位置正确，z-index 9999 确保不被 SVG 遮挡

### File List

| 操作 | 文件路径 |
|------|---------|
| 新增 | `src/components/emotion-tooltip.tsx` |
| 修改 | `src/components/emotion-chart.tsx` |

### Change Log

- 将 tooltip 从内联 SVG 提取为独立 HTML 组件（`emotion-tooltip.tsx`）
- 使用 `position: fixed` 脱离 SVG viewBox 裁剪上下文
- 实现 `getBoundingClientRect` 坐标映射 + 边界 clamp
- 将 `<EmotionTooltip>` 渲染位置从 `<svg>` 内部移到外部作为兄弟元素，避免 `onMouseLeave` 事件干扰
- z-index 从 `z-50` 改为 `style={{ zIndex: 9999 }}`，确保不被 SVG stacking context 遮挡
- 添加 resize 监听支持响应式场景

### Review Findings

- [x] [Review][Patch] AnimatePresence 缺少 `key` prop — `<EmotionTooltip>` 未设置 `key={hovered}`，AnimatePresence 无法区分不同数据点的 enter/exit，快速 hover 切换时 exit 动画不播放 [`emotion-chart.tsx`:122] — fixed: added `key={hovered}`
- [x] [Review][Defer] resize 事件无节流/防抖 — `window.addEventListener('resize', computePos)` 在窗口调整大小时每帧触发 getBoundingClientRect + setState，可能导致性能抖动；deferred，tooltip 场景可接受
- [x] [Review][Defer] svgRef 作为 useCallback 依赖不必要 — ref 对象本身是稳定的，hover 切换数据点时 computePos 重建导致 resize listener 频繁卸载重装；deferred，不影响正确性
- [x] [Review][Defer] SSR 环境 window 访问无守卫 — `computePos` 中使用 `window.innerWidth/Height`，虽然 useEffect 只在客户端运行，但可加 `typeof window` 守卫增强防御性；deferred
- [x] [Review][Defer] mood 值无边界约束 — `Math.round(avgMood)` 理论上可能超出 1-5 范围（如所有 journal mood 为 0），`as 1 | 2 | 3 | 4 | 5` 断言掩盖类型不匹配；deferred，实际数据源保证 mood 在 1-5 范围内
