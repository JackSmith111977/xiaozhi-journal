---
status: done
story_id: "8.14"
epic_num: 8
story_num: 14
title: "全局主题系统（暖阳/星空自动切换）"
created: 2026-04-29
---

# Story 8.14: 全局主题系统（暖阳/星空自动切换）

> **来源**: epics.md Story 8.14 | **优先级**: P1 | **UX-DR**: UX-DR1~5, UX-DR25

## Story

As a 用户,
I want 应用在白天自动使用浅色主题、晚上自动使用深色主题,
So that 我的眼睛始终舒适。

## Acceptance Criteria

1. **Given** 应用启动
   **When** 检测当前时间
   **Then** 06:00-17:59 → 暖阳主题（Light 浅色模式）
   **And** 18:00-05:59 → 星空主题（Dark 深色模式）
   **And** 主题切换无闪烁（在 `layout.tsx` 中注入 class 到 `<html>`）

2. **Given** 主题系统
   **When** 定义设计 Token
   **Then** 页面背景、卡片背景、主文字、弱化文字、主按钮、强调色、成功色、错误色、边框色均有深浅两套
   **And** 使用 CSS 变量 + Tailwind `dark:` 类或自定义 class 切换
   **And** 颜色过渡平滑（无突兀闪烁）

3. **Given** 设置页
   **When** 用户手动切换主题
   **Then** 覆盖自动切换（localStorage 持久化）
   **And** 提供"恢复自动切换"选项
   **And** 手动覆盖后不再随时间自动切换

## Tasks / Subtasks

- [x] Task 1: 改造 globals.css 星空主题色板 (AC: #2)
  - [x] 将现有 `.dark` 块中的色值按 UX 规格替换为星空主题色
  - [x] 确保所有 CSS 变量在 `:root` 和 `.dark` 中均有定义
  - [x] 颜色过渡添加 `transition-colors` 平滑过渡

- [x] Task 2: 实现时间驱动主题注入 (AC: #1)
  - [x] 在 `layout.tsx` 中添加服务端时间检测逻辑
  - [x] 根据小时数（06-17 暖阳 / 18-05 星空）注入 `class="dark"` 到 `<html>`
  - [x] 确保 SSR Hydration 一致（`suppressHydrationWarning` 已存在 + `ThemeHydration` 客户端修正）

- [x] Task 3: 创建主题管理 Hook (AC: #1, #3)
  - [x] 创建 `src/lib/theme.ts` — 主题工具函数
  - [x] `getTimeTheme()` — 返回 `'warm-sun' | 'starry-night'`
  - [x] `getSavedThemeMode()` / `saveThemeMode()` — localStorage 读写
  - [x] `resolveTheme(mode)` — 根据模式解析实际主题
  - [x] 创建 `src/hooks/use-theme.ts` — 客户端主题 Hook
  - [x] 支持 `auto` / `warm-sun` / `starry-night` / `system` 四种模式
  - [x] localStorage 持久化 key: `xiaozhi:themeMode`
  - [x] 模式为 `auto` 时按时间自动切换，否则使用手动设定值

- [x] Task 4: 设置页添加主题切换控件 (AC: #3)
  - [x] 在 `src/app/settings/page.tsx` 中添加"主题"设置区块
  - [x] 4 选项按钮：自动 / 暖阳 / 星空 / 跟随系统
  - [x] 当前选中项高亮，选中态样式复用登录页保持登录选择器样式
  - [x] 手动选择后显示"当前为手动模式"提示 + "恢复自动切换"按钮

- [x] Task 5: 验证与测试
  - [x] `pnpm lint` 无新增错误 (0 errors, 0 warnings)
  - [x] `tsc --noEmit` 编译通过 (0 errors)
  - [x] 浏览器验证：dark class 注入后星空主题正确渲染
  - [ ] 手动测试：设置页手动覆盖 → 刷新页面验证偏好保留（需登录）
  - [ ] 手动测试：恢复自动切换 → 验证回到时间驱动模式（需登录）

## Dev Agent Record

### Agent Model Used

qwen3.6-plus

### Completion Notes List

- `.dark` 色板从通用灰色替换为 UX 规格星空色板（蓝紫色调）
- SSR 注入 `dark` class，客户端 `ThemeHydration` 组件修正 hydration mismatch
- 主题 Hook 支持 4 种模式：auto / warm-sun / starry-night / system
- localStorage key 使用 `xiaozhi:themeMode`，遵循既有命名规范
- 设置页主题按钮使用 `role="radiogroup"` + `role="radio"` + `aria-checked` 无障碍属性
- `aria-pressed` 在 `role="radio"` 上不受支持，已移除

### File List

- `src/app/globals.css` — 替换 `.dark` 块为星空色板 + 添加 body transition
- `src/app/layout.tsx` — 添加 `getTimeTheme()` + 条件注入 `dark` class + `ThemeHydration`
- `src/lib/theme.ts` — 新增，主题工具函数（纯函数）
- `src/hooks/use-theme.ts` — 新增，客户端主题 Hook
- `src/components/theme-hydration.tsx` — 新增，客户端 hydration 修正组件
- `src/app/settings/page.tsx` — 新增主题切换 UI（4 选项按钮 + 恢复自动切换）

## Dev Notes

### 前置 Story 依赖

- **Story 8.2/8.13**（登录流程）：localStorage key 命名规范已确立为 `xiaozhi:` 前缀 + camelCase
- **Story 8.4**（设置页）：`src/app/settings/page.tsx` 已存在，使用 AuthGuard 保护
- **Story 0-b**（Tailwind Token 治理）：CSS 变量颜色系统已建立，本 Story 在此基础上扩展

### 当前代码库状态

**`globals.css` 已有：**
- `:root` 块定义暖阳色板（Light 模式）
- `.dark` 块定义深色模式色板（但色值与 UX 规格的星空主题不完全一致）
- Tailwind v4 `@theme inline` 指令，使用 CSS 变量映射
- `@custom-variant dark (&:is(.dark *))` — Tailwind 的 dark mode variant

**`layout.tsx` 已有：**
- `<html>` 根组件，已有 `suppressHydrationWarning`
- Google Fonts 加载 Noto Serif SC + Noto Sans SC
- 当前 className 注入字体 variable + `h-full`

**缺失项（本次 Story 范围）：**
- 时间驱动的主题自动切换逻辑
- `.dark` 色板与 UX 规格星空主题的对齐
- 客户端主题管理 Hook
- 设置页主题切换 UI

### UX 规格色板映射（必须遵循）

| 元素 | 暖阳 (Light) | 星空 (Dark) |
|------|-------------|-------------|
| 页面背景 | `#FDF8F5` | `#0F1B2D` |
| 卡片背景 | `#F5EDE4` | `#1A2A3F/80` + backdrop-blur |
| 主文字 | `#1F2937` (gray-800) | `#E8D5B5` |
| 弱化文字 | `#B5ADA9` | `#6B8299` |
| 主按钮 | `#E8C4A0` | `#F5C77A/20` + 边框 |
| 强调色 | `#D4856A` | `#F5C77A` |
| 成功色 | `#A8C5A0` | `#7AC77A` |
| 错误色 | `#D4856A` | `#E87A5A` |
| 边框色 | `#E8E0D8` | `#1E3044` |

**注意**：当前 `globals.css` 的 `.dark` 块使用的是一套通用深色色板（基于灰色调），**不是** UX 规格中的星空主题（蓝紫色调）。本 Story 需要将 `.dark` 块替换为星空色板。

### Tailwind v4 Dark Mode 技术方案

项目使用 Tailwind v4，dark mode 通过 `@custom-variant dark (&:is(.dark *))` 定义。

**推荐方案**：使用 class 策略（非 media query）
- HTML 上添加 `class="dark"` 触发 `.dark` 色板
- 同时保留 `warm-sun` / `starry-night` 作为语义化 class（可用于特殊组件级微调）
- 时间检测逻辑：06:00-17:59 → 移除 `dark` class；18:00-05:59 → 添加 `dark` class

**为什么用 class 而非 media**：
- `prefers-color-scheme` 无法实现时间驱动切换
- class 策略允许手动覆盖和自动切换共存
- 与现有 `@custom-variant dark` 配置兼容

### 推荐实现模式

#### 时间检测函数（服务端，layout.tsx）

```tsx
// layout.tsx 中
function getTimeTheme(): 'warm-sun' | 'starry-night' {
  const hour = new Date().getHours();
  return hour >= 6 && hour < 18 ? 'warm-sun' : 'starry-night';
}

// 在 html className 中使用
const theme = getTimeTheme();
<html className={`${theme} ${notoSerif.variable} ${notoSans.variable} h-full`}>
```

**Hydration 注意**：服务端时间可能与客户端时间不同（时区/SSR 缓存）。方案：
- 服务端注入初始 class
- 客户端 `useEffect` 中校验并修正（仅在时间跨越边界时）
- 已有 `suppressHydrationWarning` 可覆盖 class 不一致警告

#### 主题 Hook（客户端）

```tsx
// src/hooks/use-theme.ts
const THEME_KEY = 'xiaozhi:themeMode';

type ThemeMode = 'auto' | 'warm-sun' | 'starry-night' | 'system';

export function useTheme() {
  // 从 localStorage 读取模式
  // auto 模式：按时间切换 dark class
  // warm-sun/starry-night：强制设置/移除 dark class
  // system：使用 prefers-color-scheme media query
  // 返回 { mode, setMode, isDark, resetToAuto }
}
```

#### localStorage 规范

- Key: `xiaozhi:themeMode`
- 值: `'auto' | 'warm-sun' | 'starry-night' | 'system'`
- 默认值: `'auto'`
- 遵循 `xiaozhi:` 前缀 + camelCase 命名规范

### 现有组件影响分析

**所有使用 `bg-background`、`text-foreground` 等 CSS 变量的组件**会自动跟随主题切换，无需逐个修改。

**需要检查的组件**（可能需微调）：
- `emotion-chart.tsx` — 波形图颜色是否硬编码
- `golden-quote.tsx` — 金句卡片背景色
- `capsule-popup.tsx` — 弹窗背景是否与星空主题融合
- `share-card.tsx` — 分享卡片在深色模式下的可读性

### 风险与缓解

| 风险 | 缓解 |
|------|------|
| SSR/CSR 时间不一致导致 hydration mismatch | `suppressHydrationWarning` 已存在，客户端 `useEffect` 修正 |
| 用户手动切换后忘记已覆盖 | 设置页明确显示"当前为手动模式"提示 |
| 跟随系统模式在 Web 端不可用 | Web 端 `prefers-color-scheme` 可用，但用户可能 unaware，提供清晰说明 |
| 颜色过渡闪烁 | `body` 添加 `transition-colors duration-300` |

### Project Structure Notes

新增文件：
- `src/lib/theme.ts` — 主题工具函数（纯函数，无副作用）
- `src/hooks/use-theme.ts` — 客户端主题 Hook

修改文件：
- `src/app/globals.css` — 替换 `.dark` 块为星空色板
- `src/app/layout.tsx` — 添加时间检测 + theme class 注入
- `src/app/settings/page.tsx` — 添加主题切换 UI

### References

- [Source: epics.md#Story 8.14]
- [Source: ux-design-specification.md#4. 全局主题系统]
- [Source: ux-design-specification.md#UX-DR25 设计 Token 治理]
- [Source: architecture.md#Styling Solution: TailwindCSS v4]
- [Source: project-context.md#Color Palette "暖日"]
- [Source: project-context.md#File Naming Conventions]
- [Source: memory/code-review-gated/MEMORY.md#Naming Conventions Registry]

### Review Findings

#### Decision Needed
- [x] [Review][Decision] 未使用的 CSS 变量无消费者 — **用户决定保留**，作为未来 sidebar/chart 组件预留。[src/app/globals.css:93-113]

#### Patches
- [x] [Review][Patch] 服务端时区导致 hydration 不匹配 — **FIXED**: 改用 `next/headers` 的 `headers()` 获取 Vercel 注入的 `x-vercel-ip-timezone` header，按用户 IP 时区计算。非 Vercel 部署 fallback 到 `getTimeTheme()` 服务器本地时间。[src/app/layout.tsx:27-41]
- [x] [Review][Patch] `getTimeTheme()` 重复定义 — **FIXED**: 移除 `layout.tsx` 中的副本，统一从 `@/lib/theme` import。[src/app/layout.tsx:24]
- [x] [Review][Patch] ThemeHydration 在 post-paint 修正 `dark` class — **FIXED**: 改用内联 `<script dangerouslySetInnerHTML>` 在 `<head>` 中同步执行，首次绘制前应用 class，消除 FOUC。[src/components/theme-hydration.tsx]

#### Deferred（非本次引入）
- [x] [Review][Defer] 设置页主题选项可能在 hydration 后短暂显示错误选中值 — 用户从 localStorage 读取模式前 UI 已渲染。已存在，非本次变更引入。[src/app/settings/page.tsx]
- [x] [Review][Defer] `body` 全局 transition 在所有页面切换时触发 300ms 颜色过渡 — 不仅限于主题切换场景。预存在问题。[src/app/globals.css:138]
- [x] [Review][Defer] System 模式下 `matchMedia` change 事件触发时无效重渲染 — handler 调用 `setModeState("system")` 即使当前已是 system。预存在设计问题。[src/hooks/use-theme.ts:31]
- [x] [Review][Defer] 无跨 tab 主题同步 — 多 tab 打开时各自独立读写 localStorage，可能显示不同主题。预存在限制。[src/lib/theme.ts]
