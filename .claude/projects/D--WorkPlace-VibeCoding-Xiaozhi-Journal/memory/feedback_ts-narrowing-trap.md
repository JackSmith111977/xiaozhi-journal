---
name: TypeScript 类型收窄陷阱 — if-return 后的字符串字面量
description: 在 if (x === 'a') return 后，x 被收窄排除 'a'，导致后续 if (x === 'b') 报 TS2367
type: feedback
---

**Rule:** 当同一个 union 类型变量在多个 if-return 分支中被检查时，后续分支中对该变量的比较会触发 TS2367 错误（类型不相交）。

**Why:** TypeScript 的控制流分析会在每个 return 后收窄类型，这不是 bug 而是类型系统正确行为。

**How to apply:**
- 遇到此问题时，提取渲染逻辑为独立子组件（如 `ModeToggle`），子组件接收完整 union 类型变量
- 不要用 `as` 类型断言绕过 — 子组件是正确解法
- 示例：`mode: 'register' | 'login' | 'reset'`，在 `if (mode === 'register') return` 后，`mode` 变为 `'login' | 'reset'`，此时 `mode === 'register'` 永远为 false
