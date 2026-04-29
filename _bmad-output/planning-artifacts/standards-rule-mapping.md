# Standards 规则映射分析

> 生成日期: 2026-04-29
> 目的: 系统化分析 standards/ 所有文件，确定哪些规则可自动检测

---

## 规则检测方式分类

| 方式 | 说明 | 工具 |
|------|------|------|
| **eslint** | 可通过 eslint 规则检测 | eslint.config.mjs |
| **tsconfig** | 可通过 TypeScript 编译选项检测 | tsconfig.json |
| **文件检测** | 文件存在/不存在检测 | 脚本或 CI |
| **code review** | 无法自动检测，需人工审查 | Code Review Checklist |

---

## 1. TypeScript 5 (typescript-5-best-practices.md)

### 已配置

| 规则 | 检测方式 | 配置状态 |
|------|---------|---------|
| `noUncheckedIndexedAccess` | tsconfig | ✅ 已配置 |
| `verbatimModuleSyntax` | tsconfig | ✅ 已配置 |
| 禁止 `any` | eslint `@typescript-eslint/no-explicit-any` | ✅ 已配置 |
| 禁止 `@ts-ignore` | eslint `@typescript-eslint/ban-ts-comment` | ✅ 已配置 |

### 回滚

| 规则 | 检测方式 | 状态 | 原因 |
|------|---------|------|------|
| `exactOptionalPropertyTypes` | tsconfig | ❌ 回滚 | framer-motion 类型不兼容 |

### Code Review

| 规则 | 说明 |
|------|------|
| 禁止 `as` 断言滥用 | 仅允许已知安全场景 |
| 禁止循环类型引用 | 无法自动检测 |
| 泛型嵌套不超过3层 | 无法自动检测 |
| 使用 `satisfies` 运算符 | 无法强制检测 |

---

## 2. React 19 (react-19-best-practices.md)

### eslint 可配置

| 规则 | eslint 规则 | 状态 |
|------|------------|------|
| 禁止 `forwardRef` | 无现成规则，需自定义 | ❌ 无法配置 |
| 禁止 `propTypes` | `react/no-deprecated-props` (不存在) | ❌ 规则不存在 |
| `"use client"` 指令 | 无法 lint 检测 | ❌ 无法配置 |

### Code Review

| 规则 | 说明 |
|------|------|
| Server/Client 边界正确 | 无法自动检测 |
| `useFormStatus` 在子组件调用 | 无法自动检测 |
| `useActionState` 不抛异常 | 无法自动检测 |
| `use()` 不在 try-catch 中 | 无法自动检测 |

---

## 3. Next.js 16 (nextjs-16-best-practices.md)

### Code Review

| 规则 | 说明 |
|------|------|
| `params`/`searchParams` 必须 `await` | 无法 lint 检测 |
| `proxy.ts` 替代 `middleware.ts` | 文件检测 |
| Route Handler 验证认证 | 无法 lint 检测 |
| 错误信息不泄露内部细节 | 无法 lint 检测 |
| Server Actions 输入验证 | 无法 lint 检测 |

### 文件检测

| 规则 | 检测方式 |
|------|---------|
| `middleware.ts` 不应存在 | CI 检查文件 |
| `error.tsx` 必须存在 | CI 检查文件 |

---

## 4. Zustand v5 (zustand-v5-best-practices.md)

### Code Review

| 规则 | 说明 |
|------|------|
| 禁止跨 store import | 无法 lint 检测，需自定义 eslint plugin |
| 禁止 module-level 可变状态 | 无法 lint 检测 |
| 异步 Action AbortController | 无法 lint 检测 |
| `create<T>()` curried 泛型 | 无法 lint 检测 |
| 禁止直接修改 state | 无法 lint 检测 |
| 清理事件监听器 | 无法 lint 检测 |

---

## 5. Motion v12 (motion-v12-best-practices.md)

### eslint 可配置

| 规则 | eslint 规则 | 状态 |
|------|------------|------|
| 禁止 `framer-motion` 导入 | `no-restricted-imports` | ⏳ 可配置 |

### Code Review

| 规则 | 说明 |
|------|------|
| AnimatePresence 在条件外层 | 无法 lint 检测 |
| 动态子元素必须有 key | 无法 lint 检测 |
| 仅动画 transform/opacity | 无法 lint 检测 |
| 使用 `useMotionValue` 高频更新 | 无法 lint 检测 |
| `useReducedMotion` 支持 | 无法 lint 检测 |

---

## 6. Tailwind CSS v4 (tailwindcss-v4-standards.md)

### eslint 可配置

| 规则 | eslint 规则 | 状态 |
|------|------------|------|
| 禁止 `bg-[#...]` 等硬编码颜色 | `tailwindcss/no-custom-colors` (需 plugin) | ⏳ 可配置 |
| 禁止模板字符串拼接类名 | `tailwindcss/no-arbitrary-value-animation` (需 plugin) | ⏳ 可配置 |

### 文件检测

| 规则 | 检测方式 |
|------|---------|
| `tailwind.config.*` 不应存在 | CI 检查文件 |
| `@layer components` 不应在 globals.css | CSS lint 或 CI |

### Code Review

| 规则 | 说明 |
|------|------|
| `@theme` 带 `inline` | 无法 lint 检测 |
| 使用语义化颜色 token | 无法强制检测 |
| 动画时长 0.15-0.4s | 无法 lint 检测 |

---

## 7. @base-ui/react (base-ui-react-best-practices.md)

### eslint 可配置

| 规则 | eslint 规则 | 状态 |
|------|------------|------|
| 从子路径导入 | `no-restricted-imports` | ⏳ 可配置 |
| 按钮必须有 `type` 属性 | `react/button-has-type` | ⏳ 可配置 |

### Code Review

| 规则 | 说明 |
|------|------|
| Compound Component 正确使用 | 无法 lint 检测 |
| `data-slot` 属性存在 | 无法 lint 检测 |
| 图标按钮有 `sr-only` 文本 | 无法 lint 检测 |
| Field 表单验证 | 无法 lint 检测 |

---

## 8. IndexedDB (idb-indexeddb-best-practices.md)

### Code Review

| 规则 | 说明 |
|------|------|
| `typeof window` 检查 | 无法 lint 检测 |
| 懒初始化模式 | 无法 lint 检测 |
| 事务内无 await 非 IDB Promise | 无法 lint 检测 |
| `tx.done` 等待 | 无法 lint 检测 |
| 版本迁移 oldVersion 守卫 | 无法 lint 检测 |

---

## 9. shadcn (shadcn-best-practices.md)

### eslint 可配置

| 规则 | eslint 规则 | 状态 |
|------|------------|------|
| 禁止硬编码颜色 | 同 Tailwind 规则 | ⏳ 可配置 |

### Code Review

| 规则 | 说明 |
|------|------|
| CLI 安装而非手动复制 | 无法 lint 检测 |
| `@/components/ui/*` 导入路径 | 无法 lint 检测 |
| Compound Component 完整使用 | 无法 lint 检测 |
| CVA variants 定义 | 无法 lint 检测 |

---

## 10. Supabase (supabase-best-practices.md)

### Code Review

| 规则 | 说明 |
|------|------|
| Service Role Key 不暴露客户端 | 无法 lint 检测 |
| RLS 启用 | 无法 lint 检测 |
| 实时订阅清理 | 无法 lint 检测 |
| `onAuthStateChange` unsubscribe | 无法 lint 检测 |
| 错误处理检查 | 无法 lint 检测 |

---

## 11. Sentry (sentry-nextjs-best-practices.md)

### Code Review

| 规则 | 说明 |
|------|------|
| `SENTRY_AUTH_TOKEN` 不提交 | 无法 lint 检测 |
| 用户上下文设置 | 无法 lint 检测 |
| `beforeSend` 脱敏 | 无法 lint 检测 |
| `tracesSampleRate` 配置 | 无法 lint 检测 |

---

## 12. Vercel (vercel-deployment-environments-best-practices.md)

### Code Review

| 规则 | 说明 |
|------|------|
| `NEXT_PUBLIC_` 前缀正确使用 | 无法 lint 检测 |
| `.env.local` 不提交 | 无法 lint 检测 |
| 分支映射正确 | 配置问题 |

---

## 13. pnpm (pnpm-best-practices.md)

### 配置检测

| 规则 | 检测方式 | 状态 |
|------|---------|------|
| `packageManager` 字段 | package.json 检查 | ✅ 已配置 |
| `pnpm-lock.yaml` 存在 | 文件检测 | ✅ 已存在 |
| `package-lock.json` 不存在 | 文件检测 | ✅ 已删除 |

---

## 可配置规则汇总

### eslint 新增规则（已配置）

| 规则 | 配置 | 来源 | 状态 |
|------|------|------|------|
| 禁止 `framer-motion` 导入 | `no-restricted-imports` | motion-v12 | ✅ 已配置 |
| `@base-ui/react` 子路径导入 | `no-restricted-imports` | base-ui-react | ✅ 已配置 |
| 按钮必须有 `type` 属性 | `react/button-has-type` | base-ui-react | ✅ 已配置 |

### tsconfig 已配置

| 选项 | 状态 |
|------|------|
| `noUncheckedIndexedAccess: true` | ✅ |
| `verbatimModuleSyntax: true` | ✅ |
| `exactOptionalPropertyTypes` | ❌ 回滚 |

---

## 无法自动检测的规范（Code Review Checklist）

### React 19
- Server/Client 边界正确
- 禁止 `forwardRef`
- `useFormStatus` 在子组件调用

### Zustand v5
- 禁止跨 store import
- 禁止 module-level 可变状态
- `create<T>()` curried 泛型语法

### Next.js 16
- `params`/`searchParams` 必须 `await`
- Route Handler 验证认证
- Server Actions 输入验证

### Motion v12
- AnimatePresence 条件外层
- 动态子元素必须有 key
- `useReducedMotion` 支持

### Supabase
- Service Role Key 安全
- 实时订阅清理
- 错误处理检查

### IndexedDB
- SSR 安全检查
- 事务生命周期
- 版本迁移守卫

---

## 建议下一步

1. **配置 eslint `no-restricted-imports`** — 禁止 `framer-motion` 和 `@base-ui/react` 根路径导入
2. **配置 eslint `react/button-has-type`** — 强制按钮 type 属性
3. **考虑 tailwindcss eslint plugin** — 检测硬编码颜色（需额外安装）
4. **完善 Code Review Checklist** — 整合所有无法自动检测的规范

---

## 结论

**可自动检测规则:** 7 条（eslint 5, tsconfig 2）
**已配置规则:** 7 条（tsconfig 2, eslint 5）
**无法自动检测:** 约 30+ 条（需 Code Review）

Standards 规范大部分是架构/模式规则，无法通过 lint 自动检测。已配置的 tsconfig + eslint 规则覆盖了 TypeScript 类型安全核心规则 + Motion/Base UI 导入规范 + Button type 规范。其余规范需通过 Code Review Checklist 约束。