---
stepsCompleted: ["step-01-init", "step-02-context", "step-03-starter", "step-04-decisions", "step-05-patterns", "step-06-structure", "step-07-validation", "step-08-complete"]
workflowType: 'architecture'
lastStep: 8
status: 'complete'
completedAt: '2026-04-11'
uxReviewed: true
uxReviewedAt: '2026-04-11'
---

# Architecture Decision Document (UX Updated)

> 本文档已根据 UX 设计规格（`ux-design-specification.md`）更新。

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## 输入文档

- PRD: `_bmad-output/planning-artifacts/prd.md` (~470 行)
- UX Design: `_bmad-output/planning-artifacts/ux-design-specification.md` (~740 行)

---

## Project Context Analysis

### Requirements Overview

**Functional Requirements:**
- 日记记录 (FR1-FR5): 心情表情打卡 + 自由文本 + 历史查看
- AI 互动 (FR6-FR9): AI 回应 + 金句提炼 + 情绪标签 + Fallback
- 情绪可视化 (FR10-FR12): 7 天波形图 + 表情标注 + 空状态引导
- 时间胶囊 (FR13-FR14, FR19): 多时间窗口梯度推送 + 频率控制
- 数据管理 (FR15-FR17): IndexedDB 持久化 + 离线队列 + 种子数据
- 分享 (FR18): 金句卡片生成图片

**Non-Functional Requirements:**
- 首屏 ≤ 2s，AI 响应 5-8s / 超时 15s
- API Key 服务端代理，不暴露前端
- 全量 IndexedDB 本地存储，零上传
- 网络断开不丢数据，pending 重试
- API 失败时本地金句降级

**Scale & Complexity:**

- Primary domain: 全栈 Web App (SPA + API Proxy)
- Complexity level: 低
- Estimated architectural components: ~6

### Technical Constraints & Dependencies

- Next.js App Router + TypeScript
- Zustand (轻量状态管理)
- **TailwindCSS** + **shadcn/ui**（基础组件）+ **Aceternity UI**（动效组件）
- **Framer Motion**（弹簧动画、页面过渡）
- IndexedDB via `idb` 库
- 阿里云百炼 API (OpenAI 兼容接口)
- **字体**：Noto Serif SC（标题/金句）+ Noto Sans SC（正文）— Google Fonts
- 桌面浏览器 Chrome/Edge 最新版，移动端适配（375px+）
- 无需登录/注册/后端数据库

**新增依赖（UX 审阅后添加）：**

| 依赖 | 用途 | 来源 |
|------|------|------|
| `framer-motion` | 弹簧动画、页面淡入淡出 | UX 波形图/卡片/输入框动效 |
| `shadcn/ui` | Button, Card, Textarea, Dialog, Skeleton | UX 基础组件 |
| Aceternity UI | Text Generate Effect, 3D Card | 打字机、金句翻转 |
| `@next/font/google` | Noto Serif SC + Noto Sans SC | UX 字体系统 |

**移除依赖：**
- ~~`recharts`~~ → 波形图改为**自绘 SVG + Framer Motion**（UX 要求有机生长动画，recharts 无法满足）

### Cross-Cutting Concerns Identified

1. **数据持久化层** — 所有日记读写走 IndexedDB，统一封装
2. **AI 调用管道** — 超时控制 + 降级 + 打字机动画
3. **离线处理** — pending 标记 + 异步重试
4. **情绪数据计算** — 7 天趋势聚合 + 表情映射

---

## Starter Template Evaluation

### Primary Technology Domain

Web Application (Next.js App Router) based on PRD requirements

### Starter Options Considered

| 方案 | 评估 |
|------|------|
| `create-next-app@latest` 官方脚手架 | ✅ 推荐 — 官方维护，内置 TS + Tailwind + App Router |
| 第三方 T3 Stack | ❌ 过度 — 包含 tRPC/Prisma 等不需要的组件 |
| 自定义模板 | ❌ 不必要 — 官方脚手架已满足需求 |

### Selected Starter: create-next-app@latest

**Rationale:**
PRD 已明确技术栈，官方脚手架覆盖所有基础需求。无需引入额外 boilerplate。

**Initialization Command:**

```bash
npx create-next-app@latest xiaozhi-journal \
  --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

**Architectural Decisions Provided by Starter:**

**Language & Runtime:** TypeScript 完整配置，strict mode 开启

**Styling Solution:** TailwindCSS 预装，PostCSS 已配置

**Build Tooling:** Turbopack 开发服务器，生产构建优化内置

**Testing Framework:** 未预设（本项目不写单元测试，手动验证）

**Code Organization:** `src/` 目录 + App Router 文件路由

**Development Experience:** 热更新、Fast Refresh、TypeScript 类型检查

**需要额外安装的依赖：**

| 依赖 | 用途 |
|------|------|
| `zustand` | 状态管理 |
| `idb` | IndexedDB 封装 |
| `framer-motion` | 弹簧动画、页面过渡 |
| `shadcn/ui` | 基础组件（Button, Card, Textarea, Dialog, Skeleton） |
| `@next/font/google` | Noto Serif SC + Noto Sans SC |
| Aceternity UI | 打字机效果、3D 卡片（复制源码到项目） |

**Note:** 项目初始化是第一个实现任务。

---

## Core Architectural Decisions

### Data Architecture

**IndexedDB Stores:** 多表设计

| Store | 用途 |
|-------|------|
| `journals` | 日记条目 |
| `appMeta` | 应用级元数据（是否已加载种子数据等） |

**`journals` 数据模型：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `string` | UUID |
| `content` | `string` | 日记正文 |
| `mood` | `number` | 1-5（对应 😡 😔 😐 😊 😴） |
| `moodEmoji` | `string` | 表情符号文本 |
| `aiResponse` | `string \| null` | AI 回应文本 |
| `goldenQuote` | `string \| null` | 今日金句 |
| `moodLabel` | `string \| null` | AI 识别的情绪标签 |
| `timestamp` | `string` | ISO 时间字符串 |
| `status` | `'pending' \| 'ai_ready' \| 'ai_done'` | AI 处理状态 |
| `shareCount` | `number` | 金句被分享次数（可选） |

**`appMeta` 数据模型：**

| 字段 | 类型 | 说明 |
|------|------|------|
| `key` | `string` | 元数据键 |
| `value` | `any` | 元数据值 |

### Authentication & Security

- API Key 存储在 `.env.local`，不提交到 git
- 环境变量名：`DASHSCOPE_API_KEY`（阿里云百炼）
- 提供 `.env.example` 模板，占位符 `sk-xxx`
- 无需认证/登录（本地单用户）

### API & Communication Patterns

**`POST /api/journal`**

请求体：`{ content: string, mood: number }`

响应体（成功）：`{ response: string, goldenQuote: string, moodLabel: string, fromFallback: false }`

响应体（降级）：`{ response: string, goldenQuote: string, moodLabel: "本地", fromFallback: true }`

**错误处理标准：**
- 15 秒超时 → 本地 fallback 金句
- 网络错误 → 本地 fallback 金句
- JSON 解析失败 → 重试一次 → 失败则 fallback
- 所有降级不走 HTTP error，返回 200 + `fromFallback: true`

### Frontend Architecture

**设计系统（来自 UX）：**

| 层级 | 工具 | 用途 |
|------|------|------|
| 样式基础 | **TailwindCSS** | 设计 Token（色板、间距、圆角、字体） |
| 基础组件 | **shadcn/ui** | Button, Card, Textarea, Dialog, Skeleton |
| 动效组件 | **Aceternity UI** | Text Generate Effect（打字机）、3D Card（金句翻转） |
| 动画库 | **Framer Motion** | 弹簧动画、页面淡入淡出、波形图生长 |

**设计 Token（「暖日」色板）：**

| Token | 色值 | 用途 |
|-------|------|------|
| `bg-primary` | `#FDF8F5` | 页面背景（极浅暖米白） |
| `bg-secondary` | `#F5EDE4` | 卡片/区块背景 |
| `primary` | `#E8C4A0` | 主色（柔棕） |
| `accent` | `#D4856A` | 强调色（暖珊瑚，按钮、金句高亮） |
| `text-primary` | `#3D3D3D` | 主文字（深暖灰，非纯黑） |
| `text-secondary` | `#8A817C` | 次要文字（中暖灰） |
| `error` | `#D4856A` | 暖珊瑚（替代红色，保持温度） |

**圆角系统：** sm=8px, md=12px, lg=16px, xl=24px, full=9999px（偏大，传达友好温柔）

**字体系统：**
- 标题/金句：`Noto Serif SC` 700/600/400 italic
- 正文：`Noto Sans SC` 400
- 通过 `@next/font/google` 加载

**目录结构（UX 更新后）：**

```
xiaozhi-journal/
├── README.md
├── package.json
├── next.config.ts
├── tailwind.config.ts          # 扩展：暖日色板 + 圆角 + 阴影
├── tsconfig.json
├── .env.local
├── .env.example                # DASHSCOPE_API_KEY=sk-xxx
├── .gitignore
├── components.json             # shadcn/ui 配置
├── public/
│   └── favicon.ico
├── src/
│   ├── app/
│   │   ├── layout.tsx          # 根布局 + Google Fonts 加载
│   │   ├── page.tsx            # 首页（波形图 + 心情 + 输入 + AI 回应）
│   │   ├── globals.css         # Tailwind 指令 + 自定义 CSS 变量
│   │   └── api/
│   │       └── journal/
│   │           └── route.ts    # POST: AI 代理
│   ├── components/
│   │   ├── ui/                 # shadcn/ui 组件（源码级）
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── dialog.tsx
│   │   │   └── skeleton.tsx
│   │   ├── mood-selector.tsx       # 5 表情选择器（定制 SVG）
│   │   ├── journal-input.tsx       # 日记输入框（聊天气泡风格）
│   │   ├── emotion-chart.tsx       # 7 天波形图（自绘 SVG + Framer Motion）
│   │   ├── golden-quote.tsx        # 金句卡片（Aceternity 3D Card）
│   │   ├── typewriter.tsx          # 打字机效果（Aceternity Text Generate）
│   │   ├── xiaozhi-bubble.tsx      # 小知回应气泡
│   │   ├── typing-indicator.tsx    # "小知正在想..." + 跳动圆点
│   │   ├── empty-state.tsx         # 空状态引导
│   │   └── capsule-popup.tsx       # 时间胶囊弹窗（shadcn Dialog）
│   ├── lib/
│   │   ├── db.ts                   # IndexedDB 初始化 + CRUD
│   │   ├── ai.ts                   # AI 调用 + system prompt + 本地 fallback
│   │   ├── seed-data.ts            # 演示数据（3 条预设日记）
│   │   └── utils.ts                # 工具函数（cn() 等）
│   ├── store/
│   │   └── journal.ts              # Zustand store
│   └── types/
│       └── index.ts                # Journal, AIResponse, MoodLevel 等
```

**状态管理：** 单一 Zustand store（状态少，不需要拆分）
**波形图：** 自绘 SVG `<polyline>` + Framer Motion 弹性生长动画（非 recharts）
**响应式策略：** 桌面优先，3 断点（sm:375px, md:768px, lg:1024px），Tailwind 默认断点

### Infrastructure & Deployment

- 运行方式：`npm run dev` 本地开发
- 端口：默认 3000
- 环境变量：`.env.local` + `.env.example`
- 部署：比赛后考虑 Vercel

### Decision Impact Analysis

**实现顺序：**
1. 初始化 Next.js 项目 + 安装依赖
2. 创建类型定义 + IndexedDB 数据层
3. 创建 Zustand store
4. 实现心情选择器 + 日记输入组件
5. 实现 `/api/journal` Route Handler + AI 调用
6. 实现情绪波形图组件
7. 实现金句卡片 + 打字机效果
8. 添加种子数据 + Fallback 机制
9. 集成测试 + 视觉打磨

**跨组件依赖：**
- 心情选择器 → 触发日记输入 → 保存 IndexedDB → 调用 AI API → 更新 store → 波形图刷新
- AI API 失败 → 触发本地 fallback → 金句卡片仍然显示
- 种子数据 → 写入 IndexedDB → 波形图立即有内容

---

## Implementation Patterns & Consistency Rules

### Naming Patterns

**文件命名：** kebab-case — `mood-selector.tsx`, `journal-input.tsx`

**组件命名：** PascalCase（导出名）— `export function MoodSelector()`

**函数命名：** camelCase — `fetchJournals()`, `addJournal()`

**变量命名：** camelCase — `userId`, `goldenQuote`

**API 路由：** kebab-case（文件夹）— `api/journal/route.ts`

**IndexedDB store：** camelCase（复数）— `journals`, `appMeta`

### Format Patterns

**JSON 字段：** 统一 camelCase

**日期格式：** ISO 8601 字符串 — `new Date().toISOString()`

**布尔值：** `true` / `false`

**错误响应：** `{ error: string, fromFallback: boolean }` — 不走 HTTP error code

### State Management Patterns

| 约定 | 说明 |
|------|------|
| 更新方式 | Immer 风格不可变更新：`set(state => ({ ...state, journals: [...state.journals, new] }))` |
| Loading 命名 | `loading`（全局）、`saving`（单条） |
| 错误存储 | `error: string \| null` |
| Source of Truth | IndexedDB → 页面加载时从 DB 读 → store 作为运行时状态 |

### Error Handling Patterns

| 场景 | 处理方式 |
|------|----------|
| AI API 失败 | 返回 200 + `fromFallback: true`，不走 HTTP error |
| 网络断开 | 日记先写 IndexedDB，标记 `pending`，不报错 |
| 组件级错误 | `error` state + 用户可见的中文提示 |
| 控制台日志 | 开发环境 `console.error`，生产环境静默 |

### Loading State Patterns

| 场景 | 表现 |
|------|------|
| AI 等待 | 打字机动画 + "小知正在想..." + 3 个跳动圆点（Aceternity Text Generate） |
| 数据加载 | 骨架屏浅米色 `#F5EDE4` 闪烁（shadcn Skeleton） |
| 保存中 | 按钮变 disabled + 涟漪反馈 + loading 文案 |
| 页面过渡 | 淡入淡出 0.3s（Framer Motion） |

### Motion & Animation Patterns

| 动效 | 实现 | 参数 |
|------|------|------|
| 表情点击回弹 | Framer Motion `spring` | scale(1.3) → 回弹 |
| 输入框滑入 | Framer Motion `spring` | 从下方弹性滑入 |
| 打字机揭示 | Aceternity Text Generate | ~50ms/字 |
| 金句翻转 | Aceternity 3D Card + CSS 3D transform | 0.6s |
| 波形生长 | Framer Motion `animate` | 0.8s 入场，新数据点弹性弹跳 |
| 弹窗出现 | Framer Motion `scale 0.9 → 1.0` | 0.3s cubic-bezier |
| 空状态浮动 | CSS `@keyframes` | 2s 循环微浮动 |
| 尊重无障碍 | `prefers-reduced-motion` | 关闭动画时直接显示 |

### Enforcement Guidelines

**所有实现 MUST：**

- 文件命名使用 kebab-case
- JSON 字段使用 camelCase
- 日期使用 ISO 8601 字符串
- 错误通过 `error` state 展示给用户，不抛异常阻断
- AI 调用失败返回 200 + `fromFallback: true`

**Good Examples:**
```ts
// ✅ 正确的 store 更新
addJournal: (journal) => set((state) => ({
  journals: [...state.journals, journal]
}))

// ✅ 正确的错误处理
return Response.json({ response: fallbackQuote, goldenQuote: fallbackQuote, moodLabel: "本地", fromFallback: true })
```

**Anti-Patterns:**
```ts
// ❌ 直接 mutation
state.journals.push(journal)

// ❌ 暴露 HTTP error 给前端
throw new Error('API failed')
```

---

## Project Structure & Boundaries

### Complete Project Directory Structure

```
xiaozhi-journal/
├── README.md
├── package.json
├── next.config.ts
├── tailwind.config.ts          # 暖日色板 + 圆角 + 阴影 Token
├── tsconfig.json
├── .env.local                  # 实际 API Key（不提交）
├── .env.example                # 模板：DASHSCOPE_API_KEY=sk-xxx
├── .gitignore
├── components.json             # shadcn/ui 配置
├── public/
│   └── favicon.ico
├── src/
│   ├── app/
│   │   ├── layout.tsx          # 根布局 + Google Fonts (Noto Serif/Sans SC)
│   │   ├── page.tsx            # 首页（波形图 + 心情 + 输入 + AI 回应）
│   │   ├── globals.css         # Tailwind + CSS 变量（色板/圆角/阴影）
│   │   └── api/
│   │       └── journal/
│   │           └── route.ts    # POST: AI 代理
│   ├── components/
│   │   ├── ui/                 # shadcn/ui 源码级组件
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── dialog.tsx
│   │   │   └── skeleton.tsx
│   │   ├── mood-selector.tsx       # 5 表情（定制 SVG，非标准 emoji）
│   │   ├── journal-input.tsx       # 输入框（聊天气泡风格，底部 2px 线）
│   │   ├── emotion-chart.tsx       # 波形图（自绘 SVG + Framer Motion）
│   │   ├── golden-quote.tsx        # 金句卡片（Aceternity 3D Card + 翻转）
│   │   ├── typewriter.tsx          # 打字机（Aceternity Text Generate）
│   │   ├── xiaozhi-bubble.tsx      # 小知回应气泡（左侧对齐，带气泡尾）
│   │   ├── typing-indicator.tsx    # "小知正在想..." + 3 个跳动圆点
│   │   ├── empty-state.tsx         # 空状态引导（插画 + 温柔文案）
│   │   └── capsule-popup.tsx       # 时间胶囊弹窗（shadcn Dialog）
│   ├── lib/
│   │   ├── db.ts                 # IndexedDB 初始化 + CRUD
│   │   ├── ai.ts                 # AI 调用 + system prompt + fallback 金句库
│   │   ├── seed-data.ts          # 演示数据（3 条预设日记）
│   │   └── utils.ts              # cn() 等工具函数
│   ├── store/
│   │   └── journal.ts            # Zustand store
│   └── types/
│       └── index.ts              # Journal, AIResponse, MoodLevel 等
```

**UX 审阅后变更：**

| 变更 | 之前 | 之后 | 原因 |
|------|------|------|------|
| 波形图 | recharts LineChart | 自绘 SVG + Framer Motion | UX 要求有机生长动画，recharts 不灵活 |
| 基础组件 | 无 | shadcn/ui | UX 要求 Button/Card/Textarea/Dialog/Skeleton |
| 动效 | 内联 CSS | Framer Motion + Aceternity UI | UX 要求弹簧动画、3D 翻转、打字机 |
| 字体 | 系统默认 | Noto Serif SC + Noto Sans SC | UX 杂志风格，文学感标题 |
| 新增组件 | 5 个 | 9 个 | xiaozhi-bubble, typing-indicator, empty-state, ui/* |
| 配置文件 | 无 | components.json | shadcn/ui 需要 |
| 工具函数 | 无 | lib/utils.ts | cn() 合并 Tailwind class |

### Architectural Boundaries

**API Boundaries:**
- 唯一端点：`POST /api/journal`
- 纯代理模式，无认证，无业务逻辑
- 请求体：`{ content, mood }` → 响应体：`{ response, goldenQuote, moodLabel, fromFallback }`

**Component Boundaries:**
- 所有组件通过 Zustand store 通信
- 不直接 props 传递跨组件数据
- 组件职责单一：每个组件只做一件事

**Service Boundaries:**
- `lib/db.ts`：唯一 IndexedDB 操作入口
- `lib/ai.ts`：唯一 AI 调用入口（含 fallback）
- `store/journal.ts`：唯一状态管理入口

**Data Boundaries:**
- IndexedDB 是唯一数据源（`journals` + `appMeta` 两表）
- 无后端数据库，无缓存层
- 数据流向：用户输入 → IndexedDB → store → 组件渲染

### Requirements to Structure Mapping

| 需求 | 实现位置 |
|------|----------|
| FR1-F2: 心情打卡 + 日记输入 | `components/mood-selector.tsx` + `components/journal-input.tsx` |
| FR3-F4: 保存 + 历史查看 | `lib/db.ts` + `store/journal.ts` |
| FR6-F7: AI 回应 + 金句 | `app/api/journal/route.ts` + `lib/ai.ts` |
| FR10-F11: 情绪波形图 | `components/emotion-chart.tsx` |
| FR13-F14: 时间胶囊 | `components/capsule-popup.tsx` |
| FR15-F17: 数据管理 + 种子 | `lib/db.ts` + `lib/seed-data.ts` |
| FR18: 金句分享 | `components/golden-quote.tsx` |

### Integration Points

**Internal Communication:**
```
用户 → MoodSelector → JournalInput → lib/db.ts (IndexedDB)
                                          ↓
                                  store/journal.ts
                                          ↓
                              app/api/journal/route.ts → 阿里云百炼
                                          ↓
                                  lib/ai.ts (fallback)
                                          ↓
                              EmotionChart (读取 store 渲染)
```

**External Integrations:**
- 阿里云百炼 API（OpenAI 兼容接口）— 通过 `/api/journal` 代理

**Data Flow:**
- 写入：用户输入 → `lib/db.ts` → IndexedDB → `store/journal.ts` → 组件重渲染
- 读取：页面加载 → `store/journal.ts` → `lib/db.ts` → IndexedDB → 组件渲染

### File Organization Patterns

**Configuration Files:** 根目录标准 Next.js 配置（`next.config.ts`, `tailwind.config.ts`, `tsconfig.json`）
**Source Organization:** `src/` 下按职责分组（`app/`, `components/`, `lib/`, `store/`, `types/`）
**Test Organization:** 本项目不写单元测试，手动验证
**Asset Organization:** `public/` 存放静态资源

---

## Architecture Validation Results

### Coherence Validation ✅

**Decision Compatibility:** 所有技术栈无冲突 — Next.js App Router + TypeScript + TailwindCSS + Zustand + idb + Framer Motion + shadcn/ui + Aceternity UI，全部兼容

**Pattern Consistency:** 命名规范统一（kebab-case 文件、camelCase JSON、PascalCase 组件），所有组件通过 Zustand store 通信，动效统一使用 Framer Motion

**Structure Alignment:** 目录结构支持所有架构决策和 UX 组件需求，`lib/` 为唯一服务入口，`store/` 为唯一状态入口，`components/ui/` 为 shadcn 基础组件

### Requirements Coverage Validation ✅

**Functional Requirements:**

| FR 类别 | 架构支持 | 状态 |
|---------|----------|------|
| FR1-F5 日记记录 | `mood-selector.tsx` + `journal-input.tsx` + `db.ts` | ✅ |
| FR6-F9 AI 互动 | `route.ts` + `ai.ts` + fallback | ✅ |
| FR10-F12 情绪可视化 | `emotion-chart.tsx`（自绘 SVG + Framer Motion） | ✅ |
| FR13-F14 时间胶囊 | `capsule-popup.tsx` | ✅ |
| FR15-F17 数据管理 | `db.ts` + `seed-data.ts` | ✅ |
| FR18 金句分享 | `golden-quote.tsx` | ✅ |

**Non-Functional Requirements:**

| NFR | 架构支持 | 状态 |
|-----|----------|------|
| NFR1-3 性能 | 首屏最小化、打字机掩盖等待 | ✅ |
| NFR5-7 安全 | `.env.local` + Route Handler 代理 | ✅ |
| NFR8-9 降级 | Fallback 金句 + IndexedDB pending | ✅ |

### Implementation Readiness Validation ✅

- ✅ 所有关键决策已记录
- ✅ 命名规范完整且一致
- ✅ Good/Bad 代码示例已提供
- ✅ 数据流清晰定义

### Gap Analysis Results

| 级别 | 项目 | 说明 |
|------|------|------|
| 重要 | AI Prompt 未详细定义 | `lib/ai.ts` 中的 system prompt 需要在实现时精确定义 |
| 可选 | 无测试策略 | 本项目手动验证 |
| 可选 | 无 CI/CD | 本地开发，不需要 |

### Architecture Completeness Checklist

- [x] 项目上下文分析
- [x] Starter 模板评估
- [x] 核心架构决策（数据、安全、API、前端、基础设施）
- [x] 实现模式与一致性规则
- [x] 完整项目目录结构
- [x] 需求到结构映射
- [x] 数据流定义

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** 高

**Key Strengths:**
- 技术栈极简，决策明确
- 数据流单向清晰
- 所有 FR/NFR 都有架构支持
- 实现模式已定义

**Areas for Future Enhancement:**
- AI Prompt 精细化（实现时定义）
- P2 功能（语音输入、主题皮肤）的架构预留

### Implementation Handoff

**AI Agent Guidelines:**

- 严格遵循架构文档中的所有决策
- 使用实现模式保持一致性
- 尊重项目结构和边界
- 所有架构问题参考此文档

**First Implementation Priority:**

```bash
npx create-next-app@latest xiaozhi-journal \
  --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

安装额外依赖：
```bash
npm i zustand idb framer-motion
npx shadcn@latest init
npx shadcn@latest add button card textarea dialog skeleton
```

然后按顺序实现：
1. 配置 Tailwind 暖日色板 + 圆角 + 阴影 Token
2. 加载 Google Fonts（Noto Serif SC + Noto Sans SC）
3. 创建类型定义 (`types/index.ts`)
4. 创建 IndexedDB 数据层 (`lib/db.ts`)
5. 创建 Zustand store (`store/journal.ts`)
6. 安装并配置 shadcn/ui 组件
7. 实现心情选择器 + 日记输入组件
8. 实现 `/api/journal` Route Handler + AI 调用 + system prompt
9. 实现情绪波形图组件（自绘 SVG + Framer Motion）
10. 实现金句卡片（Aceternity 3D Card）+ 打字机效果
11. 实现小知气泡 + 打字机指示器 + 空状态
12. 添加种子数据 + Fallback 机制
13. 响应式适配 + 视觉打磨
