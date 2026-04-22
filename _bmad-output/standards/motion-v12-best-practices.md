# Motion (framer-motion v12) 编码标准

> **适用版本**: motion >= 12.x (由 `framer-motion` 重命名而来)
> **项目**: Xiaozhi Journal (Next.js 16 + React 19)
> **创建日期**: 2026-04-22

---

## 目录

1. [包迁移与导入规范](#1-包迁移与导入规范)
2. [AnimatePresence 模式](#2-animatepresence-模式)
3. [Layout 动画](#3-layout-动画)
4. [性能规则](#4-性能规则)
5. [Gestures (手势)](#5-gestures-手势)
6. [SSR 安全](#6-ssr-安全)
7. [Reduced Motion 无障碍](#7-reduced-motion-无障碍)
8. [Next.js 16 集成](#8-nextjs-16-集成)
9. [反模式清单](#9-反模式清单)
10. [Code Review 检查清单](#10-code-review-检查清单)

---

## 1. 包迁移与导入规范

### 1.1 必须从 `motion/react` 导入，禁止继续使用 `framer-motion`

framer-motion v12 已将包名从 `framer-motion` 更改为 `motion`。React 专用的导入路径是 `motion/react`。

**禁止** (旧路径，将被废弃):
```tsx
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
```

**推荐** (新路径):
```tsx
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
```

### 1.2 必须统一导入来源，禁止混用

同一文件中所有 motion 相关的导入必须来自同一个包 `motion/react`。

**禁止**:
```tsx
import { motion } from 'motion/react';
import { AnimatePresence } from 'framer-motion'; // 混用旧包
```

### 1.3 推荐按需导入

仅导入实际使用的 API，不要全量导入。

```tsx
// 仅需要 motion 和 useReducedMotion
import { motion, useReducedMotion } from 'motion/react';

// 需要 AnimatePresence
import { motion, AnimatePresence } from 'motion/react';
```

### 1.4 迁移命令

```bash
# 卸载旧包，安装新包
npm uninstall framer-motion
npm install motion
```

然后在所有源文件中执行替换:
```
from 'framer-motion'  =>  from 'motion/react'
```

**项目现状**: 当前有 **15 个文件** 仍使用 `framer-motion` 旧路径，迁移时必须全部更新。

---

## 2. AnimatePresence 模式

### 2.1 AnimatePresence 必须包裹在条件渲染的外层

`AnimatePresence` 必须包裹需要 exit 动画的组件，且必须在条件判断的 **外层**。

**禁止** (AnimatePresence 放在条件内部):
```tsx
{showSuccess && (
  <AnimatePresence>
    <motion.div exit={{ opacity: 0 }}>成功</motion.div>
  </AnimatePresence>
)}
```

**推荐** (AnimatePresence 在外层):
```tsx
<AnimatePresence>
  {showSuccess && (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
    >
      成功
    </motion.div>
  )}
</AnimatePresence>
```

> **实际案例**: `JournalInput` 组件 (src/components/journal-input.tsx) 的做法是正确的——`AnimatePresence` 包裹了 `showSuccess` 和 `showOfflineMsg` 两个条件分支。

### 2.2 列表或条件渲染的动画子元素必须提供稳定且唯一的 key

当 `AnimatePresence` 内部的子元素依赖条件渲染或列表渲染时，**必须** 提供 `key` 属性。key 变化才会触发出入场动画。

**禁止** (使用 index 作为 key):
```tsx
<AnimatePresence>
  {items.map((item, i) => (
    <motion.div key={i}>{item.name}</motion.div>
  ))}
</AnimatePresence>
```

**推荐** (使用业务唯一 ID):
```tsx
<AnimatePresence>
  {items.map((item) => (
    <motion.div key={item.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      {item.name}
    </motion.div>
  ))}
</AnimatePresence>
```

> **实际案例**: 主页面 (src/app/page.tsx) 中 `JournalInput` 使用 `key={selectedMood}` 切换心情时重新挂载组件，触发 slide-in 动画——这是正确用法。

### 2.3 推荐使用 `mode` 控制动画顺序

`AnimatePresence` 支持 `mode` 属性控制进出动画的顺序:

- `mode="sync"` (默认): 进出动画同时执行
- `mode="wait"`: 先执行 exit 动画，再执行 enter 动画
- `mode="popLayout"`: 退出元素从布局中移除

**推荐**: 页面级过渡动画使用 `mode="wait"`，避免新旧内容同时出现。

```tsx
<AnimatePresence mode="wait">
  {currentTab === 'write' ? (
    <motion.div key="write" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <JournalInput />
    </motion.div>
  ) : (
    <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
      <JournalHistory />
    </motion.div>
  )}
</AnimatePresence>
```

### 2.4 onExitComplete 用于后续操作

当 exit 动画完成后需要执行操作时，使用 `onExitComplete` 回调。

```tsx
<AnimatePresence onExitComplete={() => router.push('/history')}>
  {showModal && <Modal onClose={() => setShowModal(false)} />}
</AnimatePresence>
```

> **实际案例**: `JournalInput` 在保存成功后通过 `setTimeout` 延迟调用 `onExitComplete()`，让用户短暂看到成功消息——这是合理的时序控制。但注意 `setTimeout` 不应硬编码动画时长，推荐从 `transition.duration` 派生。

---

## 3. Layout 动画

### 3.1 使用 `layout` prop 实现元素尺寸变化的平滑动画

当元素尺寸或位置因内容变化而改变时，使用 `layout` prop 而非手动计算。

**推荐** (自动布局动画):
```tsx
<motion.textarea
  layout
  value={content}
  onChange={(e) => setContent(e.target.value)}
/>
```

> **项目现状**: `JournalInput` 的 textarea auto-resize 目前通过 `textarea.style.height` 手动实现。推荐保留现有实现（因为需要 `maxHeight` 限制），但若其他地方有纯尺寸变化场景，应优先使用 `layout`。

### 3.2 `layoutId` 用于共享元素动画

当同一个元素在不同页面/组件间需要平滑过渡时，使用 `layoutId`。

```tsx
// 列表页
<motion.div layoutId={`journal-${id}`} onClick={() => select(id)}>
  <JournalCard />
</motion.div>

// 详情页
<motion.div layoutId={`journal-${id}`}>
  <JournalDetail />
</motion.div>
```

> **项目机会**: 历史记录列表 -> 日记详情 (`/history` -> `/history/[id]`) 可以使用 `layoutId` 实现卡片展开动画。

### 3.3 使用 `layout="position"` 或 `layout="size"` 精细控制

- `layout="position"`: 仅动画位置变化
- `layout="size"`: 仅动画尺寸变化
- `layout` (等同于 `"layout"`): 位置和尺寸都动画

**推荐**: 仅需要尺寸变化时使用 `layout="size"`，减少不必要的布局计算。

### 3.4 FLIP 动画性能注意事项

`layout` prop 内部使用 FLIP 技术。当页面有多个同时变化的元素时，性能可能下降。

**推荐**: 同一父容器内超过 10 个 `layout` 元素时，考虑改用 CSS 过渡或减少 layout 元素数量。

---

## 4. 性能规则

### 4.1 必须优先使用 transform 和 opacity

GPU 加速的 CSS 属性只有 `transform` 和 `opacity`。其他属性（width, height, top, left 等）会触发重排（reflow）。

**禁止** (触发重排):
```tsx
<motion.div animate={{ width: 200, height: 100 }} />
```

**推荐** (GPU 加速):
```tsx
<motion.div animate={{ scale: 1.2, opacity: 0.8 }} />
```

### 4.2 高频更新必须使用 MotionValue + useTransform

对于滚动、鼠标跟随等高频更新场景，**禁止** 使用 `useState` + `animate`，**必须** 使用 `useMotionValue`。

**禁止** (每帧触发 React re-render):
```tsx
const [x, setX] = useState(0);
onMouseMove={(e) => setX(e.clientX)};
<motion.div style={{ x }} />
```

**推荐** (零 React re-render):
```tsx
import { useMotionValue, useTransform } from 'motion/react';

const x = useMotionValue(0);
const opacity = useTransform(x, [0, 300], [0, 1]);
onMouseMove={(e) => x.set(e.clientX)};
<motion.div style={{ x, opacity }} />
```

### 4.3 推荐设置合理的 transition 类型

不同场景推荐不同的 transition 类型:

| 场景 | 类型 | 理由 |
|------|------|------|
| hover/tap 微交互 | `tween` | 即时响应，无回弹 |
| 入场/出场动画 | `tween` (easeOut) | 简洁干脆 |
| 选中/仪式感动画 | `spring` | 有弹性的仪式感 |
| 布局变化 | `spring` (stiffness >= 300) | 快速稳定 |
| 页面过渡 | `tween` (duration 0.2-0.3s) | 不拖沓 |

> **实际案例**: `MoodSelector` 中 hover/tap 使用 `tween`（duration 0.12s/0.08s），选中使用 `spring`（stiffness 400, damping 25）——这是正确的分层策略。

### 4.4 禁止在循环中使用 delay 递增

**禁止** (列表越长动画越慢):
```tsx
items.map((item, i) => (
  <motion.div
    initial={{ opacity: 0 }}
    animate={{ opacity: 1 }}
    transition={{ delay: i * 0.1 }} // 第100项要延迟10秒
  />
))
```

**推荐** (使用 staggerChildren):
```tsx
<motion.div
  initial="hidden"
  animate="visible"
  variants={{
    visible: { transition: { staggerChildren: 0.05, staggerDirection: 1 } }
  }}
>
  {items.map((item) => (
    <motion.div variants={{ hidden: { opacity: 0 }, visible: { opacity: 1 } }} />
  ))}
</motion.div>
```

### 4.5 推荐限制动画时长

- 微交互 (hover, tap): 0.08s - 0.15s
- 入场/出场: 0.2s - 0.35s
- 页面过渡: 0.25s - 0.4s
- 复杂序列动画: 单步不超过 0.6s

**禁止** 超过 1s 的单步动画（除非有明确的设计意图）。

---

## 5. Gestures (手势)

### 5.1 必须使用 whileHover / whileTap 替代 onMouseEnter/onClick 动画

**禁止**:
```tsx
const [hovered, setHovered] = useState(false);
<motion.div
  onMouseEnter={() => setHovered(true)}
  onMouseLeave={() => setHovered(false)}
  animate={hovered ? { scale: 1.05 } : { scale: 1 }}
/>
```

**推荐**:
```tsx
<motion.div whileHover={{ scale: 1.05 }} />
```

> **实际案例**: `MoodSelector` 中 emoji 按钮使用 `whileHover` 和 `whileTap`——正确。

### 5.2 whileTap 推荐用于按钮的按压反馈

所有可交互按钮都应提供 `whileTap` 反馈，增强触感。

```tsx
<motion.button whileTap={{ scale: 0.95 }}>
  记下来
</motion.button>
```

> **实际案例**: `JournalInput` 的保存按钮使用了 `whileTap={{ scale: 0.95 }}`——正确。

### 5.3 drag 必须限制边界和方向

使用 `drag` 时，**必须** 指定 `dragConstraints` 或 `dragMomentum={false}` 防止元素飞出屏幕。

```tsx
<motion.div
  drag="x"
  dragConstraints={{ left: 0, right: 300 }}
  dragElastic={0.2}
  dragMomentum={false}
/>
```

### 5.4 移动端必须考虑触摸体验

- `whileTap` 在触摸设备上自动工作
- `whileHover` 在触摸设备上不触发——不要将关键信息仅放在 hover 状态中
- 触摸目标的 `whileTap` 缩放不宜过大 (0.95-0.97 为宜)
- 推荐添加 `style={{ touchAction: 'manipulation' }}` 优化触摸响应

### 5.5 手势事件推荐配合 useReducedMotion

当用户开启 reduced motion 时，手势动画应降级或取消。

```tsx
const shouldReduceMotion = useReducedMotion();

<motion.button
  whileHover={shouldReduceMotion ? undefined : { scale: 1.05 }}
  whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
>
  按钮
</motion.button>
```

> **实际案例**: `MoodSelector` 和 `JournalInput` 均正确使用 `shouldReduceMotion` 来条件化动画——正确。

---

## 6. SSR 安全

### 6.1 所有使用 motion 的组件必须标记 'use client'

**必须**: 任何导入 `motion/react` 的组件文件首行必须包含 `'use client'` 指令。

```tsx
'use client';

import { motion } from 'motion/react';

export function MyComponent() { ... }
```

> **项目现状**: 所有使用 motion 的 15 个组件文件均已正确添加 `'use client'`。

### 6.2 禁止在 Server Component 中导入 motion/react

**禁止** 在页面组件（未标记 `'use client'` 的文件）中导入 `motion/react`。

如果需要在 Server Component 中嵌入动画，必须将动画部分抽取为独立的 Client Component。

### 6.3 动态导入用于避免 hydration 不匹配

当动画依赖浏览器 API（如 `window.innerWidth`）时，推荐动态导入:

```tsx
const MotionComponent = dynamic(() => import('./motion-part'), { ssr: false });
```

### 6.4 禁止在 initial 中使用运行时计算值（除非有 fallback）

`initial` 值在服务端和客户端必须一致，否则会产生 hydration 闪烁。

**禁止**:
```tsx
<motion.div initial={{ x: window.innerWidth }} /> // SSR 时 window 不存在
```

**推荐**:
```tsx
const [isClient, setIsClient] = useState(false);
useEffect(() => setIsClient(true), []);

<motion.div initial={isClient ? { x: window.innerWidth } : { x: 0 }} />
```

或者使用 `'use client'` 确保只在客户端渲染。

---

## 7. Reduced Motion 无障碍

### 7.1 必须支持 prefers-reduced-motion

所有包含动画的交互组件 **必须** 检测并尊重 `prefers-reduced-motion` 媒体查询。

**推荐**: 使用 `useReducedMotion` hook:

```tsx
import { motion, useReducedMotion } from 'motion/react';

const shouldReduceMotion = useReducedMotion();

<motion.div
  initial={shouldReduceMotion ? undefined : { opacity: 0 }}
  animate={shouldReduceMotion ? undefined : { opacity: 1 }}
>
```

> **实际案例**: `JournalInput` 和 `MoodSelector` 正确使用 `useReducedMotion`——正确。
>
> **问题**: `GoldenQuote` 使用 `useState` + `window.matchMedia` 手动检测——虽然可行，但应统一改为 `useReducedMotion` hook。

### 7.2 Reduced motion 时的降级策略

| 动画类型 | 正常行为 | Reduced motion |
|----------|----------|----------------|
| 入场/出场 | 滑入 + 淡入 | 直接显示 (opacity: 1) |
| hover | 放大 1.05x | 禁用 |
| tap | 缩小 0.95x | 禁用 |
| 布局变化 | FLIP 动画 | 瞬间跳转 |
| 序列动画 | stagger 逐个出现 | 同时显示 |

### 7.3 禁止完全禁用动画（除非用户明确要求）

`useReducedMotion` 返回 `true` 时，推荐设置 `initial={undefined}` 而不是移除 `motion.div`。这样元素会直接出现在最终状态，而不是完全不渲染。

```tsx
// 推荐: 元素立即可见，无动画
<motion.div initial={shouldReduceMotion ? undefined : { opacity: 0 }} animate={{ opacity: 1 }} />

// 禁止: 元素在 reduced motion 时不出现
{!shouldReduceMotion && <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} />}
```

### 7.4 EmotionChart SVG 动画的特殊处理

SVG 的 `motion.polyline` 使用 `pathLength` 动画，在 reduced motion 时应跳过动画直接显示完整线条。

```tsx
<motion.polyline
  initial={shouldReduceMotion ? undefined : { pathLength: 0 }}
  animate={{ pathLength: 1 }}
  transition={{ duration: 0.8 }}
/>
```

> **项目现状**: `EmotionChart` 目前未处理 reduced motion——需要在后续迭代中补充。

---

## 8. Next.js 16 集成

### 8.1 页面过渡动画使用 template.tsx

Next.js 16 支持 `template.tsx` 实现页面级过渡动画。

**推荐**: 在项目根目录创建 `src/app/template.tsx`:

```tsx
'use client';

import { AnimatePresence } from 'motion/react';
import { usePathname } from 'next/navigation';

export default function Template({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -8 }}
        transition={{ duration: 0.2, ease: 'easeOut' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
```

> **项目现状**: 当前未使用 `template.tsx`，页面间无过渡动画。推荐在 Epic 后续迭代中添加。

### 8.2 Turbopack 兼容性

motion 包与 Next.js 16 的 Turbopack 完全兼容。如果遇到模块解析错误，确保:

```js
// next.config.ts
const nextConfig = {
  // motion 需要 react 导出，确保 Turbopack 正确处理
  serverExternalPackages: ['motion'], // 如有需要
};
```

### 8.3 禁止在 Server Component 路由处理器中使用 motion

`route.ts` (API 路由) 中永远不需要 motion，禁止导入。

### 8.4 bfcache 与动画的兼容

当用户使用浏览器的前进/后退按钮时，bfcache 可能恢复带有未完成动画的页面。

> **项目现状**: `BfcacheHandler` 组件 (src/components/bfcache-handler.tsx) 通过 `pageshow` 事件检测 bfcache 恢复并强制 reload——这是正确的处理方式。确保动画组件在 bfcache 恢复时不会产生视觉异常。

---

## 9. 反模式清单

### 9.1 禁止: AnimatePresence 条件渲染位置错误

```tsx
// 错误: 条件在 AnimatePresence 外面，exit 动画永远不会执行
{showModal && (
  <AnimatePresence>
    <Modal exit={{ opacity: 0 }} />
  </AnimatePresence>
)}

// 正确: 条件在里面
<AnimatePresence>
  {showModal && <Modal initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />}
</AnimatePresence>
```

### 9.2 禁止: 嵌套 AnimatePresence

```tsx
// 错误: 嵌套会导致 exit 时机混乱
<AnimatePresence>
  <AnimatePresence>
    {child && <motion.div exit={{ opacity: 0 }} />}
  </AnimatePresence>
</AnimatePresence>

// 正确: 扁平化结构
<AnimatePresence>
  {parent && (
    <div>
      {child && <motion.div exit={{ opacity: 0 }} />}
    </div>
  )}
</AnimatePresence>
```

### 9.3 禁止: 使用 animate prop 做 hover/tap 效果

```tsx
// 错误: animate 会持续对比状态，浪费性能
const [hovered, setHovered] = useState(false);
<motion.div
  onMouseEnter={() => setHovered(true)}
  onMouseLeave={() => setHovered(false)}
  animate={hovered ? { scale: 1.05 } : { scale: 1 }}
/>

// 正确: 使用 whileHover
<motion.div whileHover={{ scale: 1.05 }} />
```

### 9.4 禁止: 非 transform/opacity 属性的频繁动画

```tsx
// 错误: padding、borderColor 动画触发重排
<motion.div animate={{ padding: 20, borderColor: 'red' }} />

// 正确: 仅 transform 和 opacity
<motion.div animate={{ scale: 1.1 }} style={{ borderColor: 'red' }} />
```

### 9.5 禁止: 在 motion 组件上使用 className 覆盖 transform

```tsx
// 错误: className 中的 transform 会与 motion 的 transform 冲突
<motion.div animate={{ x: 100 }} className="translate-x-10" />

// 正确: 让 motion 控制 transform
<motion.div animate={{ x: 100 }} />
```

### 9.6 禁止: GoldenQuote 翻转过渡使用 animate prop

> **项目问题**: `GoldenQuote` (src/components/golden-quote.tsx) 使用 `animate` prop + 条件判断控制 `rotateY`。虽然功能正确，但 `rotateY` 属于 transform，motion 处理时需注意:

```tsx
// 当前代码: 可行但可以改进
<motion.div
  animate={!reducedMotion ? (flipped ? { rotateY: 180 } : { rotateY: 0 }) : { opacity: 1 }}
  transition={{ duration: 0.7, ease: 'easeOut' }}
/>
```

**推荐**: 翻转动画使用 `style` 属性 + CSS transition 替代方案，或者使用 `motion` 但确保 `transformStyle: 'preserve-3d'` 和 `backfaceVisibility: 'hidden'` 在样式中正确设置——当前代码已正确设置。

### 9.7 禁止: 缺少 key 的动态子元素

```tsx
// 错误: 无 key，motion 无法区分新旧元素
<AnimatePresence>
  {tab === 'a' ? <PanelA /> : <PanelB />}
</AnimatePresence>

// 正确: 必须提供 key
<AnimatePresence mode="wait">
  {tab === 'a' ? (
    <motion.div key="a"><PanelA /></motion.div>
  ) : (
    <motion.div key="b"><PanelB /></motion.div>
  )}
</AnimatePresence>
```

---

## 10. Code Review 检查清单

在合并包含 motion 相关代码的 PR 前，逐项确认:

### 导入与配置

- [ ] 所有 motion 导入来自 `motion/react`（非 `framer-motion`）
- [ ] 使用 motion 的文件包含 `'use client'` 指令
- [ ] 仅导入实际需要的 API（无全量导入）
- [ ] Server Component 中未导入 `motion/react`

### AnimatePresence

- [ ] `AnimatePresence` 在条件渲染的外层
- [ ] 所有动态子元素有稳定且唯一的 `key`
- [ ] 每个子元素都有 `initial`, `animate`, `exit` 三件套
- [ ] 没有嵌套 `AnimatePresence`

### 性能

- [ ] 动画仅使用 `transform` 和 `opacity`（无 width/height/top/left）
- [ ] 高频更新场景使用 `useMotionValue`（非 `useState`）
- [ ] transition 类型和时长合理（无过长动画）
- [ ] 循环列表未使用递增 `delay`
- [ ] className 中无与 motion 冲突的 `transform`

### Gestures

- [ ] hover/tap 使用 `whileHover`/`whileTap`（非 `useState` + `animate`）
- [ ] `drag` 设置了边界约束
- [ ] 移动端触摸目标有合适的 `whileTap` 反馈

### 无障碍

- [ ] 所有交互组件支持 `useReducedMotion`
- [ ] `prefers-reduced-motion` 时动画降级为即时显示
- [ ] 关键信息不依赖 hover 状态（移动端可见）

### SSR/Hydration

- [ ] `initial` 值在 SSR 和 CSR 一致
- [ ] 依赖浏览器 API 的值有 fallback 或使用动态导入
- [ ] 无 hydration 不匹配警告

### Next.js 集成

- [ ] 页面级过渡考虑使用 `template.tsx`
- [ ] Turbopack 下无模块解析错误
- [ ] bfcache 恢复时无动画异常

---

## 附录: 项目组件动画速查表

| 组件 | 动画类型 | 当前状态 | 注意事项 |
|------|----------|----------|----------|
| `JournalInput` | slide-in/out + fade | 良好 | 使用 `useReducedMotion` 正确 |
| `MoodSelector` | hover scale + tap scale + selected spring | 良好 | tween/spring 分层策略正确 |
| `GoldenQuote` | 3D flip (rotateY) + toast fade | 可接受 | reduced motion 使用手动检测，应改用 `useReducedMotion` |
| `EmotionChart` | polyline draw + circle scale | 需改进 | 缺少 `useReducedMotion` 支持 |
| `CapsulePopup` | overlay fade + dialog scale | 良好 | 基本模式正确 |
| `EmotionTooltip` | fade in/out | 需确认 | 检查 AnimatePresence 模式 |
| `XiaozhiBubble` | typewriter + fade | 需确认 | 检查 reduced motion |
| `TypingIndicator` | dot bounce | 需确认 | 检查 reduced motion |
| `EmptyState` | fade in | 需确认 | 简单场景 |
| `Typewriter` | text reveal | 需确认 | 检查 reduced motion |
| 主页面 | `AnimatePresence` 包裹 `JournalInput` | 良好 | `key={selectedMood}` 正确 |
| 页面过渡 | 未实现 | 待添加 | 推荐使用 `template.tsx` |
