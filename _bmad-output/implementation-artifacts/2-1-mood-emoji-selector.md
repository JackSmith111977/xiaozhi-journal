# Story 2.1: 心情表情选择器

Status: done

Epic: 2 — 3 秒心情打卡
Story ID: 2.1
Created: 2026-04-21

---

## Story

As a 想要快速记录心情的用户,
I want 看到 5 个清晰的表情按钮,
So that 我可以在 3 秒内选择当天的心情。

## Acceptance Criteria

**Given** 用户打开首页
**When** 页面渲染
**Then** 显示 "今天心情怎么样？" 标题（Noto Serif SC, 26px+）
**And** 水平排列 5 个表情按钮：😡 😔 😐 😊 😴
**And** 每个按钮为 56x56px 圆角方形（rounded-full），间距 16px
**And** 按钮使用定制 SVG 图标（非标准 emoji，符合 UX-DR6）
**And** hover 时按钮 scale(1.15) 并上浮 2px（Framer Motion spring）

**Given** 用户点击一个表情
**When** 点击事件触发
**Then** 被点击的表情放大至 scale(1.3) 后回弹，背景变为暖珊瑚色
**And** 未选中的表情透明度降至 50%
**And** 日记输入框从下方弹性滑入（Framer Motion spring 动画）

**Given** 用户使用键盘导航
**When** 按 Tab 键聚焦到表情按钮
**Then** 焦点指示器为暖珊瑚色 `outline: 2px solid #D4856A`
**And** 每个表情按钮有 `aria-label`（如"烦躁"、"难过"、"平静"、"开心"、"疲惫"）
**And** 容器使用 `role="radiogroup"`，按钮使用 `role="radio"`

## Tasks / Subtasks

- [x] Task 1: 创建 `mood-selector.tsx` 组件 (AC: 全部)
  - [x] 定义 `MoodSelectorProps` 接口，包含 `onSelect: (mood: MoodLevel) => void` 和 `selectedMood?: MoodLevel`
  - [x] 使用 `MOOD_MAP` 作为数据源遍历 5 个表情
  - [x] 实现 SVG 表情图标（非 emoji 字符）
  - [x] 实现 Framer Motion 弹簧动画（hover scale 1.15，点击 scale 1.3 回弹）
  - [x] 实现未选中状态透明度 50%
  - [x] 实现键盘导航无障碍（radiogroup/role, aria-label, focus outline）
  - [x] 添加 `prefers-reduced-motion` 支持

- [x] Task 2: 集成到首页 `page.tsx` (AC: 标题 + 输入框滑入)
  - [x] 在首页添加 "今天心情怎么样？" 标题
  - [x] 引入 `MoodSelector` 组件
  - [x] 选择表情后触发日记输入框滑入动画（AnimatePresence）
  - [x] 连接 Zustand store 记录选中心情

- [x] Review Follow-ups (AI)
  - [x] [AI-Review] [H1] 清除 `page.tsx` 中 17 条 `console.log` 调试语句
  - [x] [AI-Review] [M1] `JournalInput` 添加 `key={selectedMood}` + `mode="wait"` 修复 AnimatePresence exit 动画
  - [x] [AI-Review] [M2] 移除 `handleSave` 中冗余 `setSelectedMood(null)`（store `addJournal` 已清理）
  - [x] [AI-Review] [M3] `animate` prop 添加 `useReducedMotion` 条件控制
  - [x] [AI-Review] [M4] `journal-input.tsx` 使用 `MOOD_MAP` 替代硬编码 emoji 数组
  - [x] [AI-Review] [L1] Mood 2 泪滴颜色跟随选中态
  - [x] [AI-Review] [L2] `MoodSvg` switch 添加 `default: return null` 穷尽保护

## Dev Notes

### 技术约束

- **项目**: Xiaozhi Journal — `xiaozhi-journal/` 目录
- **框架**: Next.js 16.2.3 App Router（非传统 Next.js，Server Components 默认）
- **此组件需要 `"use client"`** — 有交互状态和事件处理
- **React 19.2.4** — 使用 `useState` 管理选中状态

### 样式约束

- **TailwindCSS v4** — 使用 `@theme` 指令，非 v3 `theme()` 配置
- **「暖日」色板**:
  - `bg-background` / `#FDF8F5` — 页面背景
  - `--accent` / `#D4856A` — 选中态暖珊瑚色
  - `--text-secondary` / `#8A817C` — 次要文字
- **圆角**: `rounded-full`（表情按钮为 56x56 圆形）
- **字体**: Noto Serif SC（标题）, Noto Sans SC（正文）
- **间距**: 表情按钮间距 16px (`gap-4`)

### 动画约束

- **Framer Motion 12.38.0** — 唯一动画库
- hover: `whileHover={{ scale: 1.15, y: -2 }}`
- click: `whileTap={{ scale: 1.3 }}` + spring 回弹
- 未选中: `opacity: 0.5`
- 尊重 `prefers-reduced-motion`：直接显示，跳过动画

### 类型约束

- 使用 `MoodLevel = 1 | 2 | 3 | 4 | 5`（`types/index.ts` 中已定义）
- 使用 `MOOD_MAP`（`types/index.ts` 中已定义）作为表情 → emoji/label 映射源
- Mood 值映射: 1=😡(烦躁), 2=😔(难过), 3=😐(平静), 4=😊(开心), 5=😴(疲惫)

### 无障碍约束

- 容器: `role="radiogroup"` + `aria-label="心情选择"`
- 按钮: `role="radio"` + `aria-checked` + `aria-label`（中文标签）
- 焦点: `outline: 2px solid #D4856A`（暖珊瑚色焦点环）
- 键盘: Tab 导航 + Enter/Space 选择

### 状态管理

- 组件内部使用 `useState<MoodLevel | undefined>` 管理选中状态
- 选中后调用 `onSelect(mood)` 回调通知父组件
- 父组件负责：触发输入框显示、更新 Zustand store

### 组件职责边界

- `mood-selector.tsx` 只做一件事：展示 5 个表情按钮并处理选中交互
- 不管理日记保存、不触发动画以外的页面变化
- 通过 props 通信，不直接操作 Zustand store

### Architecture Compliance

- **Source**: [architecture.md](file:///D:/WorkPlace/VibeCoding/Xiaozhi%20Journal/_bmad-output/planning-artifacts/architecture.md) — 组件使用 `"use client"` 指令（交互组件）
- **Source**: [epics.md](file:///D:/WorkPlace/VibeCoding/Xiaozhi%20Journal/_bmad-output/planning-artifacts/epics.md) — Epic 2 Story 2.1 完整 AC
- **Source**: [project-context.md](file:///D:/WorkPlace/VibeCoding/Xiaozhi%20Journal/docs/project-context.md) — AI Agent 规则 #6 (文件命名), #7 (色板)

### Testing Standards

- 本项目不写单元测试，手动验证
- 验证要点：
  1. 5 个表情正确显示
  2. hover/click 动画流畅
  3. 键盘 Tab 导航正常
  4. 选中后回调触发正确 mood 值
  5. `prefers-reduced-motion` 下无动画

### File Structure Requirements

- **新建**: `src/components/mood-selector.tsx`
- **修改**: `src/app/page.tsx`（集成心情选择器）
- **不修改**: `src/types/index.ts`（复用已有 `MoodLevel` 和 `MOOD_MAP`）

## Dev Agent Record

### Agent Model Used

qwen3.6-plus

### Debug Log References



### Completion Notes List

1. **SVG 表情图标** — 创建 5 个定制 SVG 图标（MoodSvg 组件），替代 emoji 字符。每个图标包含独特的面部表情：烦躁（皱眉）、难过（下垂嘴+泪滴）、平静（平直嘴）、开心（微笑弧线）、疲惫（半闭眼+Zzz）。背景色随 mood 不同（暖珊瑚/蓝粉/灰粉/黄粉/紫粉）。
2. **`prefers-reduced-motion` 支持** — 使用 Framer Motion `useReducedMotion()` hook，减少运动模式下禁用 hover/tap 动画。
3. **AnimatePresence 滑入动画** — `page.tsx` 用 `AnimatePresence` 包裹 `JournalInput`，组件自带 `initial={{ opacity: 0, y: 20 }}` / `animate={{ opacity: 1, y: 0 }}` spring 动画。
4. **浏览器验证** — Playwright 验证：5 按钮渲染 ✓、点击选中 ✓、未选中 opacity 0.5 ✓、textarea 出现 ✓、placeholder 正确 ✓。
5. **第一轮 Review 修复（H1-H3, M1-M3）**：
   - **H1** `damping: 0` → 改用 `undefined` 禁用 gesture props
   - **H2** `JournalInput` 缺少 exit 动画 → 添加 `exit={{ opacity: 0, y: 20 }}`
   - **H3** 疲惫 `<text>` Zzz → `<circle>` 气泡元素
   - **M1** SVG 缺少 `aria-hidden` → 全部添加
   - **M2** 删除未使用的 `MOOD_ICONS`
   - **M3** TypeScript `false` → `undefined`；`gestures` → `hoverAnim`/`tapAnim`
6. **第二轮 Review 修复（H1, M1-M4, L1-L2）**：
   - **H1** 清除 `page.tsx` 中 17 条 `console.log` 调试语句
   - **M1** `JournalInput` 添加 `key={selectedMood}` + `mode="wait"` 修复切换心情时 exit 动画
   - **M2** 移除 `handleSave` 中冗余 `setSelectedMood(null)`，store `addJournal` 已清理
   - **M3** `animate` prop 添加 `useReducedMotion` 条件，选中态弹簧动画不再强制播放
   - **M4** `journal-input.tsx` 使用 `MOOD_MAP[selectedMood].emoji` 替代硬编码 emoji 数组
   - **L1** Mood 2 泪滴 `fill={fill}` 跟随选中态
   - **L2** `MoodSvg` switch 添加 `default: return null` 穷尽保护
   - TypeScript 零错误，build SUCCESS

### File List

- `src/components/mood-selector.tsx` — SVG 图标 + prefers-reduced-motion + animate 条件控制 + default 穷尽保护
- `src/components/journal-input.tsx` — exit 动画 + MOOD_MAP 替代硬编码 + 移除冗余 setSelectedMood
- `src/app/page.tsx` — AnimatePresence + mode="wait" + key + 清除 console.log

## Senior Developer Review (AI)

### Review 1 — 2026-04-22 (第二轮)

**Outcome:** Changes Requested → Resolved
**Reviewer:** Blind Hunter + Edge Case Hunter + Acceptance Auditor

#### Action Items

- [x] **[H1]** 清除 `page.tsx` 中 17 条 `console.log` 调试语句（污染生产日志/SSR 输出）
- [x] **[M1]** `JournalInput` 添加 `key={selectedMood}` + `mode="wait"`（修复切换心情时 exit 动画不触发）
- [x] **[M2]** 移除 `handleSave` 中冗余 `setSelectedMood(null)`（store `addJournal` 已清理，避免竞态）
- [x] **[M3]** `animate` prop 添加 `useReducedMotion` 条件（选中态弹簧动画尊重无障碍偏好）
- [x] **[M4]** `journal-input.tsx` 使用 `MOOD_MAP` 替代硬编码 emoji 数组（避免维护 divergence）
- [x] **[L1]** Mood 2 泪滴颜色使用 `fill={fill}` 跟随选中态
- [x] **[L2]** `MoodSvg` switch 添加 `default: return null` 穷尽保护

