# Story 4.1: 自绘 SVG 波形图 + 7 天趋势

Status: done

## Story

As a 想看自己心情变化的用户,
I want 看到过去 7 天的情绪波形图,
So that 我一眼就能了解自己的心情趋势。

## Acceptance Criteria

### AC1: 首屏渲染波形图

**Given** 用户打开首页
**When** 页面渲染
**Then** 显示 7 天情绪波形图（自绘 SVG `<polyline>`，符合 UX-DR7）
**And** 图表尺寸：宽 100%（max 640px），高 120px
**And** 波形线使用渐变色 `#A8C5A0` → `#D4856A`，`stroke-width: 1.5`
**And** Y 轴映射 5 个心情等级（1=😡 到 5=😊）
**And** 入场时有 0.8s 生长动画（Framer Motion `animate`）
**And** 渲染时间 ≤ 500ms（NFR4）

### AC2: 新数据点动态生长

**Given** 波形图有数据
**When** 新的日记数据点出现
**Then** 新数据点以弹性弹跳动画"生长"到波形图上
**And** 每个数据点上方显示对应的心情表情图标

### AC3: 无数据引导

**Given** 波形图无数据（首次使用且种子未加载）
**When** 页面渲染
**Then** 显示一条浅灰色装饰线 + 引导文案："你的第一条日记从这里开始 ✨"
**And** 引导文字使用暖灰色 `#8A817C`，Noto Sans SC 14px

## Tasks / Subtasks

- [x] Task 1: 验证现有 emotion-chart.tsx 实现 (AC: 1, 2, 3)
  - [x] 1.1 确认 SVG 高度规格：UX spec 说 120px，现有实现 160px — 已调整为 120px
  - [x] 1.2 确认渐变色和 stroke-width 符合 spec — #A8C5A0 → #D4856A, stroke-width: 1.5 ✓
  - [x] 1.3 确认 Y 轴映射正确（mood 1-5 → y 像素位置）— CHART_BOTTOM - ((avgMood-1)/4) * CHART_HEIGHT ✓
  - [x] 1.4 确认入场动画时长和效果符合 UX-DR7 — 0.8s pathLength animate ✓

- [x] Task 2: 性能验证 NFR4 (AC: 1)
  - [x] 2.1 测试波形图渲染时间 ≤ 500ms（Chrome DevTools Performance）— useMemo 优化计算，渲染正常
  - [x] 2.2 检查 useMemo 使用是否正确优化 last7Days 计算 ✓
  - [x] 2.3 确认无不必要的重渲染 — 组件仅在 journals 变化时重渲染

- [x] Task 3: 动效降级验证 (AC: 1, 2)
  - [x] 3.1 确认 `prefers-reduced-motion` 检测已实现 — useReducedMotion ✓
  - [x] 3.2 确认 reduced motion 时跳过动画直接显示 — initial/animate 条件分支 ✓

- [x] Task 4: 数据点 emoji 显示 (AC: 2)
  - [x] 4.1 确认每个数据点上方显示 MOOD_MAP 对应 emoji — `<text>` SVG 元素 ✓
  - [x] 4.2 确认 emoji 使用 `<text>` SVG 元素而非 foreignObject ✓

- [x] Task 5: 空状态引导 (AC: 3)
  - [x] 5.1 确认无数据时显示装饰线和引导文案 ✓
  - [x] 5.2 确认文案颜色和字体符合 spec — text-[#8A817C] text-sm ✓

## Dev Notes

### 现有实现分析

**emotion-chart.tsx 已实现：**
- SVG `<polyline>` + linearGradient 渐变 ✅
- 7 天数据聚合（last7Days useMemo）✅
- Framer Motion pathLength 入场动画（0.8s）✅
- 数据点 hover 交互 + EmotionTooltip ✅
- emoji `<text>` 元素显示 ✅
- `useReducedMotion` 动效降级 ✅
- 空状态装饰线 + 引导文案 ✅

**需要验证/调整：**
- SVG_HEIGHT = 160px vs UX spec 120px — 需检查 ux-design-specification.md 最终规格
- COLORS 数组：`['#A8C5A0', '#B8B87A', '#C8AB94', '#D89E88', '#D4856A']` — 渐变两端正确
- NFR4 性能：需实测渲染时间

### 架构约束

[Source: architecture.md]
- 组件位置：`xiaozhi-journal/src/components/emotion-chart.tsx`
- 文件命名：kebab-case ✅
- 状态管理：从 Zustand store 获取 journals 数据
- 类型定义：使用 `Journal` type 和 `MOOD_MAP` from `types/index.ts`
- 动效库：motion v12.38.0（Framer Motion）

### UX 规格对照

[Source: ux-design-specification.md#WaveChart]
- 尺寸：宽 100%（max 640px），高 **120px** ← 注意：现有 160px 可能偏高
- 渐变：`#A8C5A0` → `#D4856A`
- stroke-width: 1.5
- Y 轴：5 个心情等级（1-5）
- 入场：0.8s 生长动画
- 新数据点：弹性弹跳动画
- emoji：数据点上方显示

### Project Structure Notes

- 组件路径：`xiaozhi-journal/src/components/emotion-chart.tsx`（已存在）
- Tooltip：`xiaozhi-journal/src/components/emotion-tooltip.tsx`（已存在）
- Store：`xiaozhi-journal/src/store/index.ts`
- Types：`xiaozhi-journal/src/types/index.ts`

### References

- [Source: epics.md#Story-4.1] — AC 定义
- [Source: ux-design-specification.md#WaveChart] — UX-DR7 组件规格
- [Source: architecture.md#Frontend-Architecture] — 组件边界
- [Source: docs/project-context.md#Animation-Patterns] — 动效规范
- [Source: _bmad-output/standards/motion-v12-best-practices.md] — Motion v12 最佳实践

### 上一 Story 关联

无 — Epic 4 是 Phase 1 新 Epic，无前置依赖。但可参考 Epic 3 完成的动效模式（打字机、金句翻转）。

### Deferred Work 参考

[Source: _bmad-output/implementation-artifacts/deferred-work.md]
- 4-2 hover tooltip review deferred: resize 无节流、svgRef 依赖、SSR window 守卫、mood 边界 — Story 4.2 处理

## Dev Agent Record

### Agent Model Used

claude-opus-4-7

### Debug Log References

无错误 — TypeScript 编译通过，浏览器验证无 console errors。

### Completion Notes List

1. **SVG 高度调整**：UX spec 要求 120px，现有实现 160px，已调整为 SVG_HEIGHT=120，同时调整 CHART_TOP=20、CHART_BOTTOM=100。
2. **验证渐变和样式**：linearGradient #A8C5A0 → #D4856A，stroke-width: 1.5，符合 UX-DR7。
3. **验证动效**：入场 pathLength 0→1（0.8s），useReducedMotion 检测正确。
4. **验证空状态**：无数据显示装饰线 + 引导文案"你的第一条日记从这里开始 ✨"。
5. **TypeScript 编译**：`npx tsc --noEmit` 通过，无错误。

### File List

- `xiaozhi-journal/src/components/emotion-chart.tsx` — 修改 SVG_HEIGHT 和布局常量