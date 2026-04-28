---
stepsCompleted: [1, 2, 3, 4, 5, 6, 7, 8, 'auth-security-update']
inputDocuments:
  - 'prd.md'
  - 'ux-design-specification.md'
  - 'epics.md'
  - 'sprint-change-proposal-2026-04-21.md'
  - 'correct-course-change-proposal'
  - 'sprint-change-proposal-2026-04-27-auth-security.md'
workflowType: 'architecture'
project_name: 'Xiaozhi Journal'
user_name: 'Kei'
date: '2026-04-16'
classification: ''
lastStep: 8
status: 'complete'
completedAt: '2026-04-21'
lastEdited: '2026-04-27'
---

# Architecture Decision Document (UX Updated)

> 本文档已根据 UX 设计规格（`ux-design-specification.md`）更新。

_This document builds collaboratively through step-by-step discovery. Sections are appended as we work through each architectural decision together._

## 输入文档

- PRD: `_bmad-output/planning-artifacts/prd.md` (~575 行，商业版，已修复全部违规)
- UX Design: `_bmad-output/planning-artifacts/ux-design-specification.md` (~740 行)
- Epics: `_bmad-output/planning-artifacts/epics.md`（黑客松版 7 个 Epic，全部已实现）
- Change Proposal: `correct-course-change-proposal`（已批准，战略转向决策）
- Project Context: `docs/project-context.md`（代码库扫描，15 个模式 + 12 条 AI Agent 规则）

---

## Project Context Analysis

### Requirements Overview

**Functional Requirements（35 条，8 个功能域）：**

| 域 | FR 编号 | 数量 | 架构影响 |
|---|---------|------|---------|
| 用户认证 | FR1-FR4 | 4 | 需要 Supabase Auth + JWT + 微信 OAuth 流程 |
| 日记记录 | FR5-FR9 | 5 | 现有 UI 组件可复用，数据写入改为 Supabase |
| AI 互动 | FR10-FR14 | 5 | 需要双模式：平台 AI 代理 + BYOK 直调路由 |
| AI 额度管理 | FR15-FR19 | 5 | 需要 ai_usage 表 + 每日计数 + 订阅状态检查 |
| 情绪可视化 | FR20-FR22 | 3 | 现有波形图组件 95% 可复用 |
| 时间胶囊 | FR23-FR25 | 3 | 现有匹配逻辑 95% 可复用 |
| 数据管理 | FR26-FR30 | 5 | 需要 Supabase 实时订阅 + 本地缓存层 |
| 分享 | FR31-FR32 | 2 | 现有分享组件 95% 可复用 |
| 付费订阅 | FR33-FR35 | 3 | 需要 subscriptions 表 + 支付网关集成 |

**Non-Functional Requirements（23 条，6 个类别）：**

| 域 | NFR 编号 | 数量 | 架构影响 |
|---|---------|------|---------|
| 性能 | NFR1-NFR5 | 5 | 首屏优化、AI 响应超时、波形图渲染性能 |
| 安全 | NFR6-NFR10 | 5 | TLS 加密、API Key 加密、RLS 行级安全、强哈希 |
| 可用性 | NFR11-NFR13 | 3 | 离线优先、99.5% SLA、自动同步 |
| 可扩展 | NFR14-NFR15 | 2 | 1K→10K DAU 无需架构变更 |
| 合规 | NFR16-NFR23 | 8 | GDPR 导出/删除、隐私政策、危机词检测、敏感健康数据分类、年龄确认 |
| 成本 | NFR20-NFR21 | 2 | AI 成本 ≤ 40% 收入、成本看板 |

**Scale & Complexity:**

- Primary domain: 全栈 Web App + 跨平台（Next.js + Taro + Supabase BaaS）
- Complexity level: 中（medium）— 商业级产品但团队仅 1 人
- Estimated architectural components: ~12

### Technical Constraints & Dependencies

- Next.js 16.2.3 App Router + TypeScript strict mode（**不是传统 Next.js**，有 breaking changes）
- React 19.2.4（Server Components 默认）
- TailwindCSS v4（`@theme` 指令，非 v3 配置方式）
- 现有代码：Zustand 5.0.12 + idb 8.0.3 + Framer Motion 12.38.0 + shadcn/ui
- Supabase（PostgreSQL + Auth + Realtime + RLS + Storage）
- 阿里云百炼 API（OpenAI 兼容接口，qwen-turbo 模型）
- 微信 OAuth 登录（小程序原生 + Web OAuth）
- 支付网关：微信支付 + 支付宝
- Taro 跨平台（小程序 + App RN/H5 壳）
- 目标用户场景：碎片化记录（小程序）、深度使用（Web）、高频推送（App）

### Cross-Cutting Concerns Identified

1. **数据持久化层** — 统一封装 IndexedDB（本地缓存）+ Supabase（云端），定义 CacheProvider 接口
2. **AI 调用管道** — 超时控制 + 降级 + 打字机动画 + BYOK 路由 + 限次逻辑
3. **离线处理** — pending 标记 + 异步重试 + 冲突解决（最后写入优先）
4. **情绪数据计算** — 7 天趋势聚合 + 表情映射（现有逻辑可复用）
5. **认证与鉴权** — JWT + RLS 策略 + 微信 OAuth 自定义流程
6. **成本监控** — AI 调用量按日/周/月统计，确保 ≤ 40% 收入

---

## Starter Template Evaluation

### Primary Technology Domain

全栈 Web App（Next.js App Router）基于 PRD 需求分析。

### Starter Options Considered

| 选项 | 命令 | 适用性 | 评估 |
|------|------|--------|------|
| **Turborepo 官方** | `pnpm create turbo@latest` | 中 | 官方维护，支持 pnpm workspaces + Next.js，但需要迁移现有代码 |
| **next-forge** | `git clone vercel/next-forge` | 低 | 生产级但包含大量不需要的组件（Auth、Analytics、Billing），需大量清理 |
| **从零搭建 Monorepo** | 手动配置 | 低 | 最灵活但工程量大，不适合 1 人项目 |
| **保留现有项目** | 现有 `xiaozhi-journal/` | **高** | 代码已完整可用，Phase 1-2 只需要 Web 端 |

### Selected Starter: 保留现有 `xiaozhi-journal/` 项目

**Rationale for Selection:**

PRD 已明确技术栈，现有项目已完整实现 7 个 Epic（约 20 个 Story），包含所有核心 UI 组件。Phase 1-2 只需要 Web 端，Monorepo 迁移是额外工作量。决定：保留现有项目作为 Phase 1-2 的起点，Phase 3 需要 Taro 时再迁移为 Monorepo。

**Architectural Decisions Provided by Starter:**

**Language & Runtime:** TypeScript 5.x，strict mode 开启，ES2017 target

**Styling Solution:** TailwindCSS v4 + `@theme` 指令，PostCSS 已配置，"暖日"色板已定义

**Build Tooling:** Next.js 16.2.3 内置 Turbopack 开发服务器，生产构建优化

**Testing Framework:** 未预设（本项目手动验证，不写单元测试）

**Code Organization:** `src/` 目录 + App Router 文件路由，`@/*` 别名到 `./src/*`

**Development Experience:** 热更新、Fast Refresh、TypeScript 类型检查

**需要额外安装的依赖（Phase 1）：**

| 依赖 | 用途 |
|------|------|
| `@supabase/supabase-js` | Supabase 客户端 SDK |
| （其余现有依赖保持不变） | — |

**Phase 3 Monorepo 迁移（届时执行）：**

```bash
pnpm create turbo@latest xiaozhi-journal-monorepo
```

迁移现有 `xiaozhi-journal/` 到 `apps/web/`，新增 `apps/miniapp/`（Taro），`packages/shared/`（共享类型 + 业务逻辑）。

**Note:** 现有项目即为起点，第一个实现任务是 Supabase 集成而非项目初始化。

---

## Core Architectural Decisions

### Decision Priority Analysis

**Critical Decisions (Block Implementation):**
- Supabase 数据模型设计（6 张表 + RLS 策略）
- 认证流程（Supabase Auth + 邮箱登录）
- AI 双模式管道（平台限次 + BYOK 直调）
- 离线优先架构（IndexedDB 缓存层 + 自动同步）
- 行级安全策略（用户数据隔离）

**Important Decisions (Shape Architecture):**
- 冲突解决策略（最后写入优先）
- API Key 应用层加密（AES-256-GCM）
- 限次逻辑（服务端检查 ai_usage 表）
- Server/Client 组件边界
- Vercel + Supabase 部署策略

**Deferred Decisions (Post-MVP):**
- Monorepo 迁移（Phase 3，需要 Taro 时执行）
- 微信 OAuth 登录（Phase 3）
- CI/CD 高级功能（Phase 4）
- 错误监控 Sentry（Phase 4）
- 多语言支持（Post-MVP）

### Data Architecture

**数据库：Supabase PostgreSQL**

| 表名 | 核心字段 | 说明 |
|------|---------|------|
| `profiles` | id, email, nickname, avatar_url, created_at | 用户档案 |
| `journals` | id, user_id, content, mood, mood_emoji, ai_response, golden_quote, mood_label, created_at, status | 日记（RLS：仅本人）|
| `ai_usage` | id, user_id, date, platform_calls, byok_calls, tier | 每日 AI 使用量 |
| `user_api_keys` | id, user_id, encrypted_key, provider, is_active | 用户 API Key（AES-256-GCM 加密）|
| `subscriptions` | id, user_id, tier, status, start_date, end_date | 订阅计划 |
| `app_meta` | id, user_id, key, value | 用户级元数据 |

**数据迁移策略：** Phase 1 保留 IndexedDB 作为本地缓存层，数据先写本地再同步到 Supabase。旧黑客松版本数据通过迁移工具导入。

**缓存策略：** IndexedDB 作为本地缓存层，定义统一的 `CacheProvider` 接口（get/set/sync/delete），上层业务不关心具体存储实现。

**冲突解决：** 多端同时编辑时，以最后写入时间为准（last-write-wins），用户不会丢失任何日记。

### Authentication & Security

#### 认证方式

**Phase 1:** Supabase Auth（邮箱/密码）
**Phase 3:** 微信 OAuth（小程序原生 + Web OAuth）

#### 邮箱确认策略

**强制邮箱确认：** 用户注册后必须验证邮箱才能登录。

**双模式确认：**
| 模式 | 说明 | 实现 |
|------|------|------|
| 链接确认 | 发送确认链接，点击即验证 | Supabase 默认 |
| 验证码确认 | 发送 6 位数字验证码，用户输入验证 | 自定义 OTP |

**有效期：** 验证码/确认链接有效期 10 分钟，过期需重新申请。

**未验证账户清理：** 7 天后自动清理未验证邮箱的账户。

#### 密码策略

| 规则 | 要求 | 验证位置 |
|------|------|---------|
| 长度 | ≥ 8 位 | 前端 + 后端 |
| 复杂度 | 包含大小写字母和数字 | 前端 + 后端 |
| 一致性 | 前后端策略一致 | Supabase 配置 + 注册表单 |

**重置密码：**
- 验证链接有效期 1 小时
- 修改密码需重新认证（secure_password_change = true）

#### 暴力破解防护

**速率限制：**
| 参数 | 值 |
|------|-----|
| 登录尝试窗口 | 5 分钟 |
| 最大尝试次数 | 10 次 |
| 超限处理 | 需验证码 |

**可选增强：** Cloudflare Turnstile CAPTCHA（Phase 4）

#### Session 管理

| 参数 | 值 | 说明 |
|------|-----|------|
| JWT 过期时间 | 1 小时 | Access token |
| Refresh token | 自动轮换 | Supabase 内置 |
| Session 超时 | 7 天不活动 | 自动登出 |
| 最大生命周期 | 30 天 | 强制重新登录 |

#### API Key 存储

**用户 BYOK Key：** 应用层 AES-256-GCM 加密存储于 `user_api_keys` 表。

**加密参数：**
| 参数 | 值 |
|------|-----|
| 算法 | AES-256-GCM |
| 密钥派生 | scrypt（N=2^14, r=8, p=1）|
| Salt | 随机生成，与加密数据分离存储 |

**平台 AI Key：** 服务端 Route Handler 代理调用，不暴露客户端。

#### 密码哈希

**算法：** bcrypt（Supabase Auth 内置）

| 参数 | 值 |
|------|-----|
| 成本因子 | ≥ 10 |

#### 行级安全（RLS）

**策略原则：** 用户只能访问自己的数据。

```sql
-- journals 表 RLS
CREATE POLICY "Users can only access their own journals"
ON journals FOR ALL
USING (auth.uid() = user_id);

-- 所有业务表启用 RLS
ALTER TABLE journals ENABLE ROW LEVEL SECURITY;
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE ai_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE subscriptions ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_api_keys ENABLE ROW LEVEL SECURITY;
```

#### IndexedDB 数据隔离

**隔离策略：**
| 约定 | 说明 |
|------|------|
| 数据前缀 | 每个用户的 IndexedDB 数据使用 `{user_id}_` 前缀 |
| 退出清理 | 用户退出登录时清空 IndexedDB |

**实现：**
```ts
// lib/db.ts 修改
const getUserPrefix = (userId: string) => `${userId}_`;

// journals store key: {userId}_journal_{id}
// appMeta store key: {userId}_meta_{key}
```

#### 审计日志

**login_logs 表：**
```sql
CREATE TABLE login_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  login_time timestamptz NOT NULL DEFAULT now(),
  ip_address text,
  device_info text,
  login_method text CHECK (login_method IN ('email', 'wechat'))
);

CREATE INDEX idx_login_logs_user_id ON login_logs(user_id);
CREATE INDEX idx_login_logs_time ON login_logs(login_time DESC);

ALTER TABLE login_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own login logs"
  ON login_logs FOR SELECT USING (auth.uid() = user_id);
```

**security_events 表：**
```sql
CREATE TABLE security_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE CASCADE,
  event_type text NOT NULL CHECK (event_type IN (
    'password_change', 'email_change', 'api_key_add', 'api_key_delete'
  )),
  event_time timestamptz NOT NULL DEFAULT now(),
  ip_address text,
  details jsonb DEFAULT '{}'
);

CREATE INDEX idx_security_events_user_id ON security_events(user_id);
CREATE INDEX idx_security_events_time ON security_events(event_time DESC);

ALTER TABLE security_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can view own security events"
  ON security_events FOR SELECT USING (auth.uid() = user_id);
```

#### profiles 表扩展

**新增字段：**
```sql
ALTER TABLE profiles ADD COLUMN login_count int DEFAULT 0;
ALTER TABLE profiles ADD COLUMN last_login timestamptz;
ALTER TABLE profiles ADD COLUMN status text DEFAULT 'active'
  CHECK (status IN ('active', 'suspended', 'deleted'));
```

### API & Communication Patterns

**API 设计：** Next.js Route Handlers（REST 风格）

**端点规划：**
| 端点 | 方法 | 说明 |
|------|------|------|
| `/api/auth/*` | POST | Supabase Auth 代理 |
| `/api/journal` | POST | 保存日记 + 触发 AI（双模式：平台/BYOK）|
| `/api/journals` | GET | 分页获取日记列表 |
| `/api/journal/:id` | GET | 获取单条日记 |
| `/api/ai/usage` | GET | 获取当日 AI 使用量 |
| `/api/sync` | POST | 本地缓存同步到云端 |

**错误处理标准：** AI 失败返回 200 + `fromFallback: true`，不走 HTTP error code（现有模式延续）。

**BYOK 路由：** 同一端点 `/api/journal`，通过请求体 `useByok` 参数或用户设置决定使用平台 Key 还是用户 Key。

**限次逻辑：** 服务端 Route Handler 内嵌检查 `ai_usage` 表当日计数，免费用户每日 5 次上限。

### Frontend Architecture

**Server/Client 组件边界：**
- 交互组件（心情选择器、日记输入框、波形图等）：`"use client"`
- 页面/布局（首页、历史页等）：Server Components 默认
- AI 回应组件：Client（需要打字机动画）

**状态管理：** Zustand 单 store + Supabase 实时订阅扩展
```ts
// 现有 store 增加 Supabase sync
export const useJournalStore = create<JournalState & JournalActions>((set) => ({
  // ... 现有状态
  // 新增：Supabase 实时订阅
  subscribeToChanges: () => supabase.channel('journals')
    .on('postgres_changes', { event: '*', schema: 'public', table: 'journals' }, (payload) => {
      // 更新 Zustand store
    })
    .subscribe()
}))
```

**路由策略：** App Router（文件系统路由），现有模式延续。

**离线优先架构：**
```
用户输入 → 写 IndexedDB（本地缓存）→ 标记 sync pending
                                      ↓
                              后台同步 Supabase
                                      ↓
                              更新 Zustand store
                                      ↓
                              组件重渲染
```

**Bundle 优化：** Next.js 自动代码分割 + Tree shaking，现有配置足够。

### Infrastructure & Deployment

**Web 托管：** Vercel（Next.js 原生支持 + Supabase 集成）

**分支策略：** `master` → 开发环境（日常开发）；`main` → 生产环境（Vercel 自动部署）。

**Supabase 环境：** 开发库 + 生产库分离，两环境起步。

**CI/CD：** Vercel 自动部署（main → production），最简单方案。PR 合入 main 即触发生产部署。

**错误监控：** Sentry（免费额度够用），Phase 4 添加。

**扩展策略：** Supabase 自动扩展 + Vercel Serverless，支持 1K→10K DAU 无需架构变更。

### Decision Impact Analysis

**实现顺序：**
1. Supabase 项目初始化 + 数据模型 + RLS 策略
2. Supabase Auth 集成（邮箱登录）
3. 数据层迁移：IndexedDB → Supabase + 保留 IndexedDB 缓存层
4. AI 双模式管道：平台 Key 限次 + BYOK 直调
5. 限次逻辑：ai_usage 表 + 每日计数
6. 离线同步：本地写 → 后台同步 → 冲突解决
7. 实时订阅：Supabase channel → Zustand store 更新
8. 错误处理：Fallback 模式延续

**跨组件依赖：**
- Supabase Auth → 所有需要用户上下文的组件
- AI 双模式管道 → 限次逻辑 → BYOK 设置页
- IndexedDB 缓存层 → Supabase sync → 实时订阅 → Zustand store
- RLS 策略 → 所有数据查询（确保用户只能访问自己的数据）

---

## Implementation Patterns & Consistency Rules

### Naming Patterns

**Database Naming（Supabase PostgreSQL）：**

| 维度 | 约定 | 示例 |
|------|------|------|
| 表名 | `snake_case`（复数）| `profiles`, `ai_usage`, `user_api_keys` |
| 列名 | `snake_case` | `user_id`, `created_at`, `mood_label` |
| 外键 | `{table}_id` | `user_id`（指向 profiles.id）|
| 索引 | `idx_{table}_{column}` | `idx_journals_user_id` |
| 策略 | `{table}_{action}_{condition}` | `journals_select_own`, `journals_insert_auth` |

**API Naming：**

| 维度 | 约定 | 示例 |
|------|------|------|
| REST 端点 | 复数名词，kebab-case | `/api/journals`, `/api/ai/usage` |
| 路由参数 | camelCase | `/api/journal/:id` |
| 查询参数 | camelCase | `?userId=xxx&limit=20` |

**Code Naming：**

| 维度 | 约定 | 示例 |
|------|------|------|
| 组件文件 | kebab-case | `mood-selector.tsx`, `journal-input.tsx` |
| 组件导出 | PascalCase | `export function MoodSelector()` |
| 函数 | camelCase | `fetchJournals()`, `syncToSupabase()` |
| 变量 | camelCase | `userId`, `goldenQuote` |
| lib 文件 | camelCase | `supabase.ts`, `encryption.ts` |

**JSON 字段映射：**

| 层 | 字段格式 | 说明 |
|---|---------|------|
| Supabase（DB 层） | `snake_case` | `golden_quote`, `mood_label` |
| API（传输层） | `camelCase` | `goldenQuote`, `moodLabel` |
| 前端（应用层） | `camelCase` | `goldenQuote`, `moodLabel` |

### Format Patterns

**JSON 字段：** 前端统一 `camelCase`

**日期格式：** ISO 8601 字符串 — `new Date().toISOString()`

**布尔值：** `true` / `false`

**API 响应格式：**

| 场景 | 格式 | 示例 |
|------|------|------|
| AI 成功 | `{ response, goldenQuote, moodLabel, fromFallback: false }` | 直接返回 |
| AI 降级 | `{ response, goldenQuote, moodLabel: "本地", fromFallback: true }` | 200 + fallback |
| 分页查询 | `{ data: [], meta: { page, total, hasMore } }` | 列表查询 |
| 通用错误 | `{ error: string }` | 非 AI 错误场景 |

**错误处理：**
- AI 失败 → 返回 200 + `fromFallback: true`，不走 HTTP error
- 其他错误 → 使用标准 HTTP status（400, 401, 500）+ `{ error: string }`

### State Management Patterns

| 约定 | 说明 |
|------|------|
| 更新方式 | 不可变更新：`set(state => ({ ...state, journals: [...state.journals, new] }))` |
| Loading 命名 | `loading`（全局加载）、`saving`（单条保存）、`aiWaiting`（等待 AI）|
| 错误存储 | `error: string \| null` |
| Source of Truth | Supabase → IndexedDB 缓存 → Zustand store → 组件渲染 |

### Error Handling Patterns

| 场景 | 处理方式 |
|------|----------|
| AI API 失败 | 返回 200 + `fromFallback: true`，不走 HTTP error |
| 网络断开 | 日记先写 IndexedDB，标记 `pending`，不报错 |
| 认证失败 | 重定向到登录页 |
| 组件级错误 | `error` state + 用户可见的中文提示 |
| 控制台日志 | 开发环境 `console.error`，生产环境静默 |

### Loading State Patterns

| 场景 | 表现 |
|------|------|
| AI 等待 | 打字机动画 + "小知正在想..." + 3 个跳动圆点 |
| 数据加载 | 骨架屏浅米色 `#F5EDE4` 闪烁（shadcn Skeleton）|
| 保存中 | 按钮变 disabled + 涟漪反馈 + loading 文案 |
| 同步中 | 静默后台同步，不阻塞用户操作 |
| 页面过渡 | 淡入淡出 0.3s（Framer Motion）|

### Enforcement Guidelines

**所有实现 MUST：**

- 数据库表名/列名使用 `snake_case`
- 前端 JSON 字段使用 `camelCase`
- 文件命名使用 kebab-case
- API 端点使用复数名词
- 日期使用 ISO 8601 字符串
- 错误通过 `error` state 展示给用户，不抛异常阻断
- AI 调用失败返回 200 + `fromFallback: true`
- Zustand state 使用不可变更新

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

// ❌ 暴露 HTTP error 给前端（AI 场景）
throw new Error('API failed')

// ❌ 数据库列名用 camelCase
CREATE TABLE journals (userId text) -- 应为 user_id
```

---

## Project Structure & Boundaries

### Complete Project Directory Structure

```
xiaozhi-journal/                           # Phase 1-2 单一项目（Phase 3 迁移为 Monorepo）
├── README.md
├── package.json                           # 新增：@supabase/supabase-js, crypto-js 等
├── next.config.ts                         # 现有
├── tailwind.config.ts                     # 现有：暖日色板 + 圆角
├── tsconfig.json                          # 现有
├── middleware.ts                          # 新增：路由鉴权中间件
├── .env.local                             # 现有 + 新增 Supabase 变量
├── .env.example                           # 更新：增加 Supabase 环境变量
├── .gitignore
├── components.json                        # shadcn/ui 配置
├── supabase/                              # 新增：Supabase 相关
│   ├── migrations/                        # 数据库迁移脚本
│   │   ├── 001_create_profiles.sql
│   │   ├── 002_create_journals.sql
│   │   ├── 003_create_ai_usage.sql
│   │   ├── 004_create_user_api_keys.sql
│   │   ├── 005_create_subscriptions.sql
│   │   └── 006_create_app_meta.sql
│   ├── seed.sql                          # 种子数据
│   └── config.toml                       # Supabase CLI 配置
├── public/
│   └── favicon.ico
├── src/
│   ├── app/
│   │   ├── layout.tsx                    # 现有：根布局 + Google Fonts
│   │   ├── page.tsx                      # 修改：增加登录态检查 + Onboarding
│   │   ├── globals.css                   # 现有：Tailwind + CSS 变量
│   │   ├── auth/                         # 新增：认证相关页面
│   │   │   ├── login/page.tsx            # 邮箱登录/注册页
│   │   │   └── callback/page.tsx         # Supabase Auth 回调
│   │   ├── settings/                     # 新增：用户设置
│   │   │   └── page.tsx                  # BYOK 配置、额度查看、订阅管理
│   │   ├── paywall/                      # 新增：付费墙
│   │   │   └── page.tsx                  # 免费版 vs 付费版权益对比 + 支付
│   │   ├── history/                      # 现有
│   │   │   ├── page.tsx                  # 历史日记列表（分页）
│   │   │   └── [id]/page.tsx             # 单条日记详情
│   │   └── api/
│   │       ├── auth/                     # 新增：认证 API
│   │       │   └── login/route.ts        # 邮箱登录/注册
│   │       ├── journal/                  # 修改：增加用户鉴权
│   │       │   ├── route.ts              # POST: 保存日记 + AI（双模式）
│   │       │   └── [id]/route.ts         # GET: 获取单条日记
│   │       ├── journals/route.ts         # 新增：GET 分页获取日记列表
│   │       ├── ai/
│   │       │   └── usage/route.ts        # 新增：GET 当日 AI 使用量
│   │       └── sync/route.ts             # 新增：POST 本地缓存同步
│   ├── components/
│   │   ├── ui/                           # shadcn/ui 源码级组件（现有）
│   │   │   ├── button.tsx
│   │   │   ├── card.tsx
│   │   │   ├── textarea.tsx
│   │   │   ├── dialog.tsx
│   │   │   └── skeleton.tsx
│   │   ├── mood-selector.tsx             # 现有：5 表情选择器
│   │   ├── journal-input.tsx             # 现有：日记输入框
│   │   ├── emotion-chart.tsx             # 现有：波形图（95% 复用）
│   │   ├── emotion-tooltip.tsx           # 现有：波形图 hover 气泡
│   │   ├── golden-quote.tsx              # 现有：金句卡片（95% 复用）
│   │   ├── typewriter.tsx                # 现有：打字机效果
│   │   ├── xiaozhi-bubble.tsx            # 现有：小知回应气泡
│   │   ├── typing-indicator.tsx          # 现有："小知正在想..."
│   │   ├── empty-state.tsx               # 现有：空状态引导
│   │   ├── capsule-popup.tsx             # 现有：时间胶囊弹窗
│   │   └── share-card.tsx               # 现有：分享卡片
│   ├── lib/
│   │   ├── db.ts                         # 修改：IndexedDB 缓存层 + Supabase sync
│   │   ├── supabase.ts                   # 新增：Supabase 客户端初始化
│   │   ├── ai.ts                         # 修改：支持双模式（平台 Key + BYOK）
│   │   ├── auth.ts                       # 新增：认证工具函数
│   │   ├── encryption.ts                 # 新增：AES-256-GCM 加密/解密
│   │   ├── billing.ts                    # 新增：额度管理 + 计费逻辑
│   │   ├── seed-data.ts                  # 现有：演示数据
│   │   ├── share-card-renderer.ts        # 现有：Canvas 分享卡片生成
│   │   ├── time-capsule.ts               # 现有：时间胶囊匹配逻辑
│   │   └── utils.ts                      # 现有：cn() 等工具函数
│   ├── store/
│   │   └── journal.ts                    # 修改：增加 Supabase 实时订阅
│   ├── types/
│   │   └── index.ts                      # 修改：增加 User, Subscription, AIUsage
│   └── middleware.ts                      # 新增：Next.js 路由鉴权（同根目录或 src/）
├── docs/
│   └── project-context.md                # AI Agent 规则文档
└── _bmad-output/                         # BMad 输出
    ├── planning-artifacts/
    └── implementation-artifacts/
```

### Architectural Boundaries

**API Boundaries:**
- `/api/auth/*` — 认证相关，需要 Supabase Auth
- `/api/journal` (POST) — 需要用户鉴权 + AI 限次/BYOK 检查
- `/api/journals` (GET) — 需要用户鉴权 + 分页
- `/api/ai/usage` (GET) — 需要用户鉴权
- `/api/sync` (POST) — 需要用户鉴权 + 批量写入

**Component Boundaries:**
- 所有组件通过 Zustand store 通信
- 不直接 props 传递跨组件数据
- 组件职责单一：每个组件只做一件事

**Service Boundaries:**
- `lib/supabase.ts` — 唯一 Supabase 客户端入口
- `lib/db.ts` — 唯一 IndexedDB 操作入口（缓存层）
- `lib/ai.ts` — 唯一 AI 调用入口（双模式）
- `lib/auth.ts` — 唯一认证工具函数入口
- `lib/encryption.ts` — 唯一加密/解密入口
- `lib/billing.ts` — 唯一额度管理入口
- `store/journal.ts` — 唯一状态管理入口

**Data Boundaries:**
- Supabase 是云端唯一数据源（6 张表）
- IndexedDB 是本地缓存层（journals + appMeta 两表）
- 数据流向：用户输入 → IndexedDB → Supabase sync → store → 组件渲染

### Requirements to Structure Mapping

| 需求 | 实现位置 |
|------|----------|
| FR1-FR4: 用户认证 | `app/auth/login/page.tsx` + `lib/auth.ts` + `middleware.ts` |
| FR5-FR9: 日记记录 | `components/mood-selector.tsx` + `journal-input.tsx` + `lib/db.ts` |
| FR10-FR14: AI 互动 | `app/api/journal/route.ts` + `lib/ai.ts` |
| FR15-FR19: AI 额度管理 | `lib/billing.ts` + `app/api/ai/usage/route.ts` |
| FR20-FR22: 情绪可视化 | `components/emotion-chart.tsx` |
| FR23-FR25: 时间胶囊 | `lib/time-capsule.ts` + `components/capsule-popup.tsx` |
| FR26-FR30: 数据管理 | `lib/db.ts` + `lib/supabase.ts` + `app/api/sync/route.ts` |
| FR31-FR32: 分享 | `components/golden-quote.tsx` + `share-card.tsx` |
| FR33-FR35: 付费订阅 | `app/paywall/page.tsx` + `app/settings/page.tsx` |

### Integration Points

**Internal Communication:**
```
用户 → 登录/注册 → Supabase Auth → JWT Token
                                      ↓
                          Zustand store (用户上下文)
                                      ↓
用户 → MoodSelector → JournalInput → lib/db.ts (IndexedDB 缓存)
                                      ↓
                              lib/supabase.ts (云端同步)
                                      ↓
                              app/api/journal/route.ts → AI 调用
                                      ↓
                              lib/ai.ts (平台 Key / BYOK)
                                      ↓
                              Zustand store 更新 → 组件重渲染
```

**External Integrations:**
- Supabase（PostgreSQL + Auth + Realtime）— 通过 `@supabase/supabase-js` SDK
- 阿里云百炼 API（OpenAI 兼容接口）— 通过 `/api/journal` 代理
- 微信支付/支付宝（Phase 2）— 通过支付 API 端点

**Data Flow:**
- 写入：用户输入 → `lib/db.ts` (IndexedDB) → `lib/supabase.ts` (Supabase) → `store/journal.ts` → 组件渲染
- 读取：页面加载 → `lib/supabase.ts` (Supabase) → `store/journal.ts` → 组件渲染
- 离线：用户输入 → `lib/db.ts` (IndexedDB) → 标记 pending → 网络恢复 → `app/api/sync/route.ts` → Supabase

### File Organization Patterns

**Configuration Files:** 根目录标准 Next.js 配置（`next.config.ts`, `tailwind.config.ts`, `tsconfig.json`）
**Source Organization:** `src/` 下按职责分组（`app/`, `components/`, `lib/`, `store/`, `types/`）
**Test Organization:** 本项目不写单元测试，手动验证
**Asset Organization:** `public/` 存放静态资源
**Migration Organization:** `supabase/migrations/` 按序号前缀排序

---

## Architecture Validation Results

> 基于 2026-04-21 Sprint Change Proposal（基础设施缺口分析），经 Party Mode 多视角审查（Winston/Amelia/Victor）后确认的架构决策。

### Coherence Validation ✅

**Decision Compatibility：** Next.js 16 + React 19 + Supabase + Zustand 技术栈一致。新增 DirectMail、支付宝当面付、events 表均复用现有 Supabase SDK 连接，无新依赖冲突。

**Pattern Consistency：** 新增基础设施遵循现有命名规范（DB `snake_case`，前端 JSON `camelCase`，文件 `kebab-case`）和错误处理模式（200 + `fromFallback`）。

**Structure Alignment：** 现有目录结构支持新增 Epic，需补充 `lib/analytics.ts`、`lib/email.ts`、`lib/payments/`。

### Requirements Coverage Validation ✅

**16 Epic 架构支持：** Epic 1-11 已有完整架构决策。Epic 12-16 新增架构决策如下表。

**NFR 覆盖（含新增 NFR24-NFR26）：**

| NFR | 架构决策 | 状态 |
|-----|---------|------|
| NFR24（SMTP 邮件） | 阿里云 DirectMail + Supabase SMTP 配置 | ✅ 已确认 |
| NFR25（PIPL 合规） | `events` 表 `consent_given` 字段 + IP 哈希不存明文 | ✅ 已确认 |
| NFR26（代码质量基线） | GitHub Actions CI：lint + type-check + build + test | ✅ 已确认 |

### Implementation Readiness Validation ✅

**Decision Completeness：** 核心决策完整，新增 4 项架构决策已确认。

**Structure Completeness：** 目录结构需新增：
- `src/lib/analytics.ts` — 事件追踪 SDK
- `src/lib/email.ts` — 邮件发送封装
- `src/lib/payments/` — 支付相关（MVP 阶段暂不实现）
- `src/app/api/events/route.ts` — 事件写入端点

**Pattern Completeness：** 支付 Webhook 模式（Phase 2）和邮件发送模式（Phase 2）已定义策略，具体实现留给 Story 阶段。

### Gap Analysis Results

**已确认的架构决策（4 项 Critical Gaps 已关闭）：**

| 决策 | 选型 | 理由 |
|------|------|------|
| 邮件服务 | **阿里云 DirectMail** | 国内可达性，免费 2000 封/天，ICP 备案合规 |
| AI 成本计量 | **ai_usage 扩 5 字段** | 最小改动，满足 NFR20-21 成本看板 |
| 事件追踪 | **Supabase 自建 events 表** | 不发往境外 SaaS，PIPL 合规 |
| 支付通道 | **MVP 手动转账 → Phase 2 支付宝当面付** | 个人开发者无法申请微信/支付宝原生 JSAPI |

**Important Gaps（Story 阶段解决）：**

| 缺口 | 解决阶段 |
|------|---------|
| 支付 Webhook 安全验证 | Epic 14 Story 14.1 |
| 自定义域名国内可达性 | Epic 13 Story 13.5 |
| 数据库备份 retention | Epic 13 Story 13.6 |

### Architecture Completeness Checklist

**✅ Requirements Analysis**
- [x] 项目上下文已分析
- [x] 规模和复杂度已评估
- [x] 技术约束已识别
- [x] 跨领域关注点已映射

**✅ Architectural Decisions**
- [x] 关键决策已文档化（含新增 4 项基础设施选型）
- [x] 技术栈已完整指定
- [x] 集成模式已定义
- [x] 性能考虑已覆盖

**✅ Implementation Patterns**
- [x] 命名规范已建立
- [x] 结构模式已定义
- [x] 通信模式已指定
- [x] 流程模式已文档化

**✅ Project Structure**
- [x] 完整目录结构已定义
- [x] 组件边界已建立
- [x] 集成点已映射
- [x] 需求到结构映射已完成

### New Infrastructure Architecture Decisions

#### Email Service: 阿里云 DirectMail

**决策：** 使用阿里云 DirectMail（邮件推送）作为 SMTP 提供商，通过 Supabase Auth SMTP 配置集成。

**Rationale：** Resend 基于 AWS SES，国内 IP 段被运营商屏蔽，送达率不稳定。DirectMail 国内服务，免费 2000 封/天，支持 ICP 备案域名。

**配置方式：**
```toml
# supabase/config.toml
[auth.email.smtp]
enabled = true
host = "smtpdm.aliyun.com"
port = 465
secure = true
user = "<发信地址>"
pass = "<SMTP 密码>"
```

**环境变量：**
```
SUPABASE_SMTP_HOST=smtpdm.aliyun.com
SUPABASE_SMTP_PORT=465
SUPABASE_SMTP_USER=noreply@yourdomain.com
SUPABASE_SMTP_PASS=<password>
SUPABASE_SMTP_ADMIN_EMAIL=noreply@yourdomain.com
```

#### Event Tracking: Supabase 自建 events 表

**决策：** 在 Supabase 创建 `events` 表，封装 `lib/analytics.ts` 通过 API 端点写入。

**Rationale：** PostHog/GA4/Plausible 对国内用户不友好（CDN 慢、隐私合规）。Supabase 本身就是事件存储的好后端。

**Table Schema：**
```sql
CREATE TABLE IF NOT EXISTS events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES profiles(id) ON DELETE SET NULL,
  event_name text NOT NULL,
  event_type text NOT NULL CHECK (event_type IN ('page_view', 'action', 'error', 'performance')),
  properties jsonb DEFAULT '{}',
  session_id text,
  page_url text,
  user_agent text,
  ip_hash text,
  consent_given boolean DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_events_user_id ON events(user_id);
CREATE INDEX idx_events_name ON events(event_name);
CREATE INDEX idx_events_created_at ON events(created_at DESC);

ALTER TABLE events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert events"
  ON events FOR INSERT WITH CHECK (true);

CREATE POLICY "Users can view own events"
  ON events FOR SELECT
  USING (auth.uid() = user_id OR auth.uid() IS NULL);
```

**核心事件集（MVP）：**

| 事件名 | 类型 | 用途 |
|--------|------|------|
| `signup_start` | action | 开始注册 |
| `signup_complete` | action | 注册成功 |
| `journal_create` | action | 创建日记 |
| `ai_response_received` | action | AI 回应接收 |
| `paywall_view` | page_view | 付费墙曝光 |
| `payment_start` | action | 发起支付 |
| `payment_complete` | action | 支付成功 |
| `page_view` | page_view | 页面浏览 |
| `sync_error` | error | 同步失败 |

#### AI Cost Tracking: ai_usage 表扩展

**决策：** 扩展现有 `ai_usage` 表，增加 token 计量和成本字段。

**Rationale：** 当前只记录调用次数，无法实现 NFR20（成本 ≤ 40% 收入）。需要 token 级别的计量。

**扩展字段：**
```sql
ALTER TABLE ai_usage ADD COLUMN platform_tokens_input int DEFAULT 0;
ALTER TABLE ai_usage ADD COLUMN platform_tokens_output int DEFAULT 0;
ALTER TABLE ai_usage ADD COLUMN platform_cost_cents int DEFAULT 0;
ALTER TABLE ai_usage ADD COLUMN byok_tokens_input int DEFAULT 0;
ALTER TABLE ai_usage ADD COLUMN platform_errors int DEFAULT 0;
ALTER TABLE ai_usage ADD COLUMN avg_response_ms int;
```

**成本计算逻辑（`lib/billing.ts`）：**
```ts
const MODEL_COSTS = {
  'qwen-turbo': { input: 0.0003, output: 0.0006 },
  'qwen-plus':  { input: 0.0008, output: 0.0016 },
  'qwen-max':   { input: 0.004,  output: 0.012  },
};
```

**注意：** 只计算平台 AI 成本。BYOK 模式下用户用自己的 Key，成本由用户承担。

#### Payment Channel: MVP 手动 → Phase 2 支付宝当面付

**决策：** MVP 阶段用收款码 + 手动确认开通 Pro。Phase 2 注册个体工商户后接支付宝当面付。

**Rationale：** 个人开发者无法申请微信支付/支付宝原生 JSAPI（需要企业资质）。MVP 阶段手动转账是独立开发者社区标准做法。

**Phase 2 自动化支付架构：**
```
用户 → 点击"升级" → 展示支付宝收款码
     → 转账后填写交易单号
     → 后端验证 → 更新 subscriptions 表
     → 发送订阅确认邮件
```

**Phase 3 支付宝当面付（自动化）：**
```
用户 → 点击"升级" → 生成支付宝订单 → 展示支付二维码
     → 用户扫码支付 → Webhook 回调 → 自动开通
```

**数据库扩展：**
```sql
ALTER TABLE subscriptions ADD COLUMN payment_channel text;
ALTER TABLE subscriptions ADD COLUMN payment_order_no text;
ALTER TABLE subscriptions ADD COLUMN auto_renew boolean DEFAULT false;
```

### Architecture Readiness Assessment

**Overall Status:** READY FOR IMPLEMENTATION

**Confidence Level:** HIGH — 核心架构完整，新增基础设施为成熟技术集成

**Key Strengths:**
- 离线优先架构完整（IndexedDB → Supabase sync）
- AI 双模式管道清晰（平台限次 + BYOK）
- RLS 行级安全策略完整
- 命名规范和错误处理模式一致
- 新增 4 项基础设施选型已确认

**Areas for Future Enhancement:**
- 支付 Webhook 安全验证（Phase 2）
- ✅ 自定义域名国内可达性方案 — **已解决**：Cloudflare Proxy + `xiaozhi-journal.keidesu.top`（2026-04-26）
- 限流中间件（Epic 14 Story 14.3）
- 安全扫描自动化（Epic 15 Story 15.4）

### Implementation Handoff

**AI Agent Guidelines:**
- 严格按架构文档实现
- 新增基础设施遵循现有命名规范和错误处理模式
- 邮件服务优先配置阿里云 DirectMail SMTP
- 事件追踪走 Supabase 自建路线，不发往境外 SaaS
- 支付 MVP 阶段手动，Phase 2 再自动化

**Implementation Priority（按依赖关系）：**
1. SMTP 邮件服务（阻塞 Epic 8 Story 8.3 密码重置）
2. `ai_usage` 表扩展（Epic 12 Story 12.2 成本写入前置）
3. `events` 表创建 + `lib/analytics.ts`（Epic 12 Story 12.1）
4. 开发体验治理（Epic 15，立即可做，不依赖用户功能）
