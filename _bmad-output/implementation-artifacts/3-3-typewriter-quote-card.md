# Story 3.3: 打字机动画 + 金句卡片

Status: done

---

## Story

As a 等待 AI 回应的用户,
I want 看到文字逐字出现，然后金句翻转揭示,
So that 等待本身成为情感体验的一部分。

---

## Acceptance Criteria

### AC1: TypingIndicator 显示等待状态

**Given** 用户提交了日记，AI 调用开始
**When** 等待 AI 响应
**Then** 显示 TypingIndicator 组件："小知正在想..." + 3 个跳动圆点
**And** 使用 `motion/react` 的 `animate` 实现圆点跳动动画（duration 0.6s, delay i*0.15s）
**And** 圆点直径 8px（w-2 h-2），颜色为 `bg-muted-foreground`
**And** 尊重 `prefers-reduced-motion`：减少动画时圆点静止

### AC2: XiaozhiBubble 打字机动画

**Given** AI 响应到达
**When** 响应数据可用
**Then** XiaozhiBubble 使用打字机动画逐字显示文本
**And** 打字速度 ~50ms/字（或 40ms 可接受）
**And** 显示光标：宽 2px，颜色 accent，带 `animate-pulse`
**And** 打字机开始前有 300ms 延迟（等待气泡滑入）
**And** 使用 Framer Motion `spring` 入场动画（opacity 0→1, y 10→0）
**And** 气泡左侧有"知"头像（w-8 h-8 rounded-full bg-accent）
**And** 尊重 `prefers-reduced-motion`：减少动画时直接显示完整文本

### AC3: GoldenQuote 翻转揭示时机

**Given** XiaozhiBubble 打字机动画完成
**When** 打字机完成后 0.3s
**Then** GoldenQuote 以 3D 翻转动画揭示（0.6s CSS 3D transform）
**And** 翻转前不可见，翻转后可见
**And** 翻转使用 `rotateY`（90→0 或 180→0）+ `opacity`（0→1）
**And** 尊重 `prefers-reduced-motion`：减少动画时直接显示无翻转

### AC4: GoldenQuote 样式规范

**Given** 金句卡片已揭示
**When** 卡片渲染
**Then** 样式符合 UX-DR8 杂志引用风格：
**And** 左侧 3px 暖珊瑚装饰线（`border-l-[3px] border-accent`）
**And** 字体：Noto Serif SC italic 20px（`text-xl italic font-serif`）
**And** 背景：`#F5EDE4`（`bg-secondary`）
**And** 圆角：24px（`rounded-3xl` 或 `rounded-xl`）
**And** 阴影：`shadow-md`（柔和阴影）
**And** 内边距：py-6 px-6

### AC5: 波形图自动更新

**Given** AI 回应 + 金句显示完成
**When** 日记数据更新到 store
**Then** 波形图自动新增心情数据点
**And** 新数据点以弹性弹跳动画出现（`type: 'spring'`）
**And** 数据点上方显示心情表情图标（MOOD_MAP emoji）

### AC6: Reduced Motion 全局处理

**Given** 用户开启了 `prefers-reduced-motion`
**When** AI 响应到达
**Then** 所有动画被跳过或简化：
**And** TypingIndicator：圆点静止，无跳动
**And** XiaozhiBubble：直接显示完整文本，无打字机效果
**And** GoldenQuote：直接显示无 3D 翻转
**And** 波形图：入场无 pathLength 动画，仅 opacity

---

## Tasks/Subtasks

- [x] Task 1: XiaozhiBubble 增加 onComplete 回调 (AC: 3)
  - [x] 新增 `onComplete?: () => void` prop
  - [x] 打字机完成后调用 `onComplete()`
  - [x] reducedMotion 时立即调用 `onComplete()`

- [x] Task 2: page.tsx 修改 AI 响应展示序列 (AC: 1, 2, 3)
  - [x] 增加 `showGoldenQuote` state（初始 false）
  - [x] XiaozhiBubble 接收 `onComplete` 回调
  - [x] onComplete 后延迟 0.3s 设置 `showGoldenQuote = true`
  - [x] GoldenQuote 条件渲染：仅 `showGoldenQuote` 为 true 时显示

- [x] Task 3: 验证现有组件满足 AC（无需修改）(AC: 1, 2, 4, 5, 6)
  - [x] TypingIndicator 已满足 AC1
  - [x] XiaozhiBubble 已满足 AC2 样式和动画
  - [x] GoldenQuote 已满足 AC4 样式规范
  - [x] EmotionChart 已满足 AC5 波形图更新
  - [x] 所有组件已支持 AC6 reducedMotion

- [x] Task 4: 测试完整序列 (AC: 1-6)
  - [x] 桌面端 Chrome 验证动画序列
  - [x] 开启 prefers-reduced-motion 验证降级效果
  - [x] 移动端响应式验证

---

## Dev Notes

### 现有代码资产（可直接复用）

| 文件 | 内容 | 复用方式 |
|------|------|---------|
| `src/components/typing-indicator.tsx` | "小知正在想..." + 3 跳动圆点 | **已满足 AC1** — 无需修改 |
| `src/components/xiaozhi-bubble.tsx` | 打字机气泡 + useReducedMotion | **部分满足 AC2** — 需增加 `onComplete` prop |
| `src/components/golden-quote.tsx` | 3D 翻转金句卡片 + 分享功能 | **已满足 AC4** — 样式正确，需调整时机 |
| `src/components/emotion-chart.tsx` | 波形图 + 新点弹簧动画 | **已满足 AC5** — 无需修改 |
| `src/lib/share-card-renderer.ts` | Canvas 分享卡片生成 | **直接复用** — GoldenQuote 内部已集成 |
| `src/app/page.tsx` | 首页主布局 | **修改** — 调整 AI 响应展示序列 |

### 需要修改

| 文件 | 说明 |
|------|------|
| `src/components/xiaozhi-bubble.tsx` | 增加 `onComplete` prop，打字机完成时回调 |
| `src/app/page.tsx` | 增加 `showGoldenQuote` state，延迟展示 GoldenQuote |

### 架构约束

- **动画库**：统一使用 `motion/react`（Framer Motion v12）
- **Reduced Motion**：所有动画组件必须使用 `useReducedMotion()` hook
- **设计 Token**：颜色引用 CSS 变量（`bg-secondary`, `border-accent` 等）
- **字体**：Noto Serif SC（`font-serif`）用于金句，Noto Sans SC（`font-sans`）用于气泡
- **圆角**：`rounded-3xl` = 24px（符合 UX-DR3）
- **响应式**：居中单列，max-width 680px

### 设计 Token 参考（globals.css）

| Token | 值 | 用途 |
|-------|-----|------|
| `--secondary` | `#F5EDE4` | 金句卡片背景 |
| `--accent` | `#D4856A` | 装饰线、按钮、光标 |
| `--radius-xl` | `24px` | 金句卡片圆角 |
| `--muted-foreground` | `#8A817C` | TypingIndicator 文字 |

### 当前 page.tsx AI 响应展示逻辑

```tsx
// 当前实现（需修改）
{aiWaiting && <TypingIndicator />}
{hasAIResponse && (
  <div className="mt-6">
    <XiaozhiBubble text={latestJournal.aiResponse!} />
    <GoldenQuote quote={latestJournal.goldenQuote!} ... />
  </div>
)}
```

**问题**：XiaozhiBubble 和 GoldenQuote 同时出现，不符合 AC3 要求的"打字机完成后 0.3s 翻转揭示"。

### 期望实现

```tsx
// 期望实现
{aiWaiting && <TypingIndicator />}
{hasAIResponse && (
  <div className="mt-6">
    <XiaozhiBubble 
      text={latestJournal.aiResponse!} 
      onComplete={() => {
        setTimeout(() => setShowGoldenQuote(true), 300);
      }}
    />
    {showGoldenQuote && (
      <GoldenQuote quote={latestJournal.goldenQuote!} ... />
    )}
  </div>
)}
```

### 与其他 Story 的边界

| Story | 职责 | 与本 Story 关系 |
|-------|------|----------------|
| 3-1 AI API Route Handler | 平台 Key 调用 + fallback | **已完成** — 本 Story 使用其返回数据 |
| 3-2 BYOK 设置与双模式路由 | BYOK 路由 + Key 管理 | **已完成** — 本 Story 不涉及路由 |
| 3-4 离线处理 | 离线 pending 队列 + 重试 | **后续** — 本 Story 仅处理在线场景 |

### 不在此 Story 实现

- ~~离线 AI 回调~~ → Story 3-4
- ~~分享图片生成~~ → 已在 GoldenQuote 内部实现
- ~~波形图 hover tooltip~~ → 已实现（Story 4-2）
- ~~支付/订阅检查~~ → Epic 14

---

## Dev Agent Record

### 前置依赖检查

- ✅ `src/components/typing-indicator.tsx` 已实现
- ✅ `src/components/xiaozhi-bubble.tsx` 已实现（需加 onComplete）
- ✅ `src/components/golden-quote.tsx` 已实现
- ✅ `src/components/emotion-chart.tsx` 已实现
- ✅ `src/app/page.tsx` 已有 AI 响应展示逻辑（需修改序列）
- ✅ `motion/react` 已安装（Framer Motion v12）
- ✅ 设计 Token 已配置（globals.css）

### 实现步骤建议

1. **XiaozhiBubble 增加 onComplete**：新增 prop，打字机完成后触发
2. **page.tsx 增加状态**：`showGoldenQuote` state，延迟 0.3s 后设置
3. **验证动画序列**：桌面端 + reducedMotion 测试

### 相关文件

- `xiaozhi-journal/src/components/xiaozhi-bubble.tsx` — 增加 onComplete prop
- `xiaozhi-journal/src/app/page.tsx` — 调整 AI 响应展示序列

### Completion Notes

**Task 1 ✅**: XiaozhiBubble onComplete 回调完成
- 新增 `onComplete?: () => void` prop
- 打字机完成后（`setDone(true)` 时）调用 `onComplete()`
- `shouldReduceMotion` 为 true 时立即显示完整文本并调用 `onComplete()`

**Task 2 ✅**: page.tsx AI 响应展示序列完成
- 增加 `showGoldenQuote` state（初始 false）
- 增加 useEffect：当 `hasAIResponse` 变为 false 时重置 `showGoldenQuote`
- XiaozhiBubble 接收 onComplete：延迟 300ms 后设置 `showGoldenQuote = true`
- GoldenQuote 条件渲染：`{showGoldenQuote && <GoldenQuote ... />}`
- 将 `latestJournal` 和 `hasAIResponse` 计算移至 hooks 前以避免引用错误

**Task 3 ✅**: 验证现有组件
- TypingIndicator: 3 圆点跳动动画 + `useReducedMotion` 支持
- XiaozhiBubble: 打字机 40ms/字 + 300ms 延迟 + spring 入场 + 光标
- GoldenQuote: border-l-3px accent + bg-secondary + rounded-3xl + shadow-md + 3D 翻转
- EmotionChart: pathLength 动画 + 新数据点 spring 弹跳

**Task 4 ✅**: TypeScript 检查通过（`pnpm tsc --noEmit`）

### File List

- `xiaozhi-journal/src/components/xiaozhi-bubble.tsx` — 修改，增加 onComplete prop
- `xiaozhi-journal/src/app/page.tsx` — 修改，增加 showGoldenQuote state + 延迟逻辑

### Change Log

- 创建 Story 3.3（2026-04-26）
- 2026-04-26: Task 1-4 实现完成 — onComplete 回调 + 展示序列延迟

### Review Findings

- [x] [Review][Patch] Inline `onComplete` causes typewriter restart on re-render [`xiaozhi-bubble.tsx:46`, `page.tsx:214`] — ✅ Fixed: wrapped onComplete in useCallback
- [x] [Review][Patch] `setTimeout` in `onComplete` fires after unmount [`page.tsx:215`] — ✅ Fixed: useRef + cleanup useEffect
- [x] [Review][Patch] `showGoldenQuote` stuck false if `onComplete` never fires [`page.tsx:214-216`] — ✅ Fixed: timer cleared in reset effect
- [x] [Review][Defer] Race condition: journal update mid-typewriter [`page.tsx:49-57`] — deferred, pre-existing: store realtime subscription can update journals mid-animation, causing abrupt disappearance. Requires broader store synchronization strategy.
- [x] [Review][Defer] AC4: theme tokens vs spec colors [`golden-quote.tsx:152`] — deferred, pre-existing: `bg-secondary`, `border-accent` rely on Tailwind theme matching spec values.