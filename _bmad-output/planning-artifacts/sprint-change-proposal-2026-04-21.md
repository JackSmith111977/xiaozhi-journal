---
date: '2026-04-21'
trigger: 'Party Mode 基础设施缺口分析'
scope: 'Major — 新增 3 个 Epic，扩展 2 个现有 Epic，更新架构文档'
---

# Sprint Change Proposal — 基础设施建设

## 1. Issue Summary

**触发来源：** 用户 Kei 发起 Party Mode 讨论，六名 Agent（Victor/Winston/Amelia/John/Freya/Saga）交叉分析后发现 Xiaozhi Journal 存在系统性基础设施缺口，涉及六个维度：支付、邮件、监控、测试、数据分析、UX 治理。

**核心问题：** 原始 PRD/Epics/Architecture 规划遗漏了商业化必须的基础设施层。不是实现方式错误，是范围不足。具体证据：

- `supabase/config.toml` SMTP 配置全被注释 → 密码重置邮件发不出（阻塞 Epic 8）
- 零测试文件 → 代码质量无基线
- 零埋点 → 商业决策完全盲目
- `ai_usage` 表存在但无代码写入 → 成本失控风险
- 大量组件硬编码色值 → 设计系统快速腐化
- 无支付流程 → 产品不能收钱

## 2. Impact Analysis

### Epic 影响

| Epic | 影响类型 | 详情 |
|------|---------|------|
| Epic 8（账户管理） | **阻塞** | Story 8.3 密码重置依赖 SMTP 邮件服务 |
| Epic 9（云端同步） | **影响** | 离线同步失败无告警，需错误监控 |
| Epic 10（AI 温暖回应） | **依赖** | 需 AI 成本写入 + 限额拦截 |
| Epic 12（成本与行为监控） | **范围扩展** | 从 2 个 story 扩展为 4 个，缺整个数据管道 |
| Epic 13（部署与运维） | **范围扩展** | 从 2 个 story 扩展为 6 个，缺邮件/域名/备份 |
| **Epic 14（新）** | **新增** | 支付基础设施 |
| **Epic 15（新）** | **新增** | 开发体验治理 |
| **Epic 16（新）** | **新增** | UX 治理 |

### Artifact 冲突

| 文档 | 需更新内容 |
|------|-----------|
| `epics.md` | 新增 Epic 14/15/16，扩展 Epic 12/13 |
| `architecture.md` | Infrastructure & Deployment 章节大幅扩展：邮件服务、支付 provider、事件追踪 SDK、限流中间件、数据模型变更 |
| `prd.md` | 部署时间线更新（Phase 2 新增基础设施阶段）、MVP 定义扩展 |
| `ux-design-specification.md` | 新增 Onboarding、付费墙、定价页组件策略 |
| `sprint-status.yaml` | 新增 Epic 条目，调整优先级 |
| `.env.example` | 新增 SMTP、支付、Sentry DSN 变量 |
| `project-context.md` | 新增基础设施技术选型记录 |

### 技术影响

- Vercel 国内可达性需评估（可能需要国内 CDN 或备案域名）
- 支付渠道选型需考虑中国大陆用户（支付宝/微信优先）
- 邮件服务需考虑中文模板和国内送达率
- 事件追踪需符合 PIPL（个人信息保护法）

## 3. Recommended Approach

**选择：直接调整 + Hybrid**

不缩减范围，而是扩展基础设施层。按依赖关系排序：

| 阶段 | Epic | 理由 |
|------|------|------|
| **Phase 2（立即）** | Epic 13 扩展（SMTP 部分）+ Epic 15（开发体验） | SMTP 阻塞密码重置；开发体验立即可做 |
| **Phase 2.5** | Epic 14（支付基础设施） | 商业化必须，但不阻塞当前开发 |
| **Phase 3** | Epic 12 扩展（数据分析）+ Epic 16（UX 治理） | 随 AI 功能同步推进 |
| **Phase 4** | Epic 13 剩余（CI/CD、Sentry、域名、备份） | 原计划不变 |

**工作量估计：** 3 个新 Epic + 2 个扩展 Epic，约 20 个 Story，Medium effort。

**风险评估：** Low — 都是成熟技术集成，无技术冒险。主要风险是工作量超出当前 Sprint 容量。

## 4. Detailed Change Proposals

### 4.1 Epic 14: 支付基础设施（Phase 2 优先）

| Story | 描述 | 新增/修改 |
|-------|------|----------|
| 14.1 | 支付渠道选型与集成（支付宝/微信/Ping++），subscriptions 表扩展 | 新增 |
| 14.2 | 定价页 /pricing（Free vs Pro 对比表、CTA） | 新增 |
| 14.3 | 付费墙 + 用量拦截（AI 配额检查、超额拦截、状态机） | 新增 |
| 14.4 | Admin 数据看板（用户数/DAU/转化率/MRR） | 新增 |

### 4.2 Epic 13 扩展：部署与运维

| Story | 描述 | 新增/修改 |
|-------|------|----------|
| 13.3 | SMTP 邮件服务集成（Resend/DirectMail，config.toml 配置，中文化模板） | 新增 |
| 13.4 | 事务邮件系统（密码重置、邮箱验证、订阅通知、安全通知） | 新增 |
| 13.5 | 域名与 SSL 配置（自定义域名、ICP 备案评估、Vercel 绑定） | 新增 |
| 13.6 | 数据库备份策略（backup 配置、灾难恢复、导出格式验证） | 新增 |

### 4.3 Epic 12 扩展：成本与行为监控

| Story | 描述 | 新增/修改 |
|-------|------|----------|
| 12.1 | 事件追踪 SDK（lib/analytics.ts，events 表，核心埋点，PIPL consent） | 新增 |
| 12.2 | AI 成本写入逻辑（Route Handler 写入 ai_usage，token 计量，成本视图） | 新增 |
| 12.3 | AI 每日限额拦截（中间件检查、超额拦截、升级引导） | 新增 |
| 12.4 | 聚合视图 + 基础分析（pg_cron 聚合，daily_metrics，漏斗查询） | 新增 |

### 4.4 Epic 15: 开发体验治理（Phase 2）

| Story | 描述 | 新增/修改 |
|-------|------|----------|
| 15.1 | 自动化测试框架（Vitest + testing-library，首个测试示例） | 新增 |
| 15.2 | Pre-commit Hooks（husky + lint-staged） | 新增 |
| 15.3 | 代码规范（.prettierrc, commitlint, PR 模板） | 新增 |
| 15.4 | GitHub Actions CI（lint + type-check + build + test + audit） | 新增 |

### 4.5 Epic 16: UX 治理（Phase 3）

| Story | 描述 | 新增/修改 |
|-------|------|----------|
| 16.1 | 设计 Token 治理（审计硬编码色值，类型安全 CSS 变量引用） | 新增 |
| 16.2 | 空状态组件升级（可配置 EmptyState，多页面补齐） | 新增 |
| 16.3 | Onboarding 引导（冷启动引导页，3 步引导，降级处理） | 新增 |
| 16.4 | 反馈组件统一（FeedbackMessage 组件，骨架屏替换） | 新增 |
| 16.5 | 组件文档系统（Ladle 引入，核心组件 Story） | 新增 |

## 5. Implementation Handoff

**范围分类：Major**

- 新增 3 个 Epic、扩展 2 个 Epic、更新 6+ 个规划文档
- 影响项目整体 Phase 排期和优先级

**路由：**

| 角色 | 职责 |
|------|------|
| **PM（John）** | 确认 Phase 排期，审核 Epic 14 支付基础设施范围 |
| **架构师（Winston）** | 确认技术选型：支付渠道、邮件服务、事件追踪方案、域名策略 |
| **开发者（Amelia）** | 按新 Epic 顺序逐个执行 Story 实现 |

**成功标准：**

- 所有新 Epic/Story 添加到 `epics.md` 和 `sprint-status.yaml`
- 架构文档更新基础设施章节
- PRD 部署时间线更新
- `.env.example` 包含所有新变量
- Phase 排期获得用户 Kei 确认

## 6. Appendix: Phase 排期总览

```
Phase 1（已完成）: 核心功能 — 心情记录、AI 回应、历史记录
Phase 2（立即）:   基础设施层 — SMTP、支付基础、开发体验治理
Phase 2.5:         支付基础设施 — 定价页、付费墙、Admin 看板
Phase 3:           用户体验 — 数据分析、UX 治理
Phase 4（原计划）: 运维就绪 — CI/CD、Sentry、域名、备份
```
