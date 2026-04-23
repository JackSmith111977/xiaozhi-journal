---
date: '2026-04-22'
trigger: '新编码标准文档生成 — 旧代码系统性不合规'
scope: 'Major — 全代码库技术债重构，涉及 15+ 文件，~26 小时工作量'
---

# Sprint Change Proposal — 技术标准对齐重构

## 1. Issue Summary

**触发来源：** 项目全部 10 个技术栈的编码标准文档（`_bmad-output/standards/`）已生成并提交。审计发现现有代码存在系统性不合规。

**核心问题：** 现有代码不符合已确立的技术标准。不是功能错误，是技术债——不修复会随项目增长持续腐化。具体证据：

- 15 个文件仍在 `import from 'framer-motion'`，标准为 `motion/react`
- 31 处硬编码 HEX 色值（`bg-[#FDF8F5]`），标准为 Tailwind v4 设计 Token
- Supabase 使用 `createClient` 直连，标准为 `createBrowserClient` / `createServerClient` 分离
- Zustand 2 个 store 缺少 curried `create<State>()()` 语法
- 6 个文件缺少 `useReducedMotion` 降级支持
- 4 个文件、~20 处 `console.log` 调试语句
- 多处 IndexedDB 反模式、TypeScript 5 特性缺失

**影响范围：** `src/` 下几乎所有文件都需要修改。

## 2. Impact Analysis

### Epic 影响

| Epic | 影响类型 | 详情 |
|------|---------|------|
| Epic 3（AI 回应） | **影响** | `framer-motion` 迁移、硬编码色值替换 |
| Epic 8（账户管理） | **影响** | Supabase SSR 客户端分离、硬编码色值 |
| Epic 9（云端同步） | **影响** | Supabase SSR 分离、IndexedDB DBSchema 类型、synced 状态修复 |
| Epic 2（心情打卡） | **影响** | `framer-motion` 迁移、硬编码色值、useReducedMotion |
| Epic 4（波形图） | **影响** | `framer-motion` 迁移、硬编码色值、useReducedMotion |
| **所有 Epic** | **质量基线** | 代码质量提升，不影响功能行为 |

### Artifact 冲突

| 文档 | 需更新内容 |
|------|-----------|
| `architecture.md` | 技术选型已确认（motion/react、@supabase/ssr），架构决策不变 |
| `sprint-status.yaml` | 新增重构 Story 条目 |
| `project-context.md` | 新增编码标准引用 |
| `package.json` | 新增 `motion` 依赖，移除 `framer-motion` |

### 技术影响

- **零功能变更：** 所有修改为内部重构，不改变用户可见行为
- **低风险：** 每项修改都有明确标准和正确代码示例
- **正向收益：** 代码质量、可维护性、性能全部提升

## 3. Recommended Approach

**选择：分批执行 + 按优先级排序**

按依赖关系分组，每批独立完成、可回退。

| 批次 | 标准 | 工作量 | 风险 | 理由 |
|------|------|--------|------|------|
| **Batch A** | Motion v12 迁移 | ~4h | 低 | 阻塞后续动画相关修改，纯机械替换 |
| **Batch B** | Tailwind v4 Token 治理 | ~5h | 低 | 影响最广但每处改动小，先定义 token 再替换 |
| **Batch C** | Supabase SSR 分离 | ~3h | 中 | 需要理解 server/browser 边界，但收益最大 |
| **Batch D** | Zustand v5 规范 | ~1.5h | 低 | 语法修正 + 移除模块级变量 |
| **Batch E** | IndexedDB + TypeScript | ~2h | 低 | 类型安全 + 事务优化 |
| **Batch F** | Next.js 16 基础设施 | ~3h | 低 | 错误边界 + 中间件 + 暗色模式 |
| **Batch G** | React 19 + 清理 | ~2h | 低 | Dialog 组件化 + console.log 清理 |

**执行策略：**
- 每批独立 commit，可单独回退
- 每批完成后手动验证功能（不写单元测试，遵循项目既有策略）
- Batch C（Supabase SSR）风险最高，建议优先执行并充分测试

**不推荐回滚：** 已完成的功能代码不需要撤销，原地修改即可。

## 4. Detailed Change Proposals

### Batch A: Motion v12 迁移（P0）

**标准依据：** `_bmad-output/standards/motion-v12-best-practices.md`

| # | 文件 | 变更内容 |
|---|------|---------|
| 1 | `src/app/page.tsx:3` | `import { motion, AnimatePresence } from 'framer-motion'` → `from 'motion/react'` |
| 2 | `src/app/auth/login/page.tsx:4` | 同上 |
| 3 | `src/app/auth/callback/page.tsx:3` | 同上 |
| 4 | `src/components/journal-input.tsx:4` | 同上 |
| 5 | `src/components/mood-selector.tsx:2` | 同上 |
| 6 | `src/components/golden-quote.tsx:2` | 同上 |
| 7 | `src/components/emotion-chart.tsx:1` | 同上 |
| 8 | `src/components/emotion-tooltip.tsx:1` | 同上 |
| 9 | `src/components/xiaozhi-bubble.tsx:2` | 同上 |
| 10 | `src/components/capsule-popup.tsx:3` | 同上 |
| 11 | `src/components/empty-state.tsx:2` | 同上 |
| 12 | `src/components/typewriter.tsx:1` | 同上 |
| 13 | `src/components/typing-indicator.tsx:1` | 同上 |
| 14 | `src/components/share-card.tsx:3` | 同上 |
| 15 | `src/app/settings/page.tsx:10` | 同上 |
| 16 | `src/components/empty-state.tsx:22` | 添加 `useReducedMotion` 保护无限浮动动画 |
| 17 | `src/components/xiaozhi-bubble.tsx:45` | 添加 `useReducedMotion` 保护 |
| 18 | `src/components/typing-indicator.tsx:18` | 添加 `useReducedMotion` 保护 |
| 19 | `src/components/emotion-chart.tsx:34` | 添加 `useReducedMotion` 保护 |
| 20 | `src/components/golden-quote.tsx:32` | 替换手动 `useRef + matchMedia` 为 `useReducedMotion` |
| 21 | `src/components/typewriter.tsx:15` | 替换手动 `useRef + matchMedia` 为 `useReducedMotion` |
| 22 | `package.json` | `npm install motion`，移除 `framer-motion` |

**package.json 变更：**
```diff
- "framer-motion": "^12.38.0",
+ "motion": "^12.38.0",
```

### Batch B: Tailwind v4 Token 治理（P0）

**标准依据：** `_bmad-output/standards/tailwindcss-v4-standards.md`

**前置步骤：** 先在 `globals.css` 的 `@theme inline` 中补齐缺失 Token。

**Token 映射表：**

| 硬编码色值 | 出现位置 | 应替换为 |
|-----------|---------|---------|
| `#FDF8F5` | page.tsx, login, settings, capsule, share-card, history | `--background` |
| `#3D3D3D` | page.tsx, login, tooltip | `--foreground` |
| `#E8C4A0` | page.tsx, login, settings, journal-input, mood-selector, xiaozhi-bubble, typing-indicator, emotion-chart | `--primary` |
| `#FFFFFF` | page.tsx | `--primary-foreground` |
| `#D4856A` | page.tsx, settings, emotion-chart, capsule-popup | `--accent` |
| `#8A817C` | settings, journal-input, empty-state, history | `--muted-foreground` |
| `#F5EDE4` | golden-quote, skeleton | `--muted` |
| `#5A524D` | golden-quote | `--muted-foreground` |
| `#3D3D3D` | emotion-tooltip | `--popover` |
| `#D4C5B9` | capsule-popup | `--card` |

**涉及 31 处替换，15 个文件。** 包括内联 `style` 属性迁移为 `className`。

### Batch C: Supabase SSR 分离（P0）

**标准依据：** `_bmad-output/standards/supabase-best-practices.md`

**涉及文件：**

| # | 文件 | 变更内容 |
|---|------|---------|
| 1 | `src/lib/supabase.ts` | 改为导出 `createBrowserClient` + 新增 `createServerClient`（用于 Server Components） |
| 2 | `src/lib/auth.ts` | 改用 `createBrowserClient` |
| 3 | `src/lib/realtime.ts` | 改用 `createBrowserClient` |
| 4 | `src/lib/export.ts` | 改用 `createBrowserClient` |
| 5 | `src/lib/account.ts` | 改用 `createBrowserClient` |
| 6 | `src/lib/supabase.ts:16` | 移除 `console.log('Supabase client initialized')` |
| 7 | `src/lib/supabase.ts` | 添加 `Database` 泛型类型（`supabase gen types` 生成） |

**安装依赖：** `npm install @supabase/ssr`

**核心变更（supabase.ts）：**
```ts
// Before
import { createClient } from '@supabase/supabase-js'
export const supabase = createClient(url, key)

// After
import { createBrowserClient } from '@supabase/ssr'
export const supabase = createBrowserClient<Database>(url, key)

// New: for Server Components / Route Handlers
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
export function createClient() {
  const cookieStore = await cookies()
  return createServerClient<Database>(url, key, { cookies: { getAll: () => cookieStore.getAll(), set: () => {} } })
}
```

### Batch D: Zustand v5 规范（P1）

**标准依据：** `_bmad-output/standards/zustand-v5-best-practices.md`

| # | 文件 | 变更内容 | 工作量 |
|---|------|---------|--------|
| 1 | `src/store/auth.ts:38` | `create<AuthState>((set) =>` → `create<AuthState>()((set) =>` | 10min |
| 2 | `src/store/journal.ts:42` | `create<JournalState & JournalActions>((set) =>` → `create<JournalState & JournalActions>()((set) =>` | 10min |
| 3 | `src/store/auth.ts:12-13` | 移除 `activeSubscription` 和 `initialized` 模块变量，移入 Zustand state | 30min |
| 4 | `src/store/journal.ts:15-16` | 移除 `onOnlineHandler` 和 `onOfflineHandler` 模块变量 | 20min |
| 5 | `src/lib/realtime.ts:12` | `channel` 模块变量移入 Zustand state 或 `useRef` | 20min |
| 6 | `src/lib/sync-manager.ts:8` | `syncing` 模块变量移入 Zustand state | 15min |
| 7 | 4 个文件 | 移除 ~20 处 `console.log` 调试语句 | 20min |

### Batch E: IndexedDB + TypeScript 5（P1）

**标准依据：** `_bmad-output/standards/idb-indexeddb-best-practices.md`, `typescript-5-best-practices.md`

| # | 文件 | 变更内容 | 工作量 |
|---|------|---------|--------|
| 1 | `src/lib/db.ts` | 添加 `DBSchema` 接口定义，`openDB<XiaozhiDB>(...)` | 30min |
| 2 | `src/types/index.ts:12` | `Journal.status` 添加 `'synced'` 状态 | 5min |
| 3 | `src/lib/db.ts:97` | `markSynced` 设置 `status: 'synced'` 替代 `'ai_done'` | 5min |
| 4 | `src/lib/db.ts:133-135` | `syncToSupabase` 批量更新 status（单次事务） | 20min |
| 5 | `src/types/index.ts:15` | `MOOD_MAP` 使用 `satisfies Record<MoodLevel, ...>` | 5min |
| 6 | `tsconfig.json` | 考虑启用 `noUncheckedIndexedAccess` + `verbatimModuleSyntax` | 30min |

### Batch F: Next.js 16 基础设施（P1）

**标准依据：** `_bmad-output/standards/nextjs-16-best-practices.md`

| # | 文件 | 变更内容 | 工作量 |
|---|------|---------|--------|
| 1 | `src/app/error.tsx` | 新增错误边界页面 | 30min |
| 2 | `src/app/not-found.tsx` | 新增 404 页面 | 30min |
| 3 | `src/app/global-error.tsx` | 新增全局错误边界 | 30min |
| 4 | `middleware.ts` | 新增路由鉴权中间件（auth guard） | 1h |
| 5 | `src/app/layout.tsx:23` | 添加暗色模式 class 支持 | 30min |

### Batch G: React 19 + 清理（P1）

**标准依据：** `_bmad-output/standards/react-19-best-practices.md`

| # | 文件 | 变更内容 | 工作量 |
|---|------|---------|--------|
| 1 | `src/app/settings/page.tsx:190-245` | 手动 modal → shadcn Dialog 组件 | 2h |
| 2 | `src/app/page.tsx:55` | 内联 `style={{ fontFamily: 'var(--font-noto-serif)' }}` → Tailwind class | 10min |
| 3 | 6 个文件 | 同上（journal-input, capsule-popup, share-card, xiaozhi-bubble, login） | 30min |

## 5. Implementation Handoff

**范围分类：Moderate**

- 不涉及 PRD/Epics/Architecture 逻辑变更
- 纯技术重构，不影响功能行为
- 需要新增 7 个 Batch 到 sprint-status.yaml

**路由：**

| 角色 | 职责 |
|------|------|
| **开发者** | 按 Batch A→G 顺序逐个执行，每批独立 commit |
| **用户 Kei** | 每批完成后验证功能（桌面浏览器手动测试核心路径）|

**成功标准：**

- 所有 10 个标准文档的审计项清零
- `npm run build` 通过，无 error
- 核心路径功能正常：登录→写日记→AI 回应→波形图→历史
- 无 `console.log` 残留
- 无 `framer-motion` 引用
- 无硬编码 HEX 色值（除 globals.css 定义处）

## 6. Sprint Status 更新建议

在 `sprint-status.yaml` 中新增一个 **Epic 0: 技术标准对齐**，包含 7 个 Story：

```yaml
# Epic 0: 技术标准对齐（重构 Epic）
epic-0: in-progress
0-a-motion-v12-migration: backlog
0-b-tailwind-token-governance: backlog
0-c-supabase-ssr-separation: backlog
0-d-zustand-v5-compliance: backlog
0-e-indexeddb-typescript-fix: backlog
0-f-nextjs-16-infrastructure: backlog
0-g-react-19-cleanup: backlog
epic-0-retrospective: optional
```

---

**总工作量估算：~26 小时，分 7 批执行。**
**建议优先顺序：A → B → C → D → E → G → F（F 可延后至功能开发前）。**
