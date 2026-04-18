---
stepsCompleted: ["step-01-validate-prerequisites", "step-02-design-epics", "step-03-create-stories"]
inputDocuments:
  - 'prd.md'
  - 'architecture.md'
  - 'ux-design-specification.md'
---

# Xiaozhi Journal - Epic Breakdown

## Overview

This document provides the complete epic and story breakdown for Xiaozhi Journal, decomposing the requirements from the PRD, UX Design, and Architecture documents into implementable stories.

本文档针对商业级 Freemium 情感陪伴日记应用，涵盖 4 阶段开发计划（Phase 1-4），包含用户认证、云端数据同步、AI 双模式管道、付费订阅、多平台扩展等全新 Epic。

## Requirements Inventory

### Functional Requirements

**用户认证（FR1-FR4）：**
- **FR1**: 用户可通过邮箱注册并登录（邮箱 + 密码）
- **FR2**: 用户可通过微信一键登录（OAuth 2.0）
- **FR3**: 用户可重置密码（邮箱验证链接）
- **FR4**: 用户可管理个人资料（昵称、头像）

**日记记录（FR5-FR9）：**
- **FR5**: 用户可以选择心情表情（😊 😐 😔 😡 😴）来记录当天情绪
- **FR6**: 用户可以输入自由文本来记录日记内容
- **FR7**: 用户可以保存日记条目
- **FR8**: 用户可以查看自己的历史日记列表（支持分页）
- **FR9**: 用户可以查看单条日记的详情（内容 + AI 回应 + 金句）

**AI 互动（FR10-FR14）：**
- **FR10**: 用户在保存日记后可以获得 AI 的回应
- **FR11**: 用户可以收到 AI 提炼的"今日金句"
- **FR12**: 用户可以获得 AI 基于最近 7 天情绪数据生成的趋势总结
- **FR13**: 用户可以在 AI 回应失败时看到清晰的中文降级提示，不影响已保存的日记内容
- **FR14**: 用户可配置自己的 API Key（BYOK），用于替代平台 AI 调用

**AI 额度管理（FR15-FR19）：**
- **FR15**: 免费用户每日可使用有限次平台 AI（默认 5 次/天）
- **FR16**: 付费用户无限次使用平台 AI
- **FR17**: BYOK 用户不限次数，使用自己的 API Key 调用
- **FR18**: 用户可查看当日剩余 AI 额度
- **FR19**: 额度用尽时，系统温和引导用户升级或配置 BYOK

**情绪可视化（FR20-FR22）：**
- **FR20**: 用户可以查看最近 7 天的情绪趋势波形图
- **FR21**: 用户可以在波形图上看到每条记录对应的心情表情
- **FR22**: 用户在没有数据时可以看到引导性空状态

**时间胶囊（FR23-FR25）：**
- **FR23**: 用户可以收到系统推送的多时间窗口梯度日记提醒（周年/半年/季度），标题根据实际时间差动态生成
- **FR24**: 用户可以点击查看被推送的历史日记
- **FR25**: 系统对时间胶囊进行频率控制（24h 不重复、同一篇 30 天冷却）

**数据管理（FR26-FR30）：**
- **FR26**: 用户的日记数据在云端数据库中持久化存储，跨设备同步
- **FR27**: 用户的日记在网络断开时仍可保存到本地缓存，网络恢复后自动同步到云端
- **FR28**: 多端同时编辑时，系统以最后写入时间为准解决冲突
- **FR29**: 用户可随时导出自己的全部日记数据
- **FR30**: 用户可随时删除自己的账户和全部数据

**分享（FR31-FR32）：**
- **FR31**: 用户可以将金句生成为可分享的卡片图片
- **FR32**: 用户可通过微信分享金句卡片（小程序端原生分享，Web 端图片分享）

**付费与订阅（FR33-FR35）：**
- **FR33**: 用户可查看免费版与付费版的权益对比
- **FR34**: 用户可通过微信支付或支付宝完成订阅
- **FR35**: 用户可随时取消订阅，已付费权益持续到当前周期结束

### NonFunctional Requirements

**性能（NFR1-NFR5）：**
- **NFR1**: Web 首屏加载时间 ≤ 2 秒（用户打开到看到波形图和心情选择器）
- **NFR2**: 小程序首屏加载时间 ≤ 1.5 秒
- **NFR3**: AI 回应 P95 响应时间 ≤ 3s，P99 ≤ 8s
- **NFR4**: 情绪波形图渲染 ≤ 500ms
- **NFR5**: 多端数据同步延迟 ≤ 3 秒（网络正常）

**安全（NFR6-NFR10）：**
- **NFR6**: 所有用户数据在传输中使用 TLS 1.2+ 加密（通过安全审计/渗透测试验证）
- **NFR7**: 用户 API Key 在存储时使用加密存储或应用层加密（通过安全审计/渗透测试验证）
- **NFR8**: 平台 AI API Key 不暴露到客户端，通过服务端代理调用（通过安全审计/渗透测试验证）
- **NFR9**: 用户密码使用强哈希算法（如 bcrypt/argon2）存储（通过安全审计/渗透测试验证）
- **NFR10**: 行级安全（RLS）确保用户只能访问自己的数据（通过安全审计/渗透测试验证）

**可用性（NFR11-NFR13）：**
- **NFR11**: 系统月度可用性 ≥ 99.5%（SLA）
- **NFR12**: 离线状态下用户可写日记、看波形图、回顾历史，数据不丢失
- **NFR13**: 网络恢复后本地缓存数据自动同步到云端，无需用户手动操作

**可扩展性（NFR14-NFR15）：**
- **NFR14**: 系统支持从 1K DAU 增长到 10K DAU 无需架构变更（通过云服务自动扩展）
- **NFR15**: AI 调用成本随用户增长线性可控，不因并发增加而失控

**合规（NFR16-NFR19, NFR22-NFR23）：**
- **NFR16**: 用户可随时导出自己的全部数据（GDPR 数据可携带权）
- **NFR17**: 用户删除账户后，数据在 30 天内彻底清除（GDPR 被遗忘权）
- **NFR18**: 应用提供隐私政策页面，说明数据收集、存储、使用方式
- **NFR19**: 危机词检测不做医疗诊断，仅提供温柔引导和专业帮助资源链接
- **NFR22**: 情绪日记数据分类为敏感健康数据，适用更严格的存储和访问保护标准
- **NFR23**: 用户注册时确认适用年龄（18+）或需要监护人同意

**成本可控（NFR20-NFR21）：**
- **NFR20**: 平台 AI 调用成本不超过总收入的 40%
- **NFR21**: 系统提供 AI 调用成本看板（按日/周/月统计）

### Additional Requirements

**架构决策（来自 architecture.md）：**
- 保留现有 `xiaozhi-journal/` 项目作为 Phase 1-2 起点（70%+ 前端组件可复用）
- Phase 3 迁移为 Monorepo：`pnpm create turbo@latest`，结构 `apps/web/` + `apps/miniapp/` + `packages/shared/`
- Next.js 16.2.3 App Router + TypeScript strict mode（有 breaking changes，非传统 Next.js）
- React 19.2.4（Server Components 默认），`"use client"` 仅用于交互组件
- TailwindCSS v4（`@theme` 指令，非 v3 `theme()` 配置）
- Supabase PostgreSQL 6 张表：profiles, journals, ai_usage, user_api_keys, subscriptions, app_meta
- 行级安全（RLS）策略：每个用户只能访问自己的数据
- 双模式 AI 管道：平台 AI（限次，通过 Route Handler 代理）+ BYOK（用户 Key 直调）
- 离线优先架构：IndexedDB 本地缓存 → Supabase 后台同步 → Zustand store 更新
- 冲突解决策略：最后写入优先（last-write-wins）
- API Key 应用层加密：AES-256-GCM 存储于 `user_api_keys` 表
- 限次逻辑：服务端 Route Handler 内嵌检查 `ai_usage` 表当日计数
- 数据库命名：`snake_case`（表名/列名），前端 JSON：`camelCase`
- 文件命名：kebab-case 组件文件，PascalCase 导出
- 错误处理：AI 失败返回 200 + `fromFallback: true`，不走 HTTP error
- Vercel 托管 + Supabase 集成，开发/生产两环境
- Phase 3 新增：Taro 跨平台（小程序 + App RN/H5 壳），统一 CacheProvider 接口
- Phase 4 新增：CI/CD 自动部署（main → production），Sentry 错误监控

### UX Design Requirements

**设计 Token 系统：**
- **UX-DR1**: 「暖日」色板 — 12 个颜色 Token（bg-primary `#FDF8F5`, primary `#E8C4A0`, accent `#D4856A`, secondary `#F5EDE4` 等）
- **UX-DR2**: 间距系统 — 8px 基础，xs ~ 3xl 共 7 级
- **UX-DR3**: 圆角系统 — sm=8px, md=12px, lg=16px, xl=24px, 2xl=24px, 3xl=32px
- **UX-DR4**: 阴影系统 — sm/md/lg 三级暖灰阴影
- **UX-DR5**: 字体系统 — Noto Serif SC（标题/金句）+ Noto Sans SC（正文），7 级字阶

**核心 UI 组件（70%+ 可复用）：**
- **UX-DR6**: MoodSelector 组件 — 5 个定制 SVG 表情，hover scale(1.15)，点击 scale(1.3) 回弹
- **UX-DR7**: WaveChart 组件 — 自绘 SVG `<polyline>` + Framer Motion 弹性生长动画
- **UX-DR8**: QuoteCard 组件 — 杂志引用样式 + 3D 翻转（0.6s CSS 3D transform）
- **UX-DR9**: XiaozhiBubble 组件 — 左侧聊天气泡 + 打字机动画
- **UX-DR10**: TypingIndicator 组件 — "小知正在想..." + 3 个跳动圆点
- **UX-DR11**: EmptyState 组件 — 插画 + 温柔文案 + 2s 循环微浮动动画
- **UX-DR12**: CapsulePopup 组件 — 毛玻璃遮罩 + 弹性缩放（scale 0.9→1.0, 0.3s）
- **UX-DR13**: ShareCard 组件 — Canvas 分享卡片生成 + 水印

**布局与交互：**
- **UX-DR14**: 响应式布局 — 375px/768px/1024px 三断点
- **UX-DR15**: 按钮层级 — Primary（暖珊瑚实心）/Secondary（描边）/Tertiary（文字）/Icon
- **UX-DR16**: 反馈模式 — 成功（柔绿）/错误（暖珊瑚）/等待（暖灰）/提示
- **UX-DR17**: 表单模式 — 无外框输入框，底部 2px 暖灰线，自适应高度
- **UX-DR18**: 弹窗模式 — 毛玻璃遮罩 `rgba(61,61,61,0.4)` + `backdrop-filter: blur(4px)`

**新增 UX 需求（商业版）：**
- **UX-DR19**: Onboarding 引导流程 — 欢迎页（3s 自动跳过）+ AI 模式选择（平台/BYOK）+ 首次日记引导
- **UX-DR20**: 付费墙 UI — 免费版 vs 付费版权益对比卡片 + 支付按钮 + 温和引导文案
- **UX-DR21**: 用户设置页 — BYOK Key 输入/验证/测试 + 当日额度显示 + 订阅状态管理 + 数据导出/删除
- **UX-DR22**: 登录/注册页 — 邮箱输入 + 密码输入 + 密码重置链接 + 年龄确认（18+）
- **UX-DR23**: 加载状态 — 骨架屏浅米色 `#F5EDE4` 闪烁（shadcn Skeleton）
- **UX-DR24**: 危机词检测 UI — 温柔引导提示条 + 专业帮助资源链接

### FR Coverage Map

| FR | 所属 Epic | 覆盖状态 |
|----|-----------|----------|
| FR1 | Epic 8: 用户注册与登录 | ✅ |
| FR2 | Epic 11: 多平台覆盖（Phase 3 微信登录）| ✅ |
| FR3 | Epic 8: 用户注册与登录 | ✅ |
| FR4 | Epic 8: 用户注册与登录 | ✅ |
| FR5 | Epic 2: 3 秒心情打卡 | ✅ |
| FR6 | Epic 2: 3 秒心情打卡 | ✅ |
| FR7 | Epic 2: 3 秒心情打卡 | ✅ |
| FR8 | Epic 5: 日记历史与详情 | ✅ |
| FR9 | Epic 5: 日记历史与详情 | ✅ |
| FR10 | Epic 3: AI 温暖回应 | ✅ |
| FR11 | Epic 3: AI 温暖回应 | ✅ |
| FR12 | Epic 3: AI 温暖回应 | ✅ |
| FR13 | Epic 3: AI 温暖回应 | ✅ |
| FR14 | Epic 10: BYOK 与付费订阅 | ✅ |
| FR15 | Epic 10: BYOK 与付费订阅 | ✅ |
| FR16 | Epic 10: BYOK 与付费订阅 | ✅ |
| FR17 | Epic 10: BYOK 与付费订阅 | ✅ |
| FR18 | Epic 10: BYOK 与付费订阅 | ✅ |
| FR19 | Epic 10: BYOK 与付费订阅 | ✅ |
| FR20 | Epic 4: 情绪波形图 | ✅ |
| FR21 | Epic 4: 情绪波形图 | ✅ |
| FR22 | Epic 4: 情绪波形图 | ✅ |
| FR23 | Epic 6: 时间胶囊 | ✅ |
| FR24 | Epic 6: 时间胶囊 | ✅ |
| FR25 | Epic 6: 时间胶囊 | ✅ |
| FR26 | Epic 9: 数据云端同步 | ✅ |
| FR27 | Epic 9: 数据云端同步 | ✅ |
| FR28 | Epic 9: 数据云端同步 | ✅ |
| FR29 | Epic 9: 数据云端同步 | ✅ |
| FR30 | Epic 9: 数据云端同步 | ✅ |
| FR31 | Epic 7: 金句分享 | ✅ |
| FR32 | Epic 7: 金句分享 | ✅ |
| FR33 | Epic 10: BYOK 与付费订阅 | ✅ |
| FR34 | Epic 10: BYOK 与付费订阅 | ✅ |
| FR35 | Epic 10: BYOK 与付费订阅 | ✅ |

## Epic List

### Epic 1: 项目基础搭建（已存在，需适配）
**目标：** 为后续所有 Epic 提供技术基础和演示数据。包含设计系统配置、IndexedDB 缓存层设置、种子数据注入。Phase 1 需要适配现有代码以支持 Supabase 集成。
**FR 覆盖：** FR26, FR27（部分）
**优先级：** P0
**复用程度：** 30% — UI 组件/设计系统保留；IndexedDB 改为缓存层

### Epic 2: 3 秒心情打卡（已存在，需适配）
**目标：** 用户可以零门槛开始记录 — 选表情、写几句、保存。核心入口，3 步内触达价值。UI 完全复用，数据写入改为 Supabase。
**FR 覆盖：** FR5, FR6, FR7
**优先级：** P0
**复用程度：** 90% — UI 完全保留

### Epic 3: AI 温暖回应（已存在，需适配）
**目标：** 用户获得"小知"的共情回应、金句和情绪标签。产品灵魂功能。增加双模式 AI 管道（平台限次 + BYOK 直调）、打字机动画、Fallback 机制。
**FR 覆盖：** FR10, FR11, FR12, FR13
**优先级：** P0
**复用程度：** 60% — 打字机动画/金句卡片保留；增加 BYOK 路由

### Epic 4: 情绪波形图（已存在，需适配）
**目标：** 用户直观"看见"自己 7 天心情变化。自绘 SVG + Framer Motion 弹性生长动画。数据源从 IndexedDB → Supabase 缓存层。
**FR 覆盖：** FR20, FR21, FR22
**优先级：** P0
**复用程度：** 95% — 图表渲染逻辑完全复用

### Epic 5: 日记历史与详情（已存在，需适配）
**目标：** 用户可以回顾过去的日记和 AI 回应，建立自我认知的连续性。增加分页加载 + 云端查询。
**FR 覆盖：** FR8, FR9
**优先级：** P0
**复用程度：** 70% — 列表/详情 UI 保留

### Epic 6: 时间胶囊（已存在，需适配）
**目标：** 用户在最恰当的时机被历史共鸣打动。多时间窗口匹配 + 频率控制。匹配逻辑/弹窗完全复用。
**FR 覆盖：** FR23, FR24, FR25
**优先级：** P0
**复用程度：** 95% — 逻辑/弹窗完全复用

### Epic 7: 金句分享（已存在，需适配）
**目标：** 用户把被打动的金句分享给别人，天然传播。3D 翻转/Canvas 生成保留，增加微信分享追踪。
**FR 覆盖：** FR31, FR32
**优先级：** P2
**复用程度：** 95% — 生成逻辑完全复用

### Epic 8: 用户注册与登录（新增）
**目标：** 用户能注册、登录、管理资料、重置密码——拥有自己的账号。Phase 1 使用邮箱登录，Phase 3 增加微信 OAuth。Supabase Auth + JWT + 路由鉴权中间件。
**FR 覆盖：** FR1, FR3, FR4（Phase 1）；FR2（Phase 3 微信登录）
**优先级：** P0
**新增 Epic**

### Epic 9: 数据云端同步（新增）
**目标：** 用户数据不再丢失，跨设备可访问，可导出可删除。6 张 Supabase 表 + RLS 策略 + 实时订阅 + IndexedDB 缓存同步层 + 冲突解决（最后写入优先）。
**FR 覆盖：** FR26, FR27, FR28, FR29, FR30
**优先级：** P0
**新增 Epic**

### Epic 10: BYOK 与付费订阅（新增）
**目标：** 实现 Freemium 商业模式。用户可自带 Key 不限次，或付费升级无限 AI——自主选择权。包含每日免费次数限制、BYOK 配置管理、付费墙 UI、支付接入、订阅管理、危机词检测。
**FR 覆盖：** FR14, FR15, FR16, FR17, FR18, FR19, FR33, FR34, FR35
**NFR 覆盖：** NFR19（危机词）, NFR20-NFR21（成本）
**优先级：** P0（FR15/FR18 每日限次在 Phase 1，其余 Phase 2）
**新增 Epic**

### Epic 11: 多平台覆盖（新增）
**目标：** Monorepo 迁移 + 小程序开发 + 微信登录集成 + App 壳开发。用户可在微信小程序/APP 上记录——碎片化场景覆盖。Phase 3 执行。
**FR 覆盖：** FR2（微信登录）
**优先级：** P1
**新增 Epic**

### Epic 12: 成本与行为监控（新增）
**目标：** 用户行为追踪 + 留存分析 + AI 成本监控看板。确保 AI 成本可控、用户行为可追踪——商业可持续性。Phase 4 执行。
**NFR 覆盖：** NFR21（成本看板）
**优先级：** P1
**新增 Epic**

### Epic 13: 部署与运维（新增）
**目标：** CI/CD 流水线 + 多环境部署 + 错误监控 + 日志系统。确保系统稳定可靠——用户无感知的基础设施。Phase 4 执行。
**NFR 覆盖：** NFR11（SLA）, NFR14（可扩展）
**优先级：** P1
**新增 Epic**

---

## Epic 1: 项目基础适配

**目标：** 让用户首次打开即看到有内容的波形图和引导，而非空白页。包含 Supabase 客户端初始化、IndexedDB 缓存层重构、种子数据注入。

### Story 1.1: Supabase 客户端初始化 + 环境变量配置

As a 开发者,
I want 初始化 Supabase 客户端并配置环境变量,
So that 后续所有 Supabase 操作都有统一的基础设施。

**Acceptance Criteria:**

**Given** 现有项目 `xiaozhi-journal/`
**When** 执行 `pnpm add @supabase/supabase-js`
**Then** 依赖安装成功，无报错

**Given** 依赖已安装
**When** 在 `src/lib/supabase.ts` 创建 Supabase 客户端
**Then** 使用 `createClient(SUPABASE_URL, SUPABASE_ANON_KEY)` 初始化
**And** 从 `process.env.NEXT_PUBLIC_SUPABASE_URL` 和 `process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY` 读取配置
**And** 导出为 `supabase` 单例

**Given** `supabase.ts` 创建完毕
**When** 在 `.env.local` 中配置环境变量
**Then** 包含 `NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co`
**And** 包含 `NEXT_PUBLIC_SUPABASE_ANON_KEY=xxx`
**And** `.env.example` 中包含上述变量占位符
**And** `.gitignore` 包含 `.env.local`

**Given** 配置完成
**When** 在任意组件中 `import { supabase } from '@/lib/supabase'`
**Then** 可调用 `supabase.from('profiles').select()` 无报错（表不存在时返回错误但客户端正常）

### Story 1.2: IndexedDB 缓存层重构 + Supabase 同步接口

As a 开发者,
I want 将 IndexedDB 从"唯一数据源"改为"缓存层",
So that 数据先写本地再同步到 Supabase，实现离线优先。

**Acceptance Criteria:**

**Given** 现有 `lib/db.ts`（IndexedDB CRUD）
**When** 重构 `lib/db.ts` 为 `CacheProvider` 接口
**Then** 保留 `getJournals()`, `addJournal()`, `updateJournal()`, `deleteJournal()` 方法
**And** 新增 `getPendingJournals()`（status 为 `pending` 的待同步条目）
**And** 新增 `markSynced(id)`（标记已同步）
**And** 新增 `syncToSupabase(journals: Journal[])`（批量标记同步）
**And** 新增 `setMeta(key, value)` / `getMeta(key)`

**Given** `CacheProvider` 接口完成
**When** 在 `store/journal.ts` 重构 Zustand store
**Then** 保留现有 state：`journals: Journal[]`, `loading: boolean`, `error: string | null`
**And** 新增 state：`isSyncing: boolean`（同步中状态）
**And** actions 改为先写 IndexedDB 再异步触发 Supabase sync
**And** 所有更新使用不可变模式

**Given** 同步函数完成
**When** 网络可用且用户已登录
**Then** `syncToSupabase()` 将 `pending` 状态的日记写入 Supabase `journals` 表
**And** 成功后调用 `markSynced(id)` 更新 IndexedDB 状态
**And** 同步错误时静默失败，不阻塞用户操作

### Story 1.3: 种子数据注入 + 空状态引导

As a 首次打开的用户,
I want 看到预设的演示内容和友好的引导,
So that 我不是面对空白页面，能立即理解这个 App 是做什么的。

**Acceptance Criteria:**

**Given** IndexedDB 为空（首次访问）
**When** 应用启动时检查 `appMeta.seedDataLoaded`
**Then** 如果未设置，自动写入 3 条预设日记数据（焦虑/开心/平静，含 AI 回应和金句）
**And** 设置 `appMeta.seedDataLoaded = true`
**And** 3 条数据的 timestamp 分别为 3 天前、昨天、今天

**Given** 无历史数据（非种子场景）
**When** 用户看到首页
**Then** 显示空状态引导（`empty-state.tsx`）：插画 + "你的第一条日记从这里开始 ✨"
**And** 插画有 2s 循环微浮动动画（Framer Motion）
**And** 引导文案使用朋友语气（符合 UX-DR18）
**And** 波形图显示浅灰色装饰线 + 引导文案（符合 UX-DR22 空状态）

---

## Epic 8: 用户注册与登录

**目标：** 用户能注册、登录、管理资料、重置密码。Phase 1 使用邮箱登录。

### Story 8.1: 邮箱注册 + 年龄确认

As a 新用户,
I want 通过邮箱注册账号并确认年龄,
So that 我能开始使用 Xiaozhi Journal 记录心情。

**Acceptance Criteria:**

**Given** 用户打开注册页 (`/auth/login`)
**When** 用户输入邮箱和密码（密码 ≥ 8 字符）
**Then** 调用 `supabase.auth.signUp({ email, password })`
**And** 注册前检查年龄确认复选框（"我已年满 18 岁"，符合 NFR23）
**And** 未勾选年龄确认时注册按钮 disabled

**Given** 注册成功
**When** Supabase 返回用户信息
**Then** 自动在 `profiles` 表插入记录（id = auth.uid(), email, nickname = 邮箱前缀）
**And** 跳转到 Onboarding 页面
**And** 显示成功提示（符合 UX-DR16 反馈模式）

**Given** 邮箱已被注册
**When** 注册请求返回冲突
**Then** 显示中文提示："这个邮箱已经被注册了，试试登录？"
**And** 提供"去登录"链接

**Given** 密码格式不正确（< 8 字符）
**When** 用户尝试提交
**Then** 输入框下方显示红色错误提示（符合 UX-DR16）
**And** 不发起注册请求

### Story 8.2: 邮箱登录 + Session 管理

As a 已注册用户,
I want 通过邮箱和密码登录,
So that 我能访问自己的日记数据。

**Acceptance Criteria:**

**Given** 用户在登录页 (`/auth/login`)
**When** 用户输入已注册的邮箱和密码
**Then** 调用 `supabase.auth.signInWithPassword({ email, password })`
**And** 成功后跳转到首页（`/`）
**And** Zustand store 更新用户上下文

**Given** 登录成功
**When** 页面刷新
**Then** 用户 Session 保持登录状态（Supabase 自动管理 token 刷新）
**And** 不需要重新登录

**Given** 密码错误
**When** 登录请求返回认证失败
**Then** 显示中文提示："邮箱或密码不正确"
**And** 不清空邮箱输入框

**Given** 用户未注册直接登录
**When** 使用该邮箱登录
**Then** 显示中文提示："没有找到这个邮箱对应的账号，请先注册"

### Story 8.3: 密码重置

As a 忘记密码的用户,
I want 通过邮箱验证链接重置密码,
So that 我能重新访问自己的账号。

**Acceptance Criteria:**

**Given** 用户在登录页点击"忘记密码"
**When** 用户输入注册邮箱并点击"发送重置链接"
**Then** 调用 `supabase.auth.resetPasswordForEmail(email)`
**And** 显示提示："重置链接已发送到你的邮箱，请查收"

**Given** 用户点击邮件中的重置链接
**When** 跳转到重置密码页 (`/auth/callback`)
**Then** Supabase 自动验证 token
**And** 用户可输入新密码（≥ 8 字符）
**And** 提交成功后跳转登录页

**Given** 重置链接过期或无效
**When** 用户访问重置页面
**Then** 显示中文提示："链接已过期，请重新申请重置"

### Story 8.4: 个人资料管理

As a 已登录用户,
I want 管理自己的昵称和头像,
So that 我能个性化自己的账号。

**Acceptance Criteria:**

**Given** 用户在设置页 (`/settings`)
**When** 用户修改昵称（1-20 字符）
**Then** 调用 `supabase.from('profiles').update({ nickname })` WHERE `id = auth.uid()`
**And** 成功后显示"已保存"提示
**And** Zustand store 同步更新用户信息

**Given** 用户上传头像
**When** 选择图片文件（≤ 2MB，jpg/png）
**Then** 调用 `supabase.storage.from('avatars').upload(userId, file)`
**And** 更新 `profiles.avatar_url` 为存储路径
**And** 头像图片显示在设置页

**Given** 资料修改失败（网络断开等）
**When** Supabase 请求失败
**Then** 显示中文错误提示："保存失败，请稍后重试"
**And** 输入框内容回退到修改前的值

---

## Epic 9: 数据云端同步

**目标：** 用户数据不再丢失，跨设备可访问，可导出可删除。

### Story 9.1: Supabase 数据库迁移（6 张表 + RLS）

> **Sizing Note:** 6 张表的 AC 模式高度一致（CREATE TABLE + RLS policy + 索引），属于重复性工作量而非复杂性高，预计一个 dev session 可完成。如拆分为"表结构"和"RLS 策略"两个子 Story 也可接受，但非必须。

As a 开发者,
I want 在 Supabase 中创建 6 张数据表并配置 RLS 策略,
So that 用户数据能安全存储且只能被本人访问。

**Acceptance Criteria:**

**Given** Supabase 项目已初始化
**When** 创建迁移脚本 `supabase/migrations/001_create_profiles.sql`
**Then** 包含 `profiles` 表（id uuid PK, email, nickname, avatar_url, created_at）
**And** 设置 RLS：`CREATE POLICY "Users can only access their own profile" ON profiles FOR ALL USING (auth.uid() = id)`

**When** 创建迁移脚本 `supabase/migrations/002_create_journals.sql`
**Then** 包含 `journals` 表（id uuid PK, user_id uuid FK→profiles.id, content text, mood int, mood_emoji text, ai_response text, golden_quote text, mood_label text, created_at timestamptz, status text）
**And** 创建索引 `idx_journals_user_id` 和 `idx_journals_created_at`
**And** 设置 RLS：`CREATE POLICY "Users can only access their own journals" ON journals FOR ALL USING (auth.uid() = user_id)`

**When** 创建迁移脚本 `supabase/migrations/003_create_ai_usage.sql`
**Then** 包含 `ai_usage` 表（id uuid PK, user_id uuid FK, date date, platform_calls int, byok_calls int, tier text）
**And** 设置 RLS：`USING (auth.uid() = user_id)`

**When** 创建迁移脚本 `supabase/migrations/004_create_user_api_keys.sql`
**Then** 包含 `user_api_keys` 表（id uuid PK, user_id uuid FK, encrypted_key text, provider text, is_active bool）
**And** 设置 RLS：`USING (auth.uid() = user_id)`

**When** 创建迁移脚本 `supabase/migrations/005_create_subscriptions.sql`
**Then** 包含 `subscriptions` 表（id uuid PK, user_id uuid FK, tier text, status text, start_date timestamptz, end_date timestamptz）
**And** 设置 RLS：`USING (auth.uid() = user_id)`

**When** 创建迁移脚本 `supabase/migrations/006_create_app_meta.sql`
**Then** 包含 `app_meta` 表（id uuid PK, user_id uuid FK, key text, value jsonb）
**And** 设置 RLS：`USING (auth.uid() = user_id)`

**Given** 所有迁移脚本创建完毕
**When** 执行 `npx supabase db push`
**Then** 6 张表全部创建成功，无报错
**And** RLS 策略生效（匿名用户无法查询任何数据）

### Story 9.2: 实时订阅 + Zustand store 集成

As a 已登录用户,
I want 我的数据在其他设备修改后自动同步更新,
So that 我不需要刷新页面就能看到最新数据。

**Acceptance Criteria:**

**Given** 用户已登录
**When** 应用启动时
**Then** 调用 `supabase.channel('journals').on('postgres_changes', ...)` 建立实时订阅
**And** 监听 `INSERT`, `UPDATE`, `DELETE` 事件
**And** 收到 `INSERT` 时追加到 Zustand store `journals` 数组
**And** 收到 `UPDATE` 时替换 store 中对应 id 的条目
**And** 收到 `DELETE` 时从 store 中移除对应 id 的条目

**Given** 实时订阅已建立
**When** 用户在另一台设备新增日记
**Then** 当前设备的波形图自动更新，无需刷新
**And** 新增数据点以弹性弹跳动画出现（符合 UX-DR7）

**Given** 用户退出登录
**When** 调用 `supabase.auth.signOut()`
**Then** 取消所有实时订阅
**And** 清空 Zustand store 中的用户数据

### Story 9.3: 离线同步 + 冲突解决

As a 网络不稳定环境中的用户,
I want 离线时日记正常保存，网络恢复后自动同步,
So that 我不会因为网络问题丢失任何记录。

**Acceptance Criteria:**

**Given** 用户网络断开
**When** 提交日记
**Then** 日记写入 IndexedDB，status 标记为 `pending`
**And** 显示"已保存，小知在路上~"提示条
**And** 不出现错误弹窗

**Given** 网络恢复
**When** 浏览器检测到在线状态
**Then** 自动调用 `syncToSupabase()` 处理所有 `pending` 状态的日记
**And** 每篇日记依次写入 Supabase
**And** 成功后在 IndexedDB 中更新 `markSynced(id)`

**Given** 多端同时编辑同一条日记（冲突场景）
**When** 两个写入到达 Supabase
**Then** 以 `updated_at` 最后写入为准（last-write-wins）
**And** 用户不会丢失任何数据版本

**Given** 同步失败（Supabase 服务不可用）
**When** `syncToSupabase()` 抛出异常
**Then** 日记保持 `pending` 状态
**And** 不删除本地数据
**And** 下次网络恢复时重新尝试同步

### Story 9.4: 数据导出（GDPR 可携带权）

As a 用户,
I want 导出自己的全部日记数据,
So that 我能保留自己的数据副本或迁移到其他平台（符合 NFR16）。

**Acceptance Criteria:**

**Given** 用户在设置页点击"导出数据"
**When** 请求发起
**Then** 查询 `supabase.from('journals').select()` WHERE `user_id = auth.uid()`
**And** 返回全部日记数据（含 AI 回应、金句、情绪标签）
**And** 导出为 JSON 文件，字段使用 `camelCase`

**Given** 导出文件生成完毕
**When** 文件下载触发
**Then** 文件名格式为 `xiaozhi-journal-export-{YYYY-MM-DD}.json`
**And** 文件包含用户 profile 信息（昵称、注册时间）

**Given** 导出数据量较大（>100 条）
**When** 导出进行中
**Then** 显示加载提示："正在准备你的数据，请稍候..."
**And** 完成后自动下载

### Story 9.5: 账户删除（GDPR 被遗忘权）

As a 用户,
I want 随时删除自己的账户和全部数据,
So that 我能彻底离开平台（符合 NFR17）。

**Acceptance Criteria:**

**Given** 用户在设置页点击"删除账户"
**When** 弹出确认对话框
**Then** 显示二次确认："删除后 30 天内数据将被彻底清除，此操作不可撤销"
**And** 用户需输入"确认删除"才能启用删除按钮

**Given** 用户确认删除
**When** 调用删除 API
**Then** 删除 `journals`、`ai_usage`、`user_api_keys`、`subscriptions`、`app_meta` 中该用户的全部记录
**And** 调用 `supabase.auth.admin.deleteUser(userId)` 删除 Auth 用户
**And** 删除 Supabase Storage 中该用户的头像文件

**Given** 账户删除完成
**When** 用户再次访问
**Then** 被重定向到登录页
**And** 之前所有数据不可恢复
**And** 数据在 30 天内从 Supabase 备份中彻底清除（符合 NFR17）

---

## Epic 2: 3 秒心情打卡

**目标：** 用户可以零门槛开始记录 — 选表情、写几句、保存。核心入口，3 步内触达价值。

### Story 2.1: 心情表情选择器

As a 想要快速记录心情的用户,
I want 看到 5 个清晰的表情按钮,
So that 我可以在 3 秒内选择当天的心情。

**Acceptance Criteria:**

**Given** 用户打开首页
**When** 页面渲染
**Then** 显示 "今天心情怎么样？" 标题（Noto Serif SC, 26px+）
**And** 水平排列 5 个表情按钮：😡 😔 😐 😊 😴
**And** 每个按钮为 56x56px 圆角方形（rounded-full），间距 16px
**And** 按钮使用定制 SVG 图标（非标准 emoji，符合 UX-DR6）
**And** hover 时按钮 scale(1.15) 并上浮 2px（Framer Motion spring）

**Given** 用户点击一个表情
**When** 点击事件触发
**Then** 被点击的表情放大至 scale(1.3) 后回弹，背景变为暖珊瑚色
**And** 未选中的表情透明度降至 50%
**And** 日记输入框从下方弹性滑入（Framer Motion spring 动画）

**Given** 用户使用键盘导航
**When** 按 Tab 键聚焦到表情按钮
**Then** 焦点指示器为暖珊瑚色 `outline: 2px solid #D4856A`
**And** 每个表情按钮有 `aria-label`（如"烦躁"、"难过"、"平静"、"开心"、"疲惫"）
**And** 容器使用 `role="radiogroup"`，按钮使用 `role="radio"`

### Story 2.2: 日记输入框 + 保存到缓存

As a 选择了心情的用户,
I want 一个温和无压力的输入框写日记,
So that 我可以自由表达今天的感受。

**Acceptance Criteria:**

**Given** 用户已选择心情表情
**When** 输入框出现
**Then** 输入框为聊天气泡风格：无外框，底部 2px 暖灰线，圆角底部（UX-DR17）
**And** placeholder 为 "随便写点什么吧，哪怕只有一句话"
**And** 高度自动增长，最多 200px，超出可滚动
**And** 不显示字数提示

**Given** 用户在输入框中输入内容
**When** 点击 Primary 按钮或按 Ctrl/Cmd + Enter
**Then** 日记内容 + 心情写入 IndexedDB 缓存层（`addJournal()`），status 标记为 `pending`
**And** 触发后台 `syncToSupabase()` 异步同步
**And** 输入框淡出
**And** 显示 "记下了 ✨" 成功提示（柔绿背景，3 秒后淡出，符合 UX-DR16）

**Given** 用户输入了内容但刷新页面
**When** 页面重新加载
**Then** 输入框中的草稿不丢失（自动保存到 IndexedDB，刷新后可恢复）

---

## Epic 3: AI 温暖回应

**目标：** 用户获得"小知"的共情回应、金句和情绪标签。产品灵魂功能。增加双模式 AI 管道（平台限次 + BYOK 直调）。

### Story 3.1: AI 代理 API Route Handler（平台 Key）

As a 保存了日记的用户,
I want 系统自动调用 AI 获取回应,
So that 我能收到温暖的回应和金句。

**Acceptance Criteria:**

**Given** 用户提交了一篇日记（status 为 `pending`）
**When** 前端调用 `POST /api/journal`，请求体 `{ content, mood }`
**Then** Route Handler 从 `process.env.DASHSCOPE_API_KEY` 读取平台 API Key
**And** 以 OpenAI 兼容格式调用阿里云百炼 API
**And** System Prompt 为 PRD 定义的内容
**And** 请求 AI 返回 JSON：`{ response: string, goldenQuote: string, moodLabel: string }`
**And** 设置 15 秒超时（AbortController）

**Given** AI 调用成功
**When** 收到响应
**Then** 返回 200：`{ response, goldenQuote, moodLabel, fromFallback: false }`

**Given** AI 调用超时（>15s）或网络错误
**When** 发生超时或异常
**Then** 返回 200 + `fromFallback: true`
**And** 使用本地 fallback 金句库（`lib/ai.ts` 中预设 5-10 条通用金句）

**Given** AI 返回的 JSON 解析失败
**When** 解析失败
**Then** 重试一次（新 timeout）
**And** 如果仍然失败，返回 fallback 数据 + `fromFallback: true`

### Story 3.2: BYOK 模式 + 双模式路由

As a 自带 API Key 的用户,
I want 使用自己的 Key 调用 AI 不限次数,
So that 我不受平台每日次数限制。

**Acceptance Criteria:**

**Given** 用户配置了 BYOK Key
**When** 用户提交日记并选择使用 BYOK 模式
**Then** Route Handler 从 `user_api_keys` 表读取用户的加密 Key
**And** 使用 AES-256-GCM 解密获取原始 Key
**And** 使用用户 Key 调用阿里云百炼 API
**And** 不走平台限次逻辑

**Given** BYOK Key 无效或过期
**When** API 调用返回 401/403
**Then** 返回 200 + `fromFallback: true` + fallback 数据
**And** 前端温柔提示："你的 API Key 似乎不太对，检查一下？也可以先用平台 AI"

**Given** 请求体包含 `useByok: true` 参数
**When** 处理请求
**Then** 走 BYOK 路由
**And** 否则走平台 AI 路由

### Story 3.3: 打字机动画 + 金句卡片

As a 等待 AI 回应的用户,
I want 看到文字逐字出现，然后金句翻转揭示,
So that 等待本身成为情感体验的一部分。

**Acceptance Criteria:**

**Given** 用户提交了日记，AI 调用开始
**When** 等待 AI 响应
**Then** 显示 TypingIndicator 组件："小知正在想..." + 3 个跳动圆点（符合 UX-DR10）

**Given** AI 响应到达
**When** 响应数据可用
**Then** 先显示 XiaozhiBubble 气泡，使用打字机动画（~50ms/字，符合 UX-DR9）
**And** 打字机完成后 0.3s，QuoteCard 金句卡片 3D 翻转揭示（0.6s CSS 3D transform，符合 UX-DR8）
**And** 金句卡片样式：左侧 3px 暖珊瑚装饰线，Noto Serif SC italic 20px，背景 `#F5EDE4`，圆角 24px
**And** 波形图自动更新新增的心情数据点（弹性弹跳动画）

**Given** 用户开启了 `prefers-reduced-motion`
**When** AI 响应到达
**Then** 打字机动画和翻转动画被跳过，直接显示完整内容

### Story 3.4: 离线处理 + 异步 AI 回调

As a 网络断开时的用户,
I want 日记仍然能保存,
So that 我不会丢失任何记录。

**Acceptance Criteria:**

**Given** 用户网络断开
**When** 用户提交日记
**Then** 日记成功写入 IndexedDB，status 标记为 `pending`
**And** 显示 "日记已保存，小知在路上~"（暖灰提示条，非红色报错）
**And** 不出现任何错误弹窗

**Given** 网络恢复
**When** 浏览器检测到在线
**Then** 自动调用 `POST /api/journal` 处理 pending 状态的日记
**And** AI 回应到达后更新该日记的 `aiResponse`, `goldenQuote`, `status='ai_done'`

---

## Epic 4: 情绪波形图

**目标：** 用户直观"看见"自己 7 天心情变化。自绘 SVG + Framer Motion 弹性生长动画。

### Story 4.1: 自绘 SVG 波形图 + 7 天趋势

As a 想看自己心情变化的用户,
I want 看到过去 7 天的情绪波形图,
So that 我一眼就能了解自己的心情趋势。

**Acceptance Criteria:**

**Given** 用户打开首页
**When** 页面渲染
**Then** 显示 7 天情绪波形图（自绘 SVG `<polyline>`，符合 UX-DR7）
**And** 图表尺寸：宽 100%（max 640px），高 120px
**And** 波形线使用渐变色 `#A8C5A0` → `#D4856A`，`stroke-width: 1.5`
**And** Y 轴映射 5 个心情等级（1=😡 到 5=😊）
**And** 入场时有 0.8s 生长动画（Framer Motion `animate`）
**And** 渲染时间 ≤ 500ms（NFR4）

**Given** 波形图有数据
**When** 新的日记数据点出现
**Then** 新数据点以弹性弹跳动画"生长"到波形图上
**And** 每个数据点上方显示对应的心情表情图标

### Story 4.2: Hover 数据点 + 无数据引导

As a 查看波形图的用户,
I want 悬停时看到具体信息,
So that 我能了解某一天的详细心情。

**Acceptance Criteria:**

**Given** 波形图已渲染
**When** 鼠标悬停在数据点上
**Then** 显示 tooltip：日期 + 心情表情 + 日记摘要（前 20 字）
**And** 数据点高亮放大（scale 1.5）
**And** tooltip 为独立 HTML 组件（`emotion-tooltip.tsx`），不受 SVG viewBox 裁剪限制
**And** 边缘数据点的 tooltip 自动 clamp 防止溢出视口

**Given** 波形图无数据（首次使用且种子未加载）
**When** 页面渲染
**Then** 显示一条浅灰色装饰线 + 引导文案："你的第一条日记从这里开始 ✨"
**And** 引导文字使用暖灰色 `#8A817C`，Noto Sans SC 14px

---

## Epic 5: 日记历史与详情

**目标：** 用户可以回顾过去的日记和 AI 回应，建立自我认知的连续性。

### Story 5.1: 历史日记列表

As a 想回顾过去的用户,
I want 按时间顺序查看我的所有日记,
So that 我能回顾自己的心路历程。

**Acceptance Criteria:**

**Given** 用户在首页
**When** 点击底部 Tertiary 文字按钮 "查看过往记录"
**Then** 页面淡入淡出切换到历史列表（0.3s Framer Motion）
**And** 按时间倒序显示所有日记条目
**And** 每条显示：日期、心情表情、日记摘要（前 50 字）、AI 金句（如果有）

**Given** 日记数量较多（>10 条）
**When** 查看列表
**Then** 列表可滚动，每条之间有 16px 间距
**And** 支持分页加载（从 Supabase 查询，每页 20 条）

### Story 5.2: 单条日记详情

As a 想深入了解某篇日记的用户,
I want 点击查看完整内容,
So that 我能重新阅读日记和 AI 回应。

**Acceptance Criteria:**

**Given** 用户在历史列表中
**When** 点击某条日记
**Then** 展示完整日记：日期、心情表情、正文、小知回应气泡、金句卡片
**And** 布局与首页相同，但内容完整显示

**Given** 用户查看完详情
**When** 点击返回或按 Esc
**Then** 返回历史列表，保持滚动位置

---

## Epic 6: 时间胶囊

**目标：** 用户在最恰当的时机被历史共鸣打动。多时间窗口匹配 + 频率控制。

### Story 6.1: 历史匹配逻辑 + 弹窗触发

As a 打开 App 的用户,
I want 在合适的时机被提醒旧日记,
So that 我能感受到跨越时间的自我共鸣。

**Acceptance Criteria:**

**Given** 用户完成一次新的日记记录
**When** 系统检查是否有可匹配的历史日记
**Then** 按优先级遍历时间锚点（周年 → 半年 → 季度），找到第一个命中的窗口
**And** 每个锚点要求：同月同日 ± 容差天数，且时间差 ≥ 该锚点的最小门槛（周年 ≥ 365 天，半年 ≥ 180 天，季度 ≥ 90 天）
**And** 多个候选时优先选择心情相近（mood ±1）的日记
**And** 触发成功后执行频率控制（24h 内不重复、同一篇 30 天冷却）

**Given** 时间胶囊触发
**When** 弹窗出现
**Then** 使用 shadcn Dialog + Framer Motion 弹性缩放（scale 0.9 → 1.0, 0.3s，符合 UX-DR12）
**And** 背景遮罩为 `rgba(61,61,61,0.4)` + `backdrop-filter: blur(4px)`（符合 UX-DR18）
**And** 弹窗内显示：匹配的旧日记日期 + 心情 + 金句
**And** 标题根据实际时间差动态生成（一年前/半年前/几个月前）
**And** 包含 "去看看" 按钮（Secondary）和 "稍后再说" 按钮（Tertiary）

### Story 6.2: 点击查看历史日记

As a 被时间胶囊触动的用户,
I want 点击查看那条旧日记,
So that 我能重温当时的感受。

**Acceptance Criteria:**

**Given** 时间胶囊弹窗已展示
**When** 用户点击"去看看"
**Then** 弹窗关闭
**And** 展示匹配的旧日记详情（复用 Story 5.2 的详情组件）

**Given** 用户点击"稍后再说"或点击遮罩或按 Esc
**When** 关闭弹窗
**Then** 返回首页，不影响当前操作

---

## Epic 7: 金句分享

**目标：** 用户把被打动的金句分享给别人，天然传播。

### Story 7.1: 金句生成图片

As a 被打动想分享的用户,
I want 把金句生成为一张精致的图片,
So that 我可以截图发到朋友圈或发给朋友。

**Acceptance Criteria:**

**Given** 用户看到金句卡片
**When** 点击金句卡片右上角的分享图标按钮
**Then** 使用 Canvas 渲染金句卡片为图片（`share-card-renderer.ts`）
**And** 图片包含：金句文字、"Xiaozhi Journal" 水印、日期
**And** 图片样式与金句卡片一致（杂志引用风格）
**And** 图片复制到剪贴板

**Given** 用户已生成分享图片
**When** 图片已保存
**Then** 该日记的 `shareCount` +1

---

## Epic 10: BYOK 与付费订阅

**目标：** 实现 Freemium 商业模式。用户可自带 Key 不限次，或付费升级无限 AI。

**FR 覆盖：** FR14, FR15, FR16, FR17, FR18, FR19, FR33, FR34, FR35
**NFR 覆盖：** NFR19（危机词）, NFR20-NFR21（成本）
**UX 覆盖：** UX-DR19（Onboarding）, UX-DR20（付费墙）, UX-DR21（设置页）, UX-DR24（危机词 UI）

### Story 10.1: Onboarding + AI 模式选择

As a 刚注册的新用户,
I want 选择使用 AI 的方式,
So that 我能根据自己的情况选择平台 AI 或自带 Key。

**Acceptance Criteria:**

**Given** 用户完成注册后进入 Onboarding
**When** 页面显示
**Then** 显示欢迎文案："欢迎，{昵称}。小知在这里陪你。"（3 秒自动跳过，符合 UX-DR19）
**And** 显示 AI 模式选择卡片：选项 A "平台 AI（每日免费 5 次）" / 选项 B "自带 API Key（不限次）"

**Given** 用户选择选项 B
**When** 用户输入自己的 DASHSCOPE API Key
**Then** 调用测试接口验证 Key 有效性
**And** 验证通过后加密存储到 `user_api_keys` 表
**And** 设置 `useByok: true`

**Given** 用户选择选项 A 或跳过
**When** 进入首页
**Then** 默认使用平台 AI，每日限次 5 次

### Story 10.2: 每日免费次数限制

As a 免费用户,
I want 看到自己的 AI 使用额度,
So that 我知道还剩多少次。

**Acceptance Criteria:**

**Given** 用户提交日记
**When** 使用平台 AI 模式
**Then** Route Handler 检查 `ai_usage` 表当日计数
**And** 如果 `platform_calls < 5`，正常调用，计数 +1
**And** 如果 `platform_calls >= 5`，返回 `fromFallback: true`

**Given** 用户查看当日额度
**When** 在设置页或首页查看额度
**Then** 显示"今日 AI 剩余 {n}/5 次"
**And** 使用进度条视觉展示（0-5 格）

**Given** 额度用尽
**When** 用户尝试使用平台 AI
**Then** 温和提示："今天 AI 额度用完了，明天还有 5 次，或者升级到无限版"
**And** 提供"配置 BYOK"和"升级"两个操作入口

### Story 10.3: BYOK 配置管理

As a 已登录用户,
I want 管理和验证自己的 API Key,
So that 我能确保 BYOK 模式正常工作。

**Acceptance Criteria:**

**Given** 用户在设置页（`/settings`）
**When** 查看 BYOK 配置区域
**Then** 显示当前 Key 状态（已配置/未配置）+ 输入框（密码模式，符合 UX-DR21）
**And** 显示"测试 Key"按钮

**Given** 用户输入新 Key 并点击"测试"
**When** 调用测试接口
**Then** 成功时显示绿色提示："Key 有效，已保存"
**And** 失败时显示"Key 无效，请检查"

**Given** 用户想删除已配置的 Key
**When** 点击"删除 Key"按钮
**Then** `user_api_keys` 表中标记 `is_active = false`
**And** 切换回平台 AI 模式

### Story 10.4: 付费墙 UI + 权益对比

As a 免费用户,
I want 查看免费版和付费版的权益对比,
So that 我能决定是否升级。

**Acceptance Criteria:**

**Given** 用户访问付费墙页（`/paywall`）
**When** 页面渲染
**Then** 显示两列权益对比卡片（免费版 vs 付费版，符合 UX-DR20）
**And** 免费版列：每日 5 次 AI、基础波形图、基础历史
**And** 付费版列：无限 AI、周报/月报、时间胶囊高级设置、优先客服
**And** 底部显示价格和"立即升级"按钮

**Given** 额度用尽时用户看到温和提示
**When** 用户点击提示中的"升级"链接
**Then** 跳转到 `/paywall` 页面

### Story 10.5: 支付接入 + 订阅管理

As a 想升级的用户,
I want 通过微信或支付宝完成支付,
So that 我能解锁无限 AI 和其他高级功能。

**Acceptance Criteria:**

**Given** 用户在 `/paywall` 点击"立即升级"
**When** 选择支付方式（微信/支付宝）
**Then** 调用支付网关 API
**And** 展示支付二维码或跳转
**And** 支付成功后更新 `subscriptions` 表：`tier='premium'`, `status='active'`

**Given** 用户订阅成功
**When** 返回首页
**Then** 无限 AI 调用可用
**And** 显示"高级会员"标识

**Given** 用户想取消订阅
**When** 在设置页点击"取消订阅"
**Then** 更新 `subscriptions.status = 'cancelled'`
**And** 已付费权益持续到当前周期结束
**And** 显示确认提示："取消后当前周期结束后生效"

### Story 10.6: 危机词检测 + 温柔引导

As a 在日记中表达负面情绪的用户,
I want 在遇到危机词时得到温柔引导,
So that 我能感受到关怀而不是冷漠的算法判定（符合 NFR19）。

**Acceptance Criteria:**

**Given** 用户提交的日记包含危机词（如"不想活了"、"自杀"、"绝望"等）
**When** Route Handler 检测到危机词
**Then** AI System Prompt 追加特殊指令："用户可能处于危机状态，请温柔回应并提供专业帮助资源"
**And** 在 AI 回应下方追加危机词引导提示条（符合 UX-DR24）
**And** 提示条包含专业帮助资源链接（心理热线、危机干预）

**Given** 危机词引导提示条
**When** 用户点击帮助资源链接
**Then** 在新窗口打开资源页面
**And** 不影响当前日记的保存和 AI 回应

---

## Epic 11: 多平台覆盖

**目标：** Monorepo 迁移 + 小程序开发 + 微信登录集成 + App 壳开发。Phase 3 执行。

**FR 覆盖：** FR2
**优先级：** P1

### Story 11.1: Monorepo 迁移

As a 开发者,
I want 将现有项目迁移为 Monorepo 结构,
So that 可以共享业务逻辑并同时开发 Web 和小程序。

**Acceptance Criteria:**

**Given** 现有 `xiaozhi-journal/` 项目
**When** 执行 `pnpm create turbo@latest`
**Then** 创建 `apps/web/`（现有 Next.js 项目移入）
**And** 创建 `packages/shared/`（共享类型 + 业务逻辑）
**And** 创建 `packages/ui/`（共享 UI 组件）
**And** 根目录 `package.json` 配置 pnpm workspaces

### Story 11.2: Taro 小程序初始化

As a 开发者,
I want 初始化 Taro 小程序项目,
So that 用户可以在微信中使用 Xiaozhi Journal。

**Acceptance Criteria:**

**Given** Monorepo 已就绪
**When** 执行 `npx @tarojs/cli init apps/miniapp`
**Then** 创建 Taro 项目
**And** 复用 `packages/shared/` 中的类型和业务逻辑
**And** 复用 `packages/ui/` 中的基础组件（适配小程序规范）

### Story 11.3: 微信 OAuth 登录集成

As a 微信用户,
I want 通过微信一键登录,
So that 我不需要记住邮箱密码，3 秒开始使用。

**Acceptance Criteria:**

**Given** 小程序已初始化
**When** 用户打开小程序
**Then** 显示微信登录按钮
**And** 调用 `wx.login()` 获取 code
**And** 通过后端 Route Handler 用 code 换取微信 openid
**And** Supabase Auth 创建关联用户

---

## Epic 12: 成本与行为监控

**目标：** 确保 AI 成本不超过收入的 40%（NFR20），同时追踪用户留存和使用模式，指导产品迭代决策。Phase 4 执行。

**NFR 覆盖：** NFR21（成本看板）
**优先级：** P1

### Story 12.1: 用户行为埋点

As a 开发者,
I want 追踪用户行为数据,
So that 我能分析留存和使用模式。

**Acceptance Criteria:**

**Given** 应用运行
**When** 用户执行关键操作（注册、写日记、分享金句、升级付费）
**Then** 记录事件到分析平台
**And** 事件包含：事件名、时间戳、用户 ID、属性数据

### Story 12.2: AI 成本看板

As a 运营者,
I want 查看 AI 调用成本看板,
So that 我能确保 AI 成本不超过收入的 40%（NFR20）。

**Acceptance Criteria:**

**Given** 看板页面已创建
**When** 访问看板
**Then** 显示按日/周/月统计的 AI 调用量和成本
**And** 显示 AI 成本占总收入的比例
**And** 超过 40% 阈值时高亮警告

---

## Epic 13: 部署与运维

**目标：** 确保用户每次打开 App 都是最新版本，且生产环境问题能在分钟级发现和修复，保障 99.5% SLA（NFR11）。Phase 4 执行。

**NFR 覆盖：** NFR11（SLA）, NFR14（可扩展）
**优先级：** P1

### Story 13.1: CI/CD 流水线

As a 开发者,
I want 自动化部署流程,
So that 代码提交后能自动构建和部署。

**Acceptance Criteria:**

**Given** 代码推送到 main 分支
**When** Vercel 检测到变更
**Then** 自动构建 Next.js 项目
**And** 部署到生产环境
**And** 构建失败时通知开发者

### Story 13.2: 错误监控集成

As a 运营者,
I want 收到生产环境错误告警,
So that 我能快速发现和修复问题。

**Acceptance Criteria:**

**Given** Sentry 已集成到 Next.js 项目
**When** 生产环境发生未捕获错误
**Then** 错误信息上报到 Sentry
**And** 包含堆栈、用户上下文、请求数据
**And** 严重错误触发告警通知