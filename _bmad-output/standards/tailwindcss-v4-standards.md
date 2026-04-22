# Tailwind CSS v4 编码规范 — Xiaozhi Journal

> 适用项目：Xiaozhi Journal（日记 Web 应用，深色/浅色主题、动画交互、响应式设计）
> 技术栈：Next.js 16 + Tailwind CSS v4 + shadcn/ui + framer-motion
> 生效日期：2026-04-22

---

## 目录

1. [CSS-first 配置 (@theme)](#1-css-first-配置-theme)
2. [颜色系统 (OKLCH 与语义化色板)](#2-颜色系统-oklch-与语义化色板)
3. [@utility 与 @custom-variant](#3-utility-与-custom-variant)
4. [Container Queries](#4-container-queries)
5. [性能规范](#5-性能规范)
6. [从 v3 迁移的禁止模式](#6-从-v3-迁移的禁止模式)
7. [Next.js 16 集成](#7-nextjs-16-集成)
8. [动画与 framer-motion 协作](#8-动画与-framer-motion-协作)
9. [响应式设计](#9-响应式设计)
10. [代码审查清单](#代码审查清单)

---

## 1. CSS-first 配置 (@theme)

### 规则 1.1 — 必须使用 `@theme` 声明设计令牌，禁止 `tailwind.config.js`

Tailwind CSS v4 不再需要 JavaScript 配置文件。所有主题定义必须在 CSS 中通过 `@theme` 完成。

```css
/* ✅ 推荐 — globals.css */
@theme inline {
  --font-sans: var(--font-noto-sans);
  --font-serif: var(--font-noto-serif);
  --color-primary: var(--primary);
  --color-accent: var(--accent);
  --radius-md: 12px;
}
```

```js
// ❌ 禁止 — 不要创建 tailwind.config.ts/js
export default {
  theme: { extend: { ... } }  // v3 模式，已废弃
}
```

**审查点**：仓库中不存在 `tailwind.config.*` 文件；所有自定义 token 在 `globals.css` 的 `@theme` 块中定义。

### 规则 1.2 — 必须使用 `inline` 修饰符使 CSS 变量可被 JIT 扫描

`@theme inline` 让 CSS 自定义属性作为 inline style 可用，Tailwind 才能识别通过 `var()` 引用的颜色值。

```css
/* ✅ 正确 */
@theme inline {
  --color-background: var(--background);
}

/* ❌ 错误 — 缺少 inline，颜色工具类无法生成 */
@theme {
  --color-background: var(--background);
}
```

**审查点**：`@theme` 必须带有 `inline` 关键字。

### 规则 1.3 — 字体必须通过 `@theme` 注册，禁止在组件中硬编码 `font-family`

当前项目已在 `layout.tsx` 中通过 `next/font/google` 注入 CSS 变量。组件必须使用 Tailwind 工具类而非内联 style。

```tsx
// ✅ 推荐 — 使用 Tailwind 工具类
<h1 className="font-serif">Xiaozhi Journal</h1>

// ❌ 避免 — 内联 style（当前代码库中存在，需逐步迁移）
<h1 style={{ fontFamily: 'var(--font-noto-serif)' }}>Xiaozhi Journal</h1>
```

```css
/* globals.css — 必须注册字体到 @theme */
@theme inline {
  --font-sans: var(--font-noto-sans);
  --font-serif: var(--font-noto-serif);
  --font-mono: var(--font-geist-mono);
}
```

**审查点**：新增组件优先使用 `font-sans` / `font-serif` 工具类，而非 `style={{ fontFamily }}`。

---

## 2. 颜色系统 (OKLCH 与语义化色板)

### 规则 2.1 — 推荐使用 OKLCH 颜色格式定义色板

OKLCH 提供感知均匀的颜色插值，在动画过渡和颜色派生中表现更好。Tailwind v4 原生支持 OKLCH。

```css
/* ✅ 推荐 — OKLCH 格式定义语义化色板 */
:root {
  --background: oklch(97% 0.015 75);    /* 暖白底色 */
  --foreground: oklch(30% 0.01 75);     /* 深色文字 */
  --primary: oklch(82% 0.08 75);        /* 主色 — 暖金 */
  --accent: oklch(60% 0.14 30);         /* 强调色 — 赤陶 */
  --muted: oklch(92% 0.01 75);          /* 弱化背景 */
  --muted-foreground: oklch(55% 0.02 75); /* 弱化文字 */
}
```

```css
/* ❌ 避免 — HEX 格式（当前代码库中使用，建议在下次重构时迁移） */
:root {
  --background: #FDF8F5;
  --foreground: #3D3D3D;
}
```

**审查点**：新添加的颜色必须使用 `oklch()` 格式；现有 HEX 值可在重构时迁移，不强制回退修改。

### 规则 2.2 — 禁止在组件中硬编码 HEX/RGB 颜色值，必须使用语义化 Tailwind 工具类

```tsx
// ✅ 推荐 — 语义化颜色工具类
<div className="bg-background text-foreground">
<div className="bg-primary text-primary-foreground">
<div className="border-border">

// ❌ 禁止 — 硬编码 HEX 值
<div className="bg-[#FDF8F5] text-[#3D3D3D]">    {/* 当前代码库中大量存在 */}
<div className="border-[#E8E0D8]">                  {/* 当前代码库中大量存在 */}
```

**审查点**：所有新代码必须使用语义化工具类（`bg-background`、`text-foreground`、`border-border` 等），禁止新增 `bg-[#...]` / `text-[#...]` 硬编码颜色。

### 规则 2.3 — 深色模式必须通过 `.dark` 类切换，覆盖所有语义化变量

```css
/* ✅ 正确 — .dark 块覆盖所有变量 */
.dark {
  --background: oklch(30% 0.01 75);
  --foreground: oklch(97% 0.015 75);
  --card: oklch(30% 0.01 75);
  --primary: oklch(82% 0.08 75);    /* 主色在深色模式下保持不变 */
  --accent: oklch(60% 0.14 30);
  --border: oklch(45% 0.02 75);
}
```

```tsx
// ✅ 正确 — 根 layout 传递 dark class
<html lang="zh-CN" className="dark">
  <body className="min-h-full bg-background text-foreground">

// ❌ 禁止 — 通过 JS 条件渲染切换背景色
<div className={isDark ? 'bg-gray-900' : 'bg-white'}>
```

**审查点**：深色模式仅通过 CSS `.dark` 选择器实现，不使用 JS 条件类名。

---

## 3. @utility 与 @custom-variant

### 规则 3.1 — 必须使用 `@utility` 定义可复用的复合工具类

当多个组件共享相同的样式组合时，必须提取为 `@utility` 而非重复编写。

```css
/* ✅ 推荐 — 提取 journal 卡片为 utility */
@utility journal-card {
  @apply rounded-xl border border-border bg-card p-6 shadow-sm;
  @apply transition-colors hover:shadow-md;
}

/* ✅ 在组件中使用 */
```

```tsx
// ✅ 使用自定义 utility
<div className="journal-card">
  {children}
</div>

// ❌ 禁止 — 在每个组件中重复相同的 className
<div className="rounded-xl border border-border bg-card p-6 shadow-sm transition-colors hover:shadow-md">
```

**审查点**：相同样式组合出现 2 次以上时，必须提取为 `@utility`。

### 规则 3.2 — 必须使用 `@custom-variant` 定义项目特有的状态变体

```css
/* ✅ 推荐 — 定义日记特有的交互状态 */
@custom-variant saving (&[data-saving="true"]);
@custom-variant offline (&[data-offline="true"]);

/* 在组件中使用 */
```

```tsx
// ✅ 使用自定义变体
<div className="bg-background saving:bg-muted offline:opacity-60">
```

**审查点**：项目特有的状态（如 `saving`、`offline`、`ai-waiting`）必须通过 `@custom-variant` 定义，而非在 className 中写选择器字符串。

### 规则 3.3 — 当前项目必须保留 `@custom-variant dark` 声明

```css
/* ✅ 必须保留 — shadcn/ui 依赖此声明 */
@custom-variant dark (&:is(.dark *));
```

**审查点**：不得删除或修改此行。

---

## 4. Container Queries

### 规则 4.1 — 组件内部响应式必须使用 Container Queries，而非 Breakpoints

日记卡片、引用卡片等嵌入型组件，其自适应必须基于父容器宽度而非视口宽度。

```css
/* ✅ 推荐 — 在 @theme 中注册 container */
@theme inline {
  --container-sm: 640px;
  --container-md: 768px;
  --container-lg: 1024px;
}
```

```tsx
// ✅ 正确 — GoldenQuote 组件使用 container query
<div className="@container">
  <div className="flex flex-col gap-2 @lg:flex-row @lg:items-center">
    <div className="text-accent">❝</div>
    <blockquote className="font-serif text-lg @lg:text-xl">
      {quote}
    </blockquote>
  </div>
</div>

// ❌ 避免 — 使用视口 breakpoint 控制嵌入组件布局
<div className="flex flex-col md:flex-row">  {/* md 是视口断点，不适用于组件 */}
```

**审查点**：嵌入型组件（卡片、列表项、面板内组件）的布局变化使用 `@container` + `@sm:` / `@md:` / `@lg:` 断点。

### 规则 4.2 — 页面级布局仍使用视口 Breakpoints

```tsx
// ✅ 正确 — 页面布局使用视口断点
<main className="px-4 sm:px-6 md:px-8 lg:px-12">
```

**审查点**：页面级 padding/margin/布局使用 `sm:` / `md:` / `lg:` / `xl:` 视口断点。

---

## 5. 性能规范

### 规则 5.1 — 动画属性必须使用 `transform` 和 `opacity`，禁止动画触发重排的属性

```tsx
// ✅ 推荐 — 仅动画 transform/opacity 属性
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
>

// ❌ 禁止 — 动画触发重排的属性
<motion.div
  initial={{ width: 0, height: 0 }}
  animate={{ width: 200, height: 100 }}  {/* 触发 layout recalculation */}
>
```

**审查点**：framer-motion 动画仅使用 `opacity`、`transform`（`x`、`y`、`scale`、`rotate`）。

### 规则 5.2 — 必须尊重 `useReducedMotion`，为所有动画提供降级方案

```tsx
// ✅ 必须 — 检查 reduce motion 偏好
const shouldReduceMotion = useReducedMotion();

<motion.div
  initial={shouldReduceMotion ? undefined : { opacity: 0, y: 20 }}
  animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
  exit={shouldReduceMotion ? undefined : { opacity: 0 }}
>
```

**审查点**：每个使用 framer-motion 的组件必须引用 `useReducedMotion()` 并提供降级。

### 规则 5.3 — 禁止在 className 中使用 `*:` 通配符选择器进行大规模样式应用

Tailwind v4 支持 `*:` 前缀，但其会为每个子元素生成工具类，容易导致样式膨胀。

```css
/* ❌ 禁止 — 通配符应用到所有子元素 */
<div className="*:rounded-lg *:p-4 *:border">  {/* 影响所有子级，难以预测 */}
```

**审查点**：`*:` 选择器仅限简单列表场景（如 `<ul className="*:py-2">`），不用于复杂组件。

### 规则 5.4 — 图片与媒体必须设置明确的尺寸约束

```tsx
// ✅ 推荐 — 明确尺寸防止布局偏移
<img
  src={avatarUrl}
  alt="头像"
  className="w-20 h-20 object-cover rounded-full"
/>

// ❌ 禁止 — 无尺寸约束的图片
<img src={avatarUrl} alt="头像" />
```

**审查点**：所有 `<img>` 元素必须带有宽度/高度约束的工具类。

---

## 6. 从 v3 迁移的禁止模式

### 规则 6.1 — 禁止使用 `@apply` 在 `@layer` 中定义组件样式

v3 的 `@layer components` 模式在 v4 中已被 `@utility` 替代。

```css
/* ❌ 禁止 — v3 遗留模式 */
@layer components {
  .btn-primary {
    @apply bg-primary text-primary-foreground rounded-xl px-4 py-2;
  }
}

/* ✅ 正确 — v4 @utility */
@utility btn-primary {
  @apply bg-primary text-primary-foreground rounded-xl px-4 py-2 font-medium transition-opacity hover:opacity-90 disabled:opacity-40 disabled:cursor-not-allowed;
}
```

**审查点**：`globals.css` 中不得出现 `@layer components` / `@layer utilities` 块。

### 规则 6.2 — 禁止使用 `theme()` 函数引用 Tailwind 主题值

v4 中直接使用 CSS 变量替代 `theme()` 函数。

```css
/* ❌ 禁止 — v3 模式 */
.card {
  padding: theme('spacing.4');
  color: theme('colors.foreground');
}

/* ✅ 正确 — 直接使用 CSS 变量 */
.card {
  padding: var(--spacing-4);
  color: var(--foreground);
}
```

**审查点**：CSS 中不得出现 `theme(...)` 函数调用。

### 规则 6.3 — 禁止继续使用 `tailwind.config.*` 中的 `plugins` 注册工具类

v3 的 JavaScript 插件注册方式在 v4 中必须迁移到 CSS `@utility`。

```js
// ❌ 禁止 — v3 plugin 注册
plugins: [
  function({ addUtilities }) {
    addUtilities({ '.scrollbar-hide': { ... } });
  }
]

/* ✅ 正确 — v4 @utility */
@utility scrollbar-hide {
  scrollbar-width: none;
  -ms-overflow-style: none;
  &::-webkit-scrollbar { display: none; }
}
```

**审查点**：无 `tailwind.config.*` 文件存在。

### 规则 6.4 — 禁止使用 `bg-[#...]` 新增硬编码颜色（已有代码逐步迁移）

```tsx
// ❌ 禁止新增 — 硬编码颜色值
<div className="bg-[#FDF8F5] text-[#3D3D3D] border-[#E8E0D8]">

// ✅ 必须使用 — 语义化工具类
<div className="bg-background text-foreground border-border">
```

**审查点**：Code Review 中所有新增的 `bg-[#...]` / `text-[#...]` 必须被打回，改用语义化颜色。

---

## 7. Next.js 16 集成

### 规则 7.1 — 必须使用 `@tailwindcss/postcss` 作为 PostCSS 插件

```js
// postcss.config.mjs — 必须使用 v4 专用插件
export default {
  plugins: {
    "@tailwindcss/postcss": {},   // ✅ v4 专用
  },
};
```

```js
// ❌ 禁止 — v3 插件
export default {
  plugins: {
    tailwindcss: {},     // v3 插件，不兼容 v4
    autoprefixer: {},    // v4 已不需要
  },
};
```

**审查点**：`postcss.config.*` 中仅使用 `@tailwindcss/postcss`，不含 `autoprefixer`。

### 规则 7.2 — CSS 导入顺序必须为：tailwindcss → 第三方 → shadcn → 自定义

```css
/* ✅ 正确导入顺序 — globals.css */
@import "tailwindcss";          /* 1. Tailwind 核心 */
@import "tw-animate-css";       /* 2. 第三方动画库 */
@import "shadcn/tailwind.css";  /* 3. shadcn/ui 基础样式 */

/* 4. 自定义 @theme / @utility / @custom-variant */
@custom-variant dark (&:is(.dark *));
@theme inline { ... }
@utility journal-card { ... }
```

**审查点**：`globals.css` 的导入顺序必须遵循上述规则，自定义内容在所有 import 之后。

### 规则 7.3 — 必须将全局样式导入放在 `layout.tsx` 顶层

```tsx
// ✅ 正确 — layout.tsx 顶层导入
import "./globals.css";

export default function RootLayout({ children }) {
  return (
    <html lang="zh-CN">
      <body>{children}</body>
    </html>
  );
}
```

**审查点**：`globals.css` 仅在根 `layout.tsx` 中导入一次，不在页面组件或其他组件中重复导入。

### 规则 7.4 — Cache Components 模式下必须注意 CSS 的静态性

Next.js 16 Cache Components 要求 CSS 在构建时可知。动态生成的 className 字符串仍可被扫描，但需注意：

```tsx
// ✅ 安全 — 完整的 className 字符串
<div className={`bg-${variant}-500`}>  {/* ❌ 动态拼接，Tailwind 无法扫描 */}

// ✅ 安全 — 完整类名或条件拼接
const variantClasses = {
  primary: 'bg-primary',
  secondary: 'bg-secondary',
};
<div className={variantClasses[variant]}>
```

**审查点**：禁止使用模板字符串拼接 Tailwind 类名（如 `` `bg-${color}-500` ``）。

---

## 8. 动画与 framer-motion 协作

### 规则 8.1 — Tailwind `transition-*` 用于简单状态过渡，framer-motion 用于复杂进入/退出动画

```tsx
// ✅ 简单交互 — 使用 Tailwind transition
<button className="transition-opacity hover:opacity-90 disabled:opacity-40">
  保存
</button>

// ✅ 复杂动画 — 使用 framer-motion AnimatePresence
<AnimatePresence>
  {showSuccess && (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
    >
      已保存
    </motion.div>
  )}
</AnimatePresence>
```

**审查点**：hover/focus/disabled 状态使用 Tailwind transition；mount/unmount 动画使用 framer-motion。

### 规则 8.2 — 动画时长必须与项目设计系统一致

| 场景 | 时长 | 缓动 |
|------|------|------|
| 微交互 (hover/focus) | 150ms | `ease-out` |
| 元素进入/退出 | 250ms | `easeOut` |
| 页面转场 | 300ms | `easeOut` |
| 成功/失败反馈 | 200ms | `easeOut` |

```tsx
// ✅ 符合设计系统
<motion.div
  transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
>

// ❌ 不符合 — 过快或过慢
<motion.div
  transition={{ duration: 1.5 }}  {/* 过长，用户会感到卡顿 */}
>
```

**审查点**：framer-motion `transition.duration` 必须在 0.15–0.4 秒范围内。

### 规则 8.3 — 日记输入区域的进入动画必须与 Mood Selector 联动

```tsx
// ✅ 当前实现 — JournalInput 通过 key 触发动画
<AnimatePresence>
  {selectedMood && <JournalInput key={selectedMood} onExitComplete={() => {}} />}
</AnimatePresence>
```

**审查点**：新增日记相关动画组件必须遵循 AnimatePresence + key 触发模式。

---

## 9. 响应式设计

### 规则 9.1 — 页面最大宽度必须使用语义化约束

```tsx
// ✅ 推荐 — 日记阅读/书写场景使用舒适宽度
<main className="max-w-[680px] mx-auto px-6 py-12">

// ✅ 设置页面使用较窄宽度
<div className="mx-auto max-w-md">
```

**审查点**：内容区域必须设置 `max-w-*` 和 `mx-auto`，禁止全宽铺满（除非是全屏组件）。

### 规则 9.2 — 移动端优先编写，向上添加断点

```tsx
// ✅ 正确 — Mobile First
<div className="flex flex-col gap-4 md:flex-row md:gap-6">

// ❌ 错误 — 先写 desktop 再覆盖 mobile
<div className="flex flex-row gap-6 max-md:flex-col max-md:gap-4">
```

**审查点**：默认样式面向移动端，`sm:` / `md:` / `lg:` 用于增强。

### 规则 9.3 — 触摸目标必须满足最小 44px 可点击区域

```tsx
// ✅ 正确 — 按钮满足触摸目标尺寸
<button className="min-h-[44px] min-w-[44px] px-4 py-3">

// ❌ 禁止 — 过小的点击区域
<button className="p-1">  {/* 触摸目标太小 */}
```

**审查点**：所有交互元素（按钮、链接、图标按钮）必须满足 `min-h-[44px] min-w-[44px]`。

---

## 10. 代码组织与命名

### 规则 10.1 — className 必须按类型分组书写，每组一行

```tsx
// ✅ 推荐 — 按类型分组，可读性强
<div className="
  flex flex-col gap-4
  rounded-xl border border-border bg-card p-6
  transition-colors hover:shadow-md
  sm:flex-row md:gap-6
">

// ❌ 禁止 — 所有类名挤在一行
<div className="flex flex-col gap-4 rounded-xl border border-border bg-card p-6 transition-colors hover:shadow-md sm:flex-row md:gap-6">
```

**审查点**：className 超过 3 个工具类时，必须分组换行。

### 规则 10.2 — 必须使用 `cn()` / `twMerge()` 合并动态类名

```tsx
import { cn } from "@/lib/utils";

// ✅ 正确 — 使用 twMerge 处理冲突类名
<div className={cn("bg-background rounded-xl", props.className)}>

// ❌ 禁止 — 模板字符串拼接（不处理冲突）
<div className={`bg-background rounded-xl ${props.className}`}>
```

**审查点**：所有接受 `className` prop 的组件必须使用 `cn()` 或 `twMerge()` 合并。

---

## 代码审查清单

在 Pull Request 的 Code Review 中，逐项检查以下内容：

### CSS 配置

- [ ] 不存在 `tailwind.config.*` 文件
- [ ] `globals.css` 使用 `@import "tailwindcss"` 而非 `@tailwind` 指令
- [ ] `@theme` 块带有 `inline` 修饰符
- [ ] `@custom-variant dark (&:is(.dark *))` 声明存在
- [ ] 无 `@layer components` / `@layer utilities` v3 遗留块
- [ ] 无 `theme()` 函数调用
- [ ] `postcss.config.*` 仅包含 `@tailwindcss/postcss`，不含 `autoprefixer`

### 颜色

- [ ] 新增代码无 `bg-[#...]` / `text-[#...]` / `border-[#...]` 硬编码颜色
- [ ] 使用语义化工具类（`bg-background`、`text-foreground`、`border-border`、`bg-primary` 等）
- [ ] `.dark` 块覆盖了所有在 `:root` 中定义的 CSS 变量
- [ ] 新颜色定义使用 `oklch()` 格式

### 组件与复用

- [ ] 重复 2 次以上的样式组合已提取为 `@utility`
- [ ] 动态 className 使用 `cn()` / `twMerge()` 合并
- [ ] 无模板字符串拼接 Tailwind 类名（`` `bg-${color}` `` 模式）
- [ ] className 超过 3 个工具类时已分组换行

### 响应式

- [ ] 内容区域有 `max-w-*` + `mx-auto` 约束
- [ ] Mobile First 编写（默认移动端，断点用于增强）
- [ ] 嵌入型组件使用 `@container` 而非视口 breakpoint
- [ ] 触摸目标满足 `min-h-[44px] min-w-[44px]`

### 动画

- [ ] 所有 framer-motion 组件检查了 `useReducedMotion()`
- [ ] 动画仅使用 `opacity` 和 `transform` 属性
- [ ] `transition.duration` 在 0.15–0.4 秒范围内
- [ ] hover/focus 使用 Tailwind transition，mount/unmount 使用 framer-motion

### Next.js 16

- [ ] `globals.css` 仅在根 `layout.tsx` 中导入一次
- [ ] CSS 导入顺序正确：tailwindcss → 第三方 → shadcn → 自定义
- [ ] 根 `body` 带有 `min-h-full` 类（防止内容不足时背景截断）

### 可访问性

- [ ] 所有 `<img>` 带有 `alt` 属性
- [ ] 所有 `<img>` 带有尺寸约束（`w-* h-*`）
- [ ] 表单元素有对应的 `<label>`
- [ ] 颜色对比度满足 WCAG AA（文字与背景）

---

> 本规范随项目迭代更新。发现规则不适用或需要补充时，在 PR 中附带规范更新建议。
