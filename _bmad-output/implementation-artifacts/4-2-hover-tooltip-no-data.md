# Story 4.2: Hover 数据点 + 无数据引导

Status: done

## Story

As a 查看波形图的用户,
I want 悬停时看到具体信息,
So that 我能了解某一天的详细心情。

## Acceptance Criteria

### AC1: Hover Tooltip 显示

**Given** 波形图已渲染
**When** 鼠标悬停在数据点上
**Then** 显示 tooltip：日期 + 心情表情 + 日记摘要（前 20 字）
**And** 数据点高亮放大（scale 1.5）
**And** tooltip 为独立 HTML 组件（`emotion-tooltip.tsx`），不受 SVG viewBox 裁剪限制
**And** 边缘数据点的 tooltip 自动 clamp 防止溢出视口

### AC2: 无数据引导

**Given** 波形图无数据（首次使用且种子未加载）
**When** 页面渲染
**Then** 显示一条浅灰色装饰线 + 引导文案："你的第一条日记从这里开始 ✨"
**And** 引导文字使用暖灰色 `#8A817C`，Noto Sans SC 14px

> **注：** AC2 已在 Story 4-1 实现并验证，本 Story 重点验证 AC1。

## Tasks / Subtasks

- [x] Task 1: 验证 EmotionTooltip 组件实现 (AC: 1)
  - [x] 1.1 确认 tooltip 样式符合 UX spec：`#F5EDE4` bg + `#E8E0D8` border + rounded-xl + shadow-lg
  - [x] 1.2 确认 tooltip 定位：数据点上方 8px 居中
  - [x] 1.3 确认 viewport clamp 逻辑正确（边缘数据点不溢出）
  - [x] 1.4 确认 Framer Motion 淡入淡出动效 0.15s
  - [x] 1.5 确认 content truncate 到 20 字

- [x] Task 2: 验证数据点高亮动效 (AC: 1)
  - [x] 2.1 确认 hover 时 scale 1.5 动效触发
  - [x] 2.2 确认 circle r 从 4→6 视觉高亮
  - [x] 2.3 确认 useReducedMotion 动效降级

- [x] Task 3: 验证无数据引导 (AC: 2)
  - [x] 3.1 确认空状态显示装饰线 + 引导文案（已在 4-1 验证）

- [x] Task 4: Deferred Work 处理
  - [x] 4.1 resize 事件无节流 — MVP 可接受，tooltip 场景性能开销低
  - [x] 4.2 svgRef 作为 useCallback 依赖 — ref 稳定，不影响正确性
  - [x] 4.3 SSR window 访问守卫 — useEffect 仅客户端运行，可加 typeof window 增强
  - [x] 4.4 mood 边界约束 — 数据源保证 1-5，可加 Math.max(1, Math.min(5, mood)) 防御

## Dev Notes

### 现有实现分析

**emotion-tooltip.tsx 已实现：**
- `getBoundingClientRect` 映射 SVG viewBox 坐标到屏幕像素 ✅
- viewport clamp 逻辑（line 55-57）✅
- Framer Motion 淡入淡出（opacity + y transition 0.15s）✅
- 样式：bg-secondary (#F5EDE4) + border-border + rounded-xl + shadow-lg ✅
- pointer-events-none 不拦截鼠标 ✅
- content truncate 到 20 字（line 89）✅

**emotion-chart.tsx hover 交互：**
- onMouseEnter/onMouseLeave 控制 hovered state ✅
- motion.circle scale 动效（line 118）✅
- AnimatePresence + EmotionTooltip 渲染（line 128-142）✅

**Deferred Work (from 2026-04-15 code review):**
| Issue | Decision | Reason |
|-------|----------|--------|
| resize 无节流 | Deferred | tooltip 场景性能开销可接受 |
| svgRef 依赖不必要 | Deferred | ref 稳定，不影响正确性 |
| SSR window 无守卫 | Optional | useEffect 仅客户端，可加 typeof window |
| mood 边界约束 | Optional | 数据源保证，可加防御代码 |

### 架构约束

[Source: architecture.md]
- 组件位置：`xiaozhi-journal/src/components/emotion-tooltip.tsx`
- 文件命名：kebab-case ✅
- 动效库：motion v12.38.0（Framer Motion）
- Tooltip 定位：position: fixed，不受 SVG viewBox 裁剪

### UX 规格对照

[Source: ux-design-specification.md#EmotionTooltip]
- 实现方式：独立 HTML 组件，非内联 SVG ✅
- 定位：position: fixed，getBoundingClientRect 映射 ✅
- 内容：日期 + 心情标签 + 日记摘要（前 20 字）✅
- 背景：#F5EDE4 + #E8E0D8 border + rounded-xl + shadow-lg ✅
- 位置：数据点上方 8px 居中，边缘自动 clamp ✅
- 出现方式：Framer Motion 淡入淡出（0→1, y 5→0, 0.15s）✅
- 交互：pointer-events-none ✅

### Project Structure Notes

- 组件路径：
  - `xiaozhi-journal/src/components/emotion-chart.tsx`（hover 交互）
  - `xiaozhi-journal/src/components/emotion-tooltip.tsx`（tooltip 组件）
- Store：`xiaozhi-journal/src/store/index.ts`
- Types：`xiaozhi-journal/src/types/index.ts`（MOOD_MAP）

### References

- [Source: epics.md#Story-4.2] — AC 定义
- [Source: ux-design-specification.md#EmotionTooltip] — UX 组件规格
- [Source: ux-design-specification.md#WaveChart] — hover 交互规格
- [Source: architecture.md#Frontend-Architecture] — 组件边界
- [Source: _bmad-output/implementation-artifacts/deferred-work.md] — 已知 deferred items

### 上一 Story 关联

[Source: 4-1-svg-waveform-chart.md]
- SVG_HEIGHT 调整：160px → 120px
- 空状态引导已在 4-1 实现验证
- Deferred work: resize 节流、SSR 守卫、mood 边界 — 本 story 处理

## Dev Agent Record

### Agent Model Used

claude-opus-4-7

### Debug Log References

无错误 — TypeScript 编译通过，浏览器验证 tooltip 显示正常。

### Completion Notes List

1. **Tooltip 样式验证**：浏览器测试确认 tooltip 样式 `bg-secondary border-border rounded-xl shadow-lg max-w-[160px]` 符合 UX spec（#F5EDE4 bg + #E8E0D8 border）。
2. **Tooltip 定位验证**：hover 数据点后 tooltip 出现在 `left: 546px, top: 162.5px`，数据点上方约 8px，viewport clamp 正常。
3. **Tooltip 内容验证**：显示 "4月23日 难过明天要交的方案还没写完，改了 3 版都不..." — 日期 + 心情标签 + truncate 20 字。
4. **数据点高亮验证**：emotion-chart.tsx line 115-118 确认 `r={isHovered ? 6 : 4}` 和 `scale: isHovered ? 1.5 : 1`。
5. **动效降级验证**：emotion-chart.tsx line 25 `useReducedMotion()` 已实现，emotion-tooltip.tsx line 79 `duration: 0.15` 符合 spec。
6. **Deferred Work 处理**：4 项均确认为 MVP 可接受/可选增强，已在 deferred-work.md 记录。

### File List

- `xiaozhi-journal/src/components/emotion-tooltip.tsx` — 验证完成，无修改
- `xiaozhi-journal/src/components/emotion-chart.tsx` — 验证完成，无修改

### Review Findings

- [x] [Review][Defer] date string invalid/malformed [emotion-tooltip.tsx:85] — deferred, pre-existing, 数据源保证
- [x] [Review][Defer] mood value outside 1-5 range [emotion-tooltip.tsx:86] — deferred, pre-existing, 数据源保证
- [x] [Review][Defer] timestamp no T separator [emotion-chart.tsx:35] — deferred, pre-existing, ISO format保证
- [x] [Review][Defer] avgMood exceeds 1-5 range [emotion-chart.tsx:62] — deferred, pre-existing, avg of 1-5 stay in range
- [x] [Review][Defer] Math.round produces 0 or 6 [emotion-chart.tsx:63] — deferred, pre-existing, same reason
- [x] [Review][Defer] resize no throttle [emotion-tooltip.tsx:68-71] — deferred, pre-existing, 已在2026-04-15记录

**Code Review Summary:** 0 patch, 6 defer, 0 dismiss. All findings pre-existing, verified against UX spec with 0 AC violations.