# shadcn/ui 编码规范

> 项目：Xiaozhi Journal
> 版本：1.0.0
> 最后更新：2026-04-22

---

## 目录

1. [核心理念：Copy-Paste Ownership](#1-核心理念copy-paste-ownership)
2. [components.json 配置管理](#2-componentsjson-配置管理)
3. [组件架构](#3-组件架构)
4. [自定义策略优先级](#4-自定义策略优先级)
5. [CSS Variables 与 Tailwind CSS v4 集成](#5-css-variables-与-tailwind-css-v4-集成)
6. [OKLCH 颜色系统与设计 Token 层级](#6-oklch-颜色系统与设计-token-层级)
7. [Dark Mode 实现](#7-dark-mode-实现)
8. [组件选型策略：shadcn vs @base-ui/react vs Custom](#8-组件选型策略shadcn-vs-base-ui-react-vs-custom)
9. [性能优化](#9-性能优化)
10. [反模式 Anti-Patterns](#10-反模式-anti-patterns)
11. [Code Review 检查清单](#11-code-review-检查清单)

---

## 1. 核心理念：Copy-Paste Ownership

shadcn/ui **不是 npm 库**，而是「复制粘贴 + 自主拥有」的组件集合。

### 1.1 必须遵守

- **必须理解**：每个通过 `npx shadcn@latest add` 安装的组件源码都完整存在于 `src/components/ui/` 目录下，你拥有它，你负责维护它
- **必须阅读**：安装新组件前，必须先阅读生成的源码，理解其 Compound Component 结构、props 接口、依赖关系
- **必须提交**：安装后的组件文件必须纳入 git 版本控制

### 1.2 禁止行为

- **禁止**将 shadcn/ui 当作黑盒组件库 — 你永远有权也有责任修改源码
- **禁止**从 node_modules 直接 import shadcn 组件（本项目使用 `@/components/ui/*` 路径）
- **禁止**在组件库未安装时手动复制网上找到的 shadcn 组件代码（版本可能不匹配）

### 1.3 正确 vs 错误示例

```tsx
// ✅ 正确 — 从项目本地路径导入
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";

// ❌ 错误 — 不存在 npm 包导入方式
import { Button } from "shadcn-ui/button";
import { Button } from "@shadcn/ui/button";
```

---

## 2. components.json 配置管理

本项目当前配置（`/xiaozhi-journal/components.json`）：

```json
{
  "style": "base-nova",
  "rsc": true,
  "tsx": true,
  "tailwind": {
    "config": "",
    "css": "src/app/globals.css",
    "baseColor": "neutral",
    "cssVariables": true,
    "prefix": ""
  },
  "iconLibrary": "lucide",
  "aliases": {
    "components": "@/components",
    "utils": "@/lib/utils",
    "ui": "@/components/ui",
    "lib": "@/lib",
    "hooks": "@/hooks"
  }
}
```

### 2.1 不可变字段（禁止手动修改）

| 字段 | 当前值 | 说明 |
|------|--------|------|
| `style` | `base-nova` | 决定组件生成时使用 @base-ui/react 还是原生 HTML |
| `rsc` | `true` | 组件兼容 React Server Components |
| `tsx` | `true` | 使用 TypeScript |
| `baseColor` | `neutral` | 设计系统基础色阶 |
| `cssVariables` | `true` | 使用 CSS 变量而非硬编码 Tailwind 类 |
| `aliases.ui` | `@/components/ui` | UI 组件目录路径 |
| `aliases.utils` | `@/lib/utils` | `cn()` 工具函数路径 |

### 2.2 CLI 使用规范

- **必须**使用 `npx shadcn@latest add <component>` 安装新组件
- **禁止**手动编辑 `components.json` 的 `style`、`baseColor`、`cssVariables` 字段 — 这会导致后续 `add` 命令生成的组件风格不一致
- **必须**在安装新组件后检查 diff，确认生成的代码符合项目规范
- **推荐**定期运行 `npx shadcn@latest diff` 对比上游更新，评估是否需要手动合并

### 2.3 正确 vs 错误示例

```bash
# ✅ 正确 — 使用 CLI 安装
npx shadcn@latest add select
npx shadcn@latest add tooltip

# ❌ 错误 — 手动复制组件代码
# 从官网文档复制粘贴到 src/components/ui/select.tsx

# ❌ 错误 — 修改 style 后安装组件
# 把 components.json 的 style 改成 "new-york" 再 add
# 会导致新旧组件风格不一致
```

---

## 3. 组件架构

### 3.1 目录结构

```
src/
├── components/
│   ├── ui/                    # shadcn/ui 组件（CLI 管理）
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── dialog.tsx
│   │   ├── skeleton.tsx
│   │   └── textarea.tsx
│   └── *.tsx                  # 业务组件（自由创建）
│       ├── auth-guard.tsx
│       ├── journal-input.tsx
│       └── ...
```

- **必须**将 shadcn 组件严格限定在 `src/components/ui/` 目录
- **禁止**在 `src/components/ui/` 中创建非 shadcn 组件
- **禁止**修改 `src/components/ui/` 中文件的导出结构（`export { Component, componentVariants }`）

### 3.2 Compound Component 模式

shadcn 组件大量使用 Compound Component 模式，必须理解并正确消费：

```tsx
// ✅ 正确 — 完整使用 Compound Component
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";

<Dialog>
  <DialogTrigger>打开</DialogTrigger>
  <DialogContent>
    <DialogHeader>
      <DialogTitle>标题</DialogTitle>
    </DialogHeader>
    <p>内容</p>
  </DialogContent>
</Dialog>;

// ❌ 错误 — 跳过必要的子组件
<Dialog>
  <p>直接在 Dialog 里放内容，不使用 DialogContent</p>
</Dialog>;
```

### 3.3 基于 @base-ui/react 的组件结构

本项目 `style: "base-nova"` 意味着 shadcn 组件底层使用 `@base-ui/react` 无头组件。以 `button.tsx` 为例：

```tsx
// 当前项目 button.tsx 结构（必须理解此模式）
import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const buttonVariants = cva( /* ... */ );

function Button({ className, variant, size, ...props }) {
  return (
    <ButtonPrimitive
      data-slot="button"
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
```

- **必须**保留 `buttonVariants`（或等价变体配置）的导出，供外部组件组合使用
- **必须**保留 `cn()` 工具函数的调用链，确保 className 正确合并
- **禁止**移除 `data-slot` 属性 — 它是 shadcn 内部样式选择的标记
- **推荐**在添加新 props 时，继承 Primitive 组件的 Props 类型（如 `ButtonPrimitive.Props`）

---

## 4. 自定义策略优先级

当需要定制 shadcn 组件时，严格按照以下优先级操作：

### 4.1 优先级排序（从高到低）

| 优先级 | 策略 | 适用场景 | 侵入性 |
|--------|------|----------|--------|
| 1 | `className` 覆盖 | 单次使用的样式调整 | 零 |
| 2 | Wrapper 组件 | 多个位置复用的组合组件 | 低 |
| 3 | `cva` variants 扩展 | 需要多种变体的业务组件 | 中 |
| 4 | 直接修改 `ui/` 源码 | 全局性设计系统变更 | 高 |

### 4.2 Level 1 — className 覆盖（首选）

```tsx
// ✅ 正确 — 通过 className 覆盖
import { Button } from "@/components/ui/button";

<Button className="w-full py-6 text-lg">
  提交日记
</Button>;

// ❌ 错误 — 为了改个宽度就去改 button.tsx 源码
```

### 4.3 Level 2 — Wrapper 组件

```tsx
// ✅ 正确 — 创建业务 wrapper 组件
// src/components/journal-submit-button.tsx
import { Button } from "@/components/ui/button";

export function JournalSubmitbutton({ loading, ...props }) {
  return (
    <Button
      className="w-full py-6 text-lg"
      disabled={loading}
      {...props}
    >
      {loading ? "保存中..." : "提交日记"}
    </Button>
  );
}

// 使用处
<JournalSubmitbutton loading={isSaving} onClick={handleSubmit} />;
```

### 4.4 Level 3 — cva variants 扩展

```tsx
// ✅ 正确 — 扩展变体而非创建新组件
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// 在业务组件中组合使用
<Button
  className={cn(
    buttonVariants({ variant: "destructive", size: "lg" }),
    "animate-pulse"
  )}
>
  删除
</Button>;

// ✅ 正确 — 当需要新的变体模式时，在业务层定义新的 cva
import { cva } from "class-variance-authority";

const journalButtonVariants = cva(buttonVariants(), {
  variants: {
    mood: {
      happy: "border-green-500 bg-green-50",
      sad: "border-blue-500 bg-blue-50",
      neutral: "",
    },
  },
});
```

### 4.5 Level 4 — 直接修改源码（最后手段）

```tsx
// ⚠️ 仅在以下情况使用：
// 1. 所有消费该组件的位置都需要此变更
// 2. 变更属于设计系统级别（如全局圆角调整）
// 3. className 覆盖无法实现的场景（如需修改内部子组件结构）

// 修改前必须：
// - 在 PR 描述中说明为什么前三级策略不适用
// - 确认变更不会影响已有消费方
```

---

## 5. CSS Variables 与 Tailwind CSS v4 集成

### 5.1 配置确认

项目 `components.json` 中 `"cssVariables": true`，所有颜色通过 CSS 变量引用。

### 5.2 @theme inline 映射

本项目 `globals.css` 使用 `@theme inline` 将 CSS 变量映射为 Tailwind 工具类：

```css
@theme inline {
  --color-background: var(--background);
  --color-foreground: var(--foreground);
  --color-primary: var(--primary);
  --color-primary-foreground: var(--primary-foreground);
  /* ... 更多映射 */
}
```

- **必须**通过 `@theme inline` 注册的变量才能在 Tailwind 类中使用（如 `bg-background`、`text-primary`）
- **必须**在 `@theme inline` 中添加新的设计 token，而非直接写 Tailwind 颜色值
- **禁止**在组件中使用硬编码颜色值（如 `bg-[#FDF8F5]`）— 应使用 `bg-background`

### 5.3 自定义设计 Token

```css
/* ✅ 正确 — 在 @theme inline 中注册新 token */
@theme inline {
  --color-journal-bg: var(--journal-bg);
  --color-journal-accent: var(--journal-accent);
}

:root {
  --journal-bg: #FDF8F5;
  --journal-accent: #E8C4A0;
}

/* ❌ 错误 — 硬编码颜色值 */
<div className="bg-[#FDF8F5]">

/* ✅ 正确 — 使用注册的 token */
<div className="bg-journal-bg">
```

### 5.4 Tailwind CSS v4 特性

- **必须**使用 `@import "tailwindcss"` 而非 `@tailwind` 指令
- **必须**使用 `@custom-variant` 定义自定义变体（如 `@custom-variant dark (&:is(.dark *))`）
- **禁止**使用 `tailwind.config.js/ts` — Tailwind v4 使用 CSS 配置
- **必须**使用 `@apply` 时确认目标类已存在于主题中

---

## 6. OKLCH 颜色系统与设计 Token 层级

### 6.1 设计 Token 层级

本项目设计系统遵循严格层级：

```
CSS Variables (:root / .dark)
    ↓
@theme inline 映射
    ↓
Tailwind 工具类 (bg-*, text-*, border-*)
    ↓
shadcn 组件 (cva variants)
    ↓
业务组件 (className 覆盖)
```

### 6.2 颜色 Token 规范

```css
/* ✅ 正确 — 完整语义化 Token 定义 */
:root {
  --background: #FDF8F5;        /* 页面背景 */
  --foreground: #3D3D3D;        /* 正文文字 */
  --primary: #E8C4A0;           /* 主操作色 */
  --primary-foreground: #FFFFFF; /* 主操作上的文字 */
  --accent: #D4856A;            /* 强调色 */
  --accent-foreground: #FFFFFF;  /* 强调色上的文字 */
  --destructive: #D4856A;       /* 危险操作色 */
  --muted: #F5EDE4;             /* 弱化背景 */
  --muted-foreground: #8A817C;  /* 弱化文字 */
  /* ... */
}
```

- **必须**为每个语义色定义对应的 `-foreground` 变体
- **禁止**在组件层直接引用原始色值（如 `--accent`）— 应使用语义 token
- **推荐**新增颜色时，在 `:root` 和 `.dark` 中同时定义

### 6.3 OKLCH 色彩空间

Tailwind CSS v4 原生支持 OKLCH 色彩空间。在需要精确颜色控制时：

- **推荐**使用 OKLCH 格式定义颜色（如 `oklch(0.75 0.12 65)`）以获得更好的感知均匀性
- **推荐**使用 OKLCH 进行颜色混合和透明度计算（避免 sRGB 混合的灰度偏移问题）
- **必须**确保最终生成的 CSS 变量值对浏览器兼容（Tailwind v4 会自动处理降级）

---

## 7. Dark Mode 实现

### 7.1 实现机制

本项目使用 CSS class 切换 dark mode：

```css
@custom-variant dark (&:is(.dark *));
```

- **必须**在 `<html>` 元素上添加/移除 `dark` class 来切换主题
- **禁止**使用 `prefers-color-scheme` media query 作为唯一 dark mode 方案（用户手动选择优先级高于系统偏好）
- **必须**确保 `.dark` 块中定义了所有 `:root` 中存在的 CSS 变量

### 7.2 Dark Mode 颜色策略

```css
/* ✅ 正确 — 完整的 dark mode 对应 */
:root {
  --background: #FDF8F5;
  --foreground: #3D3D3D;
  --card: #FFFFFF;
  --card-foreground: #3D3D3D;
}

.dark {
  --background: #3D3D3D;
  --foreground: #FDF8F5;
  --card: #3D3D3D;
  --card-foreground: #FDF8F5;
}
```

- **推荐**dark mode 下使用降低饱和度的颜色，避免纯黑纯白
- **必须**验证所有自定义颜色 token 在 dark mode 下可读
- **禁止**在 dark mode 下使用高饱和度背景色

### 7.3 组件级 dark mode 适配

```tsx
// ✅ 正确 — 使用 Tailwind dark: 前缀
<div className="bg-white dark:bg-gray-800 text-gray-900 dark:text-white">

// ❌ 错误 — 使用 JS 检测系统偏好
const isDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
```

---

## 8. 组件选型策略：shadcn vs @base-ui/react vs Custom

### 8.1 决策树

```
需要 UI 组件时：
                    │
        ┌───────────┴───────────┐
        │ shadcn 有现成组件吗？ │
        └───────────┬───────────┘
                    │
          YES ──────┤ ───── NO
                    │         │
        ┌───────────┴───┐     │
        │ 用 shadcn/ui  │     ├── @base-ui/react 有合适的无头组件吗？
        │ npx add       │     │
        └───────────────┘     └──────────┬──────────────┘
                                         │
                               YES ──────┤ ───── NO
                                         │         │
                              ┌──────────┴───┐     │
                              │ 自建组件 +   │     │
                              │ @base-ui     │     ├── 完全自定义组件
                              │ 做底层       │     │ (纯 HTML + CSS)
                              └──────────────┘     │
                                                   └──────────────────┘
```

### 8.2 shadcn/ui 适用场景（首选）

- 表单控件：Button, Input, Select, Checkbox, Radio, Switch, Textarea
- 布局容器：Card, Dialog, Sheet, Drawer, Tabs, Accordion
- 反馈组件：Toast, Alert, Progress, Skeleton
- 导航组件：Dropdown Menu, Navigation Menu, Breadcrumb
- 数据展示：Table, Avatar, Badge

### 8.3 @base-ui/react 直接适用场景

- shadcn 未封装但 @base-ui 提供的无头组件
- 需要完全自定义 UI 但复用无障碍逻辑
- 需要深度集成 WAI-ARIA 模式的场景

```tsx
// ✅ 正确 — 直接使用 @base-ui 构建自定义组件
import { Slider } from "@base-ui/react/slider";

function MoodSlider({ value, onChange }) {
  return (
    <Slider
      className="w-full h-2 bg-muted rounded-full"
      value={value}
      onValueChange={onChange}
    />
  );
}
```

### 8.4 完全自定义组件场景

- 项目特有交互（如日记输入的波浪动画效果）
- 复杂可视化图表
- 品牌特有的视觉元素（如 mood emoji 选择器）

### 8.5 禁止行为

- **禁止**在同一项目中混用多个 UI 组件库（如 Material UI + Ant Design + shadcn）
- **禁止**为 shadcn 已有的组件重新造轮子
- **禁止**在已有 shadcn 组件的情况下引入 Radix UI 直接使用（shadcn 已经封装了 Radix）

---

## 9. 性能优化

### 9.1 Bundle 所有权

- **推荐**理解：shadcn 组件代码直接存在于项目中，只打包实际 import 的组件
- **推荐**按需安装 — 不要一次性安装所有 shadcn 组件
- **必须**定期审计 `src/components/ui/` 目录，移除未使用的组件文件

### 9.2 Server Components 集成

本项目 `rsc: true`，所有 shadcn 组件兼容 React Server Components。

```tsx
// ✅ 正确 — Server Component 中直接使用 shadcn
// src/app/page.tsx (Server Component)
import { Card, CardContent } from "@/components/ui/card";

export default async function HomePage() {
  const data = await fetchData();
  return (
    <Card>
      <CardContent>{/* ... */}</CardContent>
    </Card>
  );
}

// ❌ 错误 — 在 Server Component 中使用需要客户端状态的逻辑
// shadcn 组件本身是客户端组件，但可以在 Server Component 中消费
```

- **必须**理解：shadcn 组件内部使用 `"use client"` 标记，消费方无需重复标记
- **禁止**移除 shadcn 组件文件顶部的 `"use client"` 指令
- **推荐**将不需要交互的布局/展示逻辑保持为 Server Component

### 9.3 动态导入

```tsx
// ✅ 推荐 — 对重型交互组件使用 dynamic import
import dynamic from "next/dynamic";

const JournalEditor = dynamic(() => import("@/components/journal-editor"), {
  loading: () => <Skeleton className="w-full h-48" />,
  ssr: false,
});

// ✅ 推荐 — Dialog 内容可以懒加载
const SettingsDialog = dynamic(
  () => import("@/components/settings-dialog").then((m) => m.SettingsDialog)
);
```

- **推荐**对首屏不需要的重型组件使用 `dynamic()`
- **推荐**为 dynamic import 配置 `loading` 骨架屏
- **必须**确认组件无 SSR 依赖后再设置 `ssr: false`

---

## 10. 反模式 Anti-Patterns

### 10.1 过度修改 shadcn 源码

```
问题：直接修改 src/components/ui/dialog.tsx 添加业务特有逻辑
影响：后续 shadcn 版本升级时冲突、所有消费方被迫接受变更

正确做法：创建 wrapper 组件或 className 覆盖
```

### 10.2 不及时更新组件

```
问题：安装 shadcn 组件后不再关注上游更新
影响：错过 bug 修复、安全补丁、无障碍改进

正确做法：
1. 定期运行 npx shadcn@latest diff
2. 评估上游变更是否有价值
3. 手动 cherry-pick 需要的改动
```

### 10.3 混用多个 UI 库

```
问题：同时引入 shadcn/ui + Material UI + Ant Design
影响：bundle 膨胀、样式冲突、维护成本翻倍

正确做法：统一使用 shadcn/ui，不足处用 @base-ui/react 补充
```

### 10.4 过早创建 cva variants

```tsx
// ❌ 错误 — 还没确定需要多少变体就创建复杂 variants
const buttonVariants = cva("", {
  variants: {
    variant: { default: "", primary: "", secondary: "", ghost: "", link: "", journal: "", mood: "" },
    size: { default: "", sm: "", md: "", lg: "", xl: "", journal: "" },
    mood: { happy: "", sad: "", angry: "", neutral: "", excited: "" },
    shape: { round: "", square: "", pill: "" },
    // ... 过度设计
  },
});

// ✅ 正确 — 先用 className 覆盖，确认有多种需求后再提取 variants
```

### 10.5 忽略无障碍访问

```tsx
// ❌ 错误 — 移除 Dialog 的 aria 属性
<DialogContent aria-describedby={undefined}>

// ❌ 错误 — 用 div 模拟按钮
<div className="btn" onClick={handleClick}>提交</div>

// ✅ 正确 — 保留所有无障碍属性，使用语义化元素
<Button onClick={handleClick}>提交</Button>
```

### 10.6 硬编码颜色值

```tsx
// ❌ 错误 — 硬编码
<div className="bg-[#FDF8F5] text-[#3D3D3D]">

// ✅ 正确 — 使用设计 token
<div className="bg-background text-foreground">
```

---

## 11. Code Review 检查清单

在合并包含 UI 组件变更的 PR 前，逐项检查：

### 组件安装与引用

- [ ] 新组件通过 `npx shadcn@latest add` 安装（非手动复制）
- [ ] 导入路径使用 `@/components/ui/*` 格式
- [ ] `components.json` 未被意外修改
- [ ] 新增的 `ui/` 组件文件已纳入 git

### 自定义策略

- [ ] 优先使用 className 覆盖，而非修改源码
- [ ] Wrapper 组件有明确的复用价值（至少 2 处使用）
- [ ] cva variants 扩展有至少 3 种变体需求
- [ ] 直接修改 `ui/` 源码的变更有充分的 PR 说明

### 样式与颜色

- [ ] 无硬编码颜色值（`bg-[#xxx]`、`text-[#xxx]`）
- [ ] 使用项目 design token（`bg-background`、`text-primary`）
- [ ] 新增 CSS 变量同时在 `:root` 和 `.dark` 中定义
- [ ] 自定义 token 已在 `@theme inline` 中注册
- [ ] Dark mode 下颜色对比度可读

### 组件架构

- [ ] Compound Component 使用完整（不跳过必要子组件）
- [ ] 未移除 `"use client"` 指令
- [ ] 未移除 `data-slot` 属性
- [ ] 未混用其他 UI 组件库

### 性能

- [ ] 首屏非必需的重型组件使用 dynamic import
- [ ] dynamic import 配置了 loading skeleton
- [ ] 未引入未使用的 shadcn 组件

### 无障碍

- [ ] 保留所有 ARIA 属性
- [ ] 使用语义化 HTML 元素
- [ ] 表单控件有 label 关联
- [ ] 键盘导航可用

### Tailwind CSS v4

- [ ] 使用 `@import "tailwindcss"` 而非 `@tailwind` 指令
- [ ] 未使用 `tailwind.config.js/ts`
- [ ] 自定义变体使用 `@custom-variant` 定义
