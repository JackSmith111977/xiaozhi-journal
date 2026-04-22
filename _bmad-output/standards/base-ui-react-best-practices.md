# @base-ui/react v1.3 Coding Standards

> 调研日期: 2026-04-22 | 版本: @base-ui/react ^1.3.0 | 适用于 Xiaozhi Journal 项目

---

## 目录

1. [组件导入模式](#1-组件导入模式)
2. [与 Tailwind CSS v4 集成](#2-与-tailwind-css-v4-集成)
3. [Compound Component 组合模式](#3-compound-component-组合模式)
4. [无障碍访问 (Accessibility)](#4-无障碍访问-accessibility)
5. [表单集成 (Field + Input + Validation)](#5-表单集成-field--input--validation)
6. [framer-motion 集成](#6-framer-motion-集成)
7. [SSR / Next.js 16 安全](#7-ssr--nextjs-16-安全)
8. [反模式 (Anti-Patterns)](#8-反模式-anti-patterns)
9. [CVA 集成与设计令牌](#9-cva-集成与设计令牌)
10. [Code Review 检查清单](#10-code-review-检查清单)

---

## 1. 组件导入模式

### 1.1 必须：从子路径导入以实现 Tree-Shaking

本项目使用 `@base-ui/react` v1.3，每个组件都有独立的入口。**必须**从子路径单独导入，禁止从根路径全量导入。

```tsx
// ✅ 推荐：按需导入，优化 bundle 大小
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { Button as ButtonPrimitive } from "@base-ui/react/button";
import { Input as InputPrimitive } from "@base-ui/react/input";
import { Field as FieldPrimitive } from "@base-ui/react/field";
import { Form as FormPrimitive } from "@base-ui/react/form";
import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";
import { Select as SelectPrimitive } from "@base-ui/react/select";
import { Menu as MenuPrimitive } from "@base-ui/react/menu";
import { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox";
```

```tsx
// ❌ 禁止：全量导入会导致未使用的组件进入 bundle
import { Dialog, Button, Input, Form, Tabs } from "@base-ui/react";
```

### 1.2 Compound Component 的子组件通过命名空间访问

Compound Component 导出为命名空间对象，子组件通过 `Namespace.SubComponent` 访问：

```tsx
// ✅ 正确：Dialog 命名空间
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";

function MyDialog() {
  return (
    <DialogPrimitive.Root>
      <DialogPrimitive.Trigger>打开</DialogPrimitive.Trigger>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Backdrop />
        <DialogPrimitive.Popup>
          <DialogPrimitive.Title>标题</DialogPrimitive.Title>
          <DialogPrimitive.Description>描述</DialogPrimitive.Description>
          <DialogPrimitive.Close>关闭</DialogPrimitive.Close>
        </DialogPrimitive.Popup>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
```

### 1.3 类型导入

类型通过 `.Props` 后缀访问，无需额外 `import type`：

```tsx
// ✅ 推荐：直接从组件命名空间获取 Props 类型
function Dialog({ ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root {...props} />;
}

function DialogOverlay({ className, ...props }: DialogPrimitive.Backdrop.Props) {
  return <DialogPrimitive.Backdrop className={className} {...props} />;
}
```

### 1.4 别名命名约定

**必须**使用 `as XxxPrimitive` 别名包装 UI 组件，避免与项目自定义组件命名冲突：

```tsx
// ✅ 正确
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { Button as ButtonPrimitive } from "@base-ui/react/button";

// 项目自定义组件不使用 Primitive 后缀
function Dialog({ ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="dialog" {...props} />;
}
function Button({ className, ...props }: ButtonPrimitive.Props) {
  return <ButtonPrimitive className={cn(buttonVariants({ className }))} {...props} />;
}
```

---

## 2. 与 Tailwind CSS v4 集成

### 2.1 className 合并必须使用 `cn()` 工具函数

本项目已有 `cn()` 函数（`src/lib/utils.ts`），基于 `clsx` + `tailwind-merge`。**必须**使用它来合并 className，确保 Tailwind 类不会冲突。

```tsx
// ✅ 正确：使用 cn() 合并
function DialogOverlay({ className, ...props }: DialogPrimitive.Backdrop.Props) {
  return (
    <DialogPrimitive.Backdrop
      className={cn(
        "fixed inset-0 isolate z-50 bg-black/10",
        className
      )}
      {...props}
    />
  );
}

// ❌ 错误：直接字符串拼接会导致类冲突
<DialogPrimitive.Backdrop className={`fixed inset-0 ${className}`} />
```

### 2.2 利用 `data-*` 状态属性进行样式控制

base-ui/react 组件会自动在 DOM 上输出 `data-*` 属性来反映组件状态。**必须**使用 Tailwind v4 的 `data-*` 变体来响应这些状态，而不是自行管理 className。

```tsx
// ✅ 推荐：利用 data-open / data-closed 状态属性
<DialogPrimitive.Backdrop
  className={cn(
    "data-open:animate-in data-open:fade-in-0",
    "data-closed:animate-out data-closed:fade-out-0"
  )}
/>

// ✅ 推荐：利用 data-slot 做后代选择器
// Button 上设置 data-slot="button"，然后在父级用 has-data-* 变体
<Button className="has-data-[icon=inline-end]:pr-2 has-data-[icon=inline-start]:pl-2" />
```

### 2.3 `in-data-*` 变体用于上下文样式

当组件嵌套在特定 `data-slot` 容器中时需要调整样式，使用 `in-data-*` 变体：

```tsx
// ✅ 按钮在 ButtonGroup 中时圆角变小
const buttonVariants = cva("...", {
  variants: {
    size: {
      xs: "in-data-[slot=button-group]:rounded-lg",
      sm: "in-data-[slot=button-group]:rounded-lg",
    },
  },
});
```

### 2.4 CSS 变量引用设计令牌

**必须**使用 CSS 变量引用项目设计令牌，而非硬编码色值：

```tsx
// ✅ 推荐：使用 CSS 变量
className="bg-popover text-popover-foreground ring-foreground/10"

// ❌ 错误：硬编码色值（Settings 页面目前存在此问题）
className="bg-[#FDF8F5] text-[#3D3D3D]"
```

### 2.5 `supports-*` 变体用于渐进增强

```tsx
// ✅ 推荐：仅在不支持 backdrop-filter 时降级
className="supports-backdrop-filter:backdrop-blur-xs"
```

---

## 3. Compound Component 组合模式

### 3.1 Dialog 模式（已在项目中使用）

项目已在 `src/components/ui/dialog.tsx` 中封装了 Dialog。**必须**使用已封装的组件，而非直接使用 base-ui 原始组件。

```tsx
// ✅ 正确：使用项目封装的 Dialog 组件
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";

function DeleteAccountDialog() {
  return (
    <Dialog>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>确认删除账户？</DialogTitle>
          <DialogDescription>
            删除后 30 天内数据将被彻底清除，此操作不可撤销。
          </DialogDescription>
        </DialogHeader>
        <DialogFooter>
          <Button variant="outline">取消</Button>
          <Button variant="destructive">确认删除</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
```

**注意**：Settings 页面当前使用原生 `motion.div` 手写删除确认弹窗（`settings/page.tsx` 第 374-429 行），**应迁移到 Dialog 组件**以获得正确的焦点管理和键盘导航。

### 3.2 Tabs 模式

```tsx
// ✅ 正确：Tabs Compound Component
import { Tabs as TabsPrimitive } from "@base-ui/react/tabs";

function SettingsTabs() {
  return (
    <TabsPrimitive.Root>
      <TabsPrimitive.List>
        <TabsPrimitive.Tab value="profile">个人资料</TabsPrimitive.Tab>
        <TabsPrimitive.Tab value="notifications">通知</TabsPrimitive.Tab>
      </TabsPrimitive.List>
      <TabsPrimitive.Panel value="profile">
        {/* 个人资料内容 */}
      </TabsPrimitive.Panel>
      <TabsPrimitive.Panel value="notifications">
        {/* 通知设置内容 */}
      </TabsPrimitive.Panel>
    </TabsPrimitive.Root>
  );
}
```

### 3.3 Select 模式

```tsx
// ✅ 正确：Select Compound Component
import { Select as SelectPrimitive } from "@base-ui/react/select";

function MoodSelect() {
  return (
    <SelectPrimitive.Root>
      <SelectPrimitive.Label>心情</SelectPrimitive.Label>
      <SelectPrimitive.Trigger>
        <SelectPrimitive.Value />
        <SelectPrimitive.Icon />
      </SelectPrimitive.Trigger>
      <SelectPrimitive.Portal>
        <SelectPrimitive.Positioner>
          <SelectPrimitive.Popup>
            <SelectPrimitive.List>
              <SelectPrimitive.Item value="happy">
                <SelectPrimitive.ItemIndicator />
                <SelectPrimitive.ItemText>开心</SelectPrimitive.ItemText>
              </SelectPrimitive.Item>
            </SelectPrimitive.List>
          </SelectPrimitive.Popup>
        </SelectPrimitive.Positioner>
      </SelectPrimitive.Portal>
    </SelectPrimitive.Root>
  );
}
```

### 3.4 Dropdown Menu 模式

```tsx
// ✅ 正确：Menu Compound Component
import { Menu as MenuPrimitive } from "@base-ui/react/menu";

function UserMenu() {
  return (
    <MenuPrimitive.Root>
      <MenuPrimitive.Trigger>头像</MenuPrimitive.Trigger>
      <MenuPrimitive.Portal>
        <MenuPrimitive.Positioner>
          <MenuPrimitive.Popup>
            <MenuPrimitive.Item>个人资料</MenuPrimitive.Item>
            <MenuPrimitive.Item>设置</MenuPrimitive.Item>
            <MenuPrimitive.Item>退出登录</MenuPrimitive.Item>
          </MenuPrimitive.Popup>
        </MenuPrimitive.Positioner>
      </MenuPrimitive.Portal>
    </MenuPrimitive.Root>
  );
}
```

### 3.5 Combobox 模式（可搜索选择器）

```tsx
// ✅ 正确：Combobox Compound Component
import { Combobox as ComboboxPrimitive } from "@base-ui/react/combobox";

function SearchableMoodSelector({ value, onChange }: ComboboxProps) {
  return (
    <ComboboxPrimitive.Root value={value} onValueChange={onChange}>
      <ComboboxPrimitive.Control>
        <ComboboxPrimitive.Input placeholder="搜索心情..." />
        <ComboboxPrimitive.Icon />
      </ComboboxPrimitive.Control>
      <ComboboxPrimitive.Portal>
        <ComboboxPrimitive.Positioner>
          <ComboboxPrimitive.Popup>
            <ComboboxPrimitive.List>
              <ComboboxPrimitive.Item value="happy">
                <ComboboxPrimitive.ItemIndicator />
                开心
              </ComboboxPrimitive.Item>
            </ComboboxPrimitive.List>
            <ComboboxPrimitive.Empty>无匹配结果</ComboboxPrimitive.Empty>
          </ComboboxPrimitive.Popup>
        </ComboboxPrimitive.Positioner>
      </ComboboxPrimitive.Portal>
    </ComboboxPrimitive.Root>
  );
}
```

### 3.6 Compound Component 封装规则

**必须**遵循以下封装层次：

1. **底层**：`@base-ui/react` 原始组件（带 `Primitive` 后缀）
2. **中间层**：`src/components/ui/` 下的无样式/基础样式封装（如 `ui/dialog.tsx`）
3. **业务层**：业务组件（如 `JournalInput`、`MoodSelector`）使用中间层组件

```
@base-ui/react → src/components/ui/* → src/components/* (业务组件)
```

**禁止**业务组件直接使用 `@base-ui/react` 原始组件（除非 `ui/` 下尚无对应封装）。

---

## 4. 无障碍访问 (Accessibility)

### 4.1 WCAG 2.2 合规要求

本项目 **必须**满足 WCAG 2.2 AA 级标准。base-ui/react 组件默认已内置大部分无障碍特性，但使用者仍需注意以下几点。

### 4.2 键盘导航

base-ui/react 的 Compound Component 默认支持键盘导航：

| 组件 | 键盘操作 |
|------|---------|
| Dialog | Escape 关闭，Tab 在内部元素间循环 |
| Select | ArrowUp/Down 选择，Enter 确认，Escape 关闭 |
| Tabs | ArrowLeft/Right 切换 Tab |
| Menu | ArrowUp/Down 导航，Enter 选择，Escape 关闭 |
| Combobox | 同 Select + 输入过滤 |

**禁止**自行拦截这些组件的键盘事件（如 `onKeyDown` 中吞掉 Escape），除非有明确的替代行为。

### 4.3 焦点管理

- **Dialog 打开时**：焦点自动移至 Dialog 内部，关闭时恢复到触发元素
- **禁止**在 Dialog 内容中使用 `autoFocus` 属性，这可能与 base-ui 的焦点管理冲突
- 如果 Dialog 内有表单，**推荐**将焦点显式设置到第一个输入框：

```tsx
// ✅ 推荐：使用 useEffect + ref 管理焦点
useEffect(() => {
  inputRef.current?.focus();
}, []);
```

### 4.4 屏幕阅读器

**必须**为所有交互元素提供可访问名称：

```tsx
// ✅ 正确：Dialog 关闭按钮有 sr-only 文本
<DialogPrimitive.Close>
  <XIcon />
  <span className="sr-only">Close</span>
</DialogPrimitive.Close>

// ❌ 错误：仅图标无文本，屏幕阅读器无法识别
<DialogPrimitive.Close>
  <XIcon />
</DialogPrimitive.Close>
```

**必须**为表单字段提供 `<label>`：

```tsx
// ✅ 正确：使用 Field 组件自动关联 label 和 control
<Field.Root>
  <Field.Label>邮箱</Field.Label>
  <Field.Control>
    <input type="email" required />
  </Field.Control>
  <Field.Error />
</Field.Root>

// ❌ 错误：无 label 关联（Settings 页面当前存在的问题）
<input type="email" placeholder="请输入邮箱" />
```

### 4.5 表单无障碍

**必须**为表单错误状态提供 aria 属性。使用 base-ui 的 `Field` 组件可自动处理：

```tsx
// ✅ 推荐：Field 自动管理 aria-invalid、aria-describedby
<Field.Root name="email">
  <Field.Label>邮箱</Field.Label>
  <Input />
  <Field.Error>请输入有效的邮箱地址</Field.Error>
</Field.Root>
```

**必须**为 `type="submit"` 的按钮在表单加载失败时显示 `aria-invalid` 反馈：

```tsx
// Field 组件自动设置 data-invalid 属性
// 可通过 Tailwind 的 data-* 变体响应
<Input className="data-invalid:border-destructive data-invalid:ring-destructive/20" />
```

### 4.6 ARIA 角色

**禁止**手动添加 ARIA role 到 base-ui 组件上，组件已内置正确的 role：

```tsx
// ❌ 错误：base-ui Dialog 的 Popup 已有 role="dialog"
<DialogPrimitive.Popup role="dialog" aria-modal="true">

// ✅ 正确：让组件自行管理
<DialogPrimitive.Popup>
```

**例外**：MoodSelector 当前使用 `motion.button` 而非 base-ui 组件，手动设置 `role="radiogroup"` 和 `role="radio"` 是必要的。但**推荐**未来迁移到 base-ui 的 `RadioGroup` 组件。

---

## 5. 表单集成 (Field + Input + Validation)

### 5.1 必须使用 Field 组件包装所有表单字段

base-ui 的 `Field` 提供完整的验证状态管理（dirty、touched、valid、invalid、filled、focused）。**必须**使用它来替代项目中原生的表单输入模式。

```tsx
// ✅ 推荐：完整 Field 模式
import { Field } from "@base-ui/react/field";
import { Input } from "@base-ui/react/input";

<Field.Root name="email" validate={(value) => {
  if (!value) return "邮箱不能为空";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "邮箱格式不正确";
  return null;
}}>
  <Field.Label>邮箱</Field.Label>
  <Input type="email" placeholder="请输入邮箱" />
  <Field.Description>将用于登录和找回密码</Field.Description>
  <Field.Error />
</Field.Root>
```

### 5.2 验证模式

| 模式 | 说明 | 适用场景 |
|------|------|---------|
| `validationMode="onChange"` | 每次值变化时验证 | 实时反馈的简单表单 |
| `validationMode="onBlur"` | 失焦时验证 | 减少干扰的中长表单 |
| `validationMode="onSubmit"` | 提交时验证（默认） | 复杂多步表单 |

```tsx
// ✅ 推荐：实时验证登录表单
<Field.Root name="password" validationMode="onBlur" validate={(value) => {
  if (value.length < 8) return "密码至少需要 8 位";
  return null;
}}>
  <Field.Label>密码</Field.Label>
  <Input type="password" />
  <Field.Error />
</Field.Root>
```

### 5.3 自定义验证函数

`validate` 函数返回 `string | null`（单条错误）或使用 `errors` 数组：

```tsx
// 单条错误消息
<Field.Root validate={(value) => {
  if (!value) return "必填";
  return null;
}}>

// 多条错误（使用 errors prop）
<Field.Root
  validate={(value) => {
    const errors: string[] = [];
    if (value.length < 8) errors.push("密码至少 8 位");
    if (!/[A-Z]/.test(value)) errors.push("需包含大写字母");
    return errors.length ? { errors } : null;
  }}
>
```

### 5.4 状态驱动的样式

Field 自动输出 `data-*` 属性反映状态。**必须**使用这些属性驱动样式，而非自行管理 className：

```tsx
// ✅ 推荐：利用 data-invalid / data-valid / data-dirty
<Input className={cn(
  "border-border data-invalid:border-destructive data-invalid:ring-destructive/20",
  "data-valid:border-green-500"
)} />

// ❌ 错误：自行管理 error className
<Input className={cn(error && "border-red-500")} />
```

### 5.5 Form 组件集成

多个 Field 时**必须**使用 `Form` 组件统一管理提交和验证：

```tsx
// ✅ 推荐：Form + Field 集成
import { Form } from "@base-ui/react/form";
import { Field } from "@base-ui/react/field";
import { Input } from "@base-ui/react/input";

<Form
  onSubmit={(data) => {
    console.log(data); // 自动收集所有 Field 的值
  }}
>
  <Field.Root name="email">
    <Field.Label>邮箱</Field.Label>
    <Input type="email" />
    <Field.Error />
  </Field.Root>

  <Field.Root name="password">
    <Field.Label>密码</Field.Label>
    <Input type="password" />
    <Field.Error />
  </Field.Root>

  <Button type="submit">登录</Button>
</Form>
```

### 5.6 Combobox 用于可搜索选择

当选项超过 10 个或需要搜索功能时，**必须**使用 Combobox 而非原生 Select：

```tsx
// 适用场景举例：
// - 用户选择（超过 10 个用户）
// - 标签/分类选择
// - 任何需要搜索的选择器
```

---

## 6. framer-motion 集成

### 6.1 Dialog 动画

**推荐**使用 base-ui 内置的 `data-open`/`data-closed` 状态属性 + Tailwind `animate-in`/`animate-out` 工具类做 Dialog 动画，而非 framer-motion：

```tsx
// ✅ 推荐：Tailwind 动画（已在 ui/dialog.tsx 中使用）
className={cn(
  "data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95",
  "data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95"
)}
```

当需要更复杂的自定义动画（如自定义入场序列）时，才使用 framer-motion：

```tsx
// ✅ 可接受：复杂动画场景
<DialogPrimitive.Backdrop
  render={
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    />
  }
/>
```

### 6.2 AnimatePresence 与 Dialog

当 Dialog 需要从 DOM 完全卸载时使用 `AnimatePresence`：

```tsx
// ✅ 正确：AnimatePresence 包裹
import { AnimatePresence, motion } from "framer-motion";

<AnimatePresence>
  {isOpen && (
    <Dialog>
      <DialogContent>
        {/* 内容 */}
      </DialogContent>
    </Dialog>
  )}
</AnimatePresence>
```

**注意**：base-ui Dialog 的 `Portal` 组件自行管理 DOM 挂载，**通常不需要**额外的 `AnimatePresence`。仅在需要 exit 动画且 Dialog 完全从 DOM 移除时才使用。

### 6.3 useReducedMotion 必须尊重

**必须**在所有 framer-motion 动画中检查 `useReducedMotion()`，当用户偏好减少动画时禁用动画：

```tsx
// ✅ 正确（已在 MoodSelector 中使用）
const shouldReduceMotion = useReducedMotion();

<motion.button
  whileHover={shouldReduceMotion ? undefined : { scale: 1.15 }}
  whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
  animate={shouldReduceMotion ? undefined : (isSelected ? { scale: 1.2 } : { scale: 1 })}
>
```

### 6.4 JournalInput 中的动画

JournalInput 当前使用 `motion.div` 做入场/出场动画。**推荐**在迁移到 base-ui 组件后保留 `AnimatePresence` 模式：

```tsx
// 当前 JournalInput 的动画模式保持即可
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0, y: 20 }}
  transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
>
```

---

## 7. SSR / Next.js 16 安全

### 7.1 "use client" 指令

base-ui/react 的所有组件内部已标记 `'use client'`。**必须**在以下场景手动添加 `"use client"`：

- 使用 `useState`、`useEffect`、`useRef` 等 hook 的组件
- 使用 framer-motion 动画的组件
- 使用事件处理器（onClick、onChange 等）的组件
- 导入 Zustand store 的组件

```tsx
// ✅ 必须：使用 hook 的组件文件顶部添加
'use client';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
```

### 7.2 RSC 兼容性

**禁止**在 Server Component 中直接导入 base-ui 组件。所有包含交互组件的页面**必须**通过 Client Component 包装：

```tsx
// ✅ 正确：Server Component 页面导入 Client 包装组件
// app/page.tsx（Server Component）
import { JournalInput } from "@/components/journal-input"; // 内部 "use client"

export default function HomePage() {
  return <JournalInput />;
}
```

### 7.3 iOS Safari 注意事项

- **Dialog 内 input 焦点**：iOS Safari 在 `<input>` 获得焦点时会缩放页面。**推荐**在 `<meta name="viewport">` 中设置 `maximum-scale=1`（本项目已在 layout 中配置）
- **100dvh 高度问题**：iOS Safari 的视口高度计算特殊。**推荐**使用 `min-h-screen` 或 `min-h-dvh` 而非 `h-screen`
- **Dialog Backdrop 点击**：base-ui Dialog 的 `disablePointerDismissal` prop 在 iOS 上可能需要显式处理

### 7.4 Next.js 16 兼容性

- base-ui/react v1.3 完全兼容 Next.js 16 App Router
- **禁止**在 `generateStaticParams` 或 `generateMetadata` 等服务端函数中引用 base-ui 组件
- 使用 `next build` 构建时，所有 `"use client"` 组件会被正确分离

---

## 8. 反模式 (Anti-Patterns)

### 8.1 禁止：直接函数渲染（未使用 render prop）

base-ui 组件使用 `render` prop 自定义渲染时，**禁止**传递函数作为 children：

```tsx
// ❌ 错误：函数作为 children（base-ui 不支持）
<DialogPrimitive.Root>
  {({ open }) => <div>{open ? 'open' : 'closed'}</div>}
</DialogPrimitive.Root>

// ✅ 正确：使用 render prop
<DialogPrimitive.Close
  render={<Button variant="ghost" />}
>
  <XIcon />
  <span className="sr-only">Close</span>
</DialogPrimitive.Close>
```

### 8.2 禁止：缺少可访问名称的图标按钮

```tsx
// ❌ 错误：仅图标，屏幕阅读器无法识别
<button type="button">
  <XIcon />
</button>

// ✅ 正确：sr-only 文本
<button type="button">
  <XIcon />
  <span className="sr-only">关闭</span>
</button>
```

### 8.3 禁止：混合多个 UI 库

**禁止**在同一项目中混用 base-ui 和其他 UI 库（如 Radix UI、Headless UI）。本项目已统一使用 `@base-ui/react`。

### 8.4 禁止：过度包装

**禁止**在已有 base-ui 封装的层级外再包一层无意义的 div：

```tsx
// ❌ 错误：过度包装
<div>
  <DialogPrimitive.Root>
    <div>
      <DialogPrimitive.Popup>
        {/* 内容 */}
      </DialogPrimitive.Popup>
    </div>
  </DialogPrimitive.Root>
</div>

// ✅ 正确：直接嵌套
<DialogPrimitive.Root>
  <DialogPrimitive.Portal>
    <DialogPrimitive.Backdrop />
    <DialogPrimitive.Popup>
      {/* 内容 */}
    </DialogPrimitive.Popup>
  </DialogPrimitive.Portal>
</DialogPrimitive.Root>
```

### 8.5 必须：Button 指定 type 属性

所有 `<button>` 元素 **必须** 显式指定 `type` 属性，防止在表单中意外触发提交：

```tsx
// ✅ 必须：显式 type
<button type="button" onClick={() => setShowDeleteConfirm(true)}>
  删除账户
</button>

<button type="submit">保存</button>

// ❌ 错误：缺少 type（在 form 中默认为 type="submit"）
<button onClick={() => setShowDeleteConfirm(true)}>
  删除账户
</button>
```

**注意**：Settings 页面（第 281、325、340、349、363、409、418 行）和 Auth 页面（第 102、113、185、198、229 行）中的 `<button>` 已正确设置 `type="button"`。Auth 页面的 submit 按钮（第 173 行）已正确设置 `type="submit"`。继续保持。

### 8.6 禁止：在 base-ui 组件上手动设置 role/aria-*

```tsx
// ❌ 错误：手动覆盖 ARIA 属性
<DialogPrimitive.Popup role="alertdialog" aria-modal="true">

// ✅ 正确：让组件自行管理
<DialogPrimitive.Popup>
```

### 8.7 禁止：忽略 disabled 状态的视觉反馈

```tsx
// ❌ 错误：disabled 但无视觉反馈
<button disabled={saving} onClick={handleSave}>保存</button>

// ✅ 正确：使用 Tailwind 的 disabled: 变体
<button
  disabled={saving}
  className="transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
>
  保存
</button>
```

### 8.8 禁止：在 Dialog 内使用原生 modal 元素

**禁止**在 Dialog 内部再创建 `<dialog>` 元素或嵌套其他 modal。需要嵌套弹窗时使用 base-ui 的嵌套 Dialog 支持（`DialogPrimitive.Root` 自动处理嵌套）。

---

## 9. CVA 集成与设计令牌

### 9.1 必须使用 CVA 定义组件变体

所有 UI 组件**必须**使用 `class-variance-authority` (CVA) 定义变体，而非在 className 中写条件逻辑。

```tsx
// ✅ 推荐：CVA 定义按钮变体
import { cva, type VariantProps } from "class-variance-authority";

const buttonVariants = cva(
  "inline-flex shrink-0 items-center justify-center rounded-lg border border-transparent text-sm font-medium transition-all outline-none select-none focus-visible:ring-3 disabled:pointer-events-none disabled:opacity-50",
  {
    variants: {
      variant: {
        default: "bg-primary text-primary-foreground hover:bg-primary/80",
        outline: "border-border bg-background hover:bg-muted",
        ghost: "hover:bg-muted",
        destructive: "bg-destructive/10 text-destructive hover:bg-destructive/20",
        link: "text-primary underline-offset-4 hover:underline",
      },
      size: {
        default: "h-8 px-2.5",
        sm: "h-7 px-2.5 text-[0.8rem]",
        lg: "h-9 px-2.5",
        icon: "size-8",
        "icon-sm": "size-7",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

function Button({ className, variant, size, ...props }: ButtonPrimitive.Props & VariantProps<typeof buttonVariants>) {
  return <ButtonPrimitive className={cn(buttonVariants({ variant, size, className }))} {...props} />;
}
```

### 9.2 禁止：条件 className 逻辑

```tsx
// ❌ 错误：条件 className
<button className={`px-4 py-2 ${variant === 'destructive' ? 'bg-red-500' : 'bg-blue-500'}`} />

// ✅ 正确：CVA 变体
const buttonVariants = cva("px-4 py-2", {
  variants: {
    variant: {
      default: "bg-blue-500",
      destructive: "bg-red-500",
    },
  },
});
```

### 9.3 变体导出

**必须**导出 CVA 实例以便外部复用：

```tsx
// ✅ 必须：导出变体供其他组件使用
export { Button, buttonVariants };

// 其他组件可复用
import { buttonVariants } from "@/components/ui/button";
const linkVariants = buttonVariants; // 复用按钮变体
```

### 9.4 设计令牌优先级

CVA 变体中使用的颜色、间距、圆角等 **必须** 引用 Tailwind 设计令牌（CSS 变量），而非硬编码值：

```tsx
// ✅ 推荐
"default: bg-primary text-primary-foreground"
"outline: border-border bg-background"

// ❌ 错误
"default: bg-[#D4856A] text-white"
```

**注意**：Settings 和 Auth 页面中大量使用硬编码色值（`bg-[#FDF8F5]`、`text-[#3D3D3D]`、`bg-[#D4856A]` 等），**应逐步迁移到 CSS 变量**。

---

## 10. Code Review 检查清单

在提交包含 base-ui/react 组件的 PR 前，**必须**逐项检查：

### 导入和架构

- [ ] 从子路径导入（`@base-ui/react/dialog`）而非根路径
- [ ] 使用 `as XxxPrimitive` 别名避免命名冲突
- [ ] 业务组件通过 `src/components/ui/` 中间层使用 base-ui
- [ ] 使用 hook 的文件顶部有 `"use client"` 指令

### 样式

- [ ] className 合并使用 `cn()` 函数
- [ ] 变体使用 CVA 定义，无条件 className 逻辑
- [ ] 使用 CSS 变量（`bg-primary`）而非硬编码色值（`bg-[#D4856A]`）
- [ ] 利用 `data-*` 属性驱动状态样式（`data-invalid:`、`data-open:`）
- [ ] 响应式断点使用 Tailwind 前缀（`sm:`、`md:`）

### 无障碍

- [ ] 所有图标按钮有 `sr-only` 文本
- [ ] 表单字段有 `<label>` 关联（推荐通过 `Field` 组件）
- [ ] 未手动覆盖 base-ui 组件的 ARIA 属性
- [ ] Dialog/Select/Menu 的键盘导航未被破坏
- [ ] `useReducedMotion()` 在 framer-motion 动画中被尊重

### 表单

- [ ] 表单字段使用 `Field.Root` + `Field.Control` + `Field.Error`
- [ ] 验证函数 `validate` 返回 `string | null` 或 `{ errors: string[] }`
- [ ] `validationMode` 根据 UX 需求正确设置
- [ ] 多个字段使用 `Form` 组件管理提交
- [ ] 按钮显式指定 `type="button"` 或 `type="submit"`

### 动画

- [ ] Dialog 动画优先使用 Tailwind `data-open:`/`data-closed:` 变体
- [ ] framer-motion 的 `whileHover`/`whileTap`/`animate` 检查 `useReducedMotion()`
- [ ] `AnimatePresence` 仅在组件需要从 DOM 完全卸载时使用

### 反模式

- [ ] 无函数作为 children 传递给 base-ui Compound Component
- [ ] 无嵌套的无意义 div 包装
- [ ] 无混用其他 UI 库（Radix、Headless UI 等）
- [ ] `disabled` 状态有视觉反馈（`disabled:opacity-40`）
- [ ] 不在 Dialog 内使用原生 `<dialog>` 元素

### 项目特定

- [ ] Settings 页面的删除确认弹窗已迁移到 Dialog 组件（或已有 issue 跟踪）
- [ ] Auth 表单已迁移到 Field + Form 模式（或已有 issue 跟踪）
- [ ] MoodSelector 考虑迁移到 base-ui RadioGroup（或已有 issue 跟踪）
- [ ] 新增组件遵循 `data-slot` 命名约定（如 `data-slot="dialog"`）

---

## 参考资料

| 来源 | 链接 |
|------|------|
| Base UI 官方文档 | https://base-ui.com |
| Dialog 组件文档 | https://base-ui.com/react/components/dialog |
| Button 组件文档 | https://base-ui.com/react/components/button |
| Field 组件文档 | https://base-ui.com/react/components/field |
| Form 组件文档 | https://base-ui.com/react/components/form |
| Select 组件文档 | https://base-ui.com/react/components/select |
| Tabs 组件文档 | https://base-ui.com/react/components/tabs |
| Menu 组件文档 | https://base-ui.com/react/components/menu |
| Combobox 组件文档 | https://base-ui.com/react/components/combobox |
| Input 组件文档 | https://base-ui.com/react/components/input |
| GitHub 仓库 | https://github.com/mui/base-ui |
| npm 包 | https://www.npmjs.com/package/@base-ui/react |
