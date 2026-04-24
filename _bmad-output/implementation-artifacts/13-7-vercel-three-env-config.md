# Story 13.7: Vercel 三环境配置

Status: backlog

---

## Story

As a 开发者,
I want 配置 Production/Preview/Development 三环境隔离,
So that 不同环境有独立的变量、分支策略、Sentry DSN。

---

## Acceptance Criteria

### AC1: Production Branch 配置

**Given** Vercel 项目已创建
**When** 检查 Settings → Environments
**Then** Production Branch = `main`
**And** `master` 分支归入 Preview 环境
**And** `feature/*` 分支归入 Preview 环境

### AC2: 环境变量三环境隔离

**Given** Vercel Dashboard → Settings → Environment Variables
**When** 配置环境变量
**Then** 按 Development/Preview/Production 三环境分别设置
**And** 同一变量名可在不同环境设不同值
**And** 关键变量包含：
  - `NEXT_PUBLIC_SUPABASE_URL`（三环境不同值）
  - `NEXT_PUBLIC_SUPABASE_ANON_KEY`（三环境不同值）
  - `NEXT_PUBLIC_SENTRY_DSN`（Production = 生产 DSN，Preview = 预览 DSN，Development = 空）
  - `DASHSCOPE_API_KEY`（Production/Preview/Development 均可配置）
  - `SENTRY_AUTH_TOKEN`（仅 Production/CI 环境）

### AC3: `VERCEL_ENV` 环境变量使用

**Given** 代码中使用 `process.env.VERCEL_ENV`
**When** 部署到不同环境
**Then** Production: `VERCEL_ENV = "production"`
**And** Preview: `VERCEL_ENV = "preview"`
**And** Development: `VERCEL_ENV = "development"`

**Given** Sentry 采样率配置
**When** 按环境区分
**Then** Production: `tracesSampleRate: 0.1`
**And** Preview/Development: `tracesSampleRate: 1.0`

### AC4: 分支级变量覆盖

**Given** 特定分支需要独立环境变量
**When** 在 Vercel Dashboard 为分支设置变量
**Then** 分支级变量覆盖通用 Preview 变量
**And** 适用场景：功能分支需要不同的数据库/API Key

### AC5: 安全要求

**Given** 环境变量配置
**When** 检查 `.env*` 文件
**Then** `.env*` 不提交到 Git（`.gitignore` 包含）
**And** `SENTRY_AUTH_TOKEN` 仅在 CI/Production 环境设置
**And** 敏感变量不暴露在 Preview 环境

### AC6: SMTP 提供商注册 + 生产环境配置

**Given** 需要中文邮件发送服务（Story 13.3 已配置模板，缺真实 SMTP 账号）
**When** 注册阿里云 DirectMail
**Then** 完成实名认证 + 发信域名绑定
**And** 获取 SMTP 凭据（host/port/user/pass）
**And** 在 Vercel Dashboard Production 环境配置 `SUPABASE_SMTP_*` 变量
**And** 在 Supabase Dashboard 上传中文邮件模板
**And** 触发密码重置验证邮件正常送达

---

## Tasks / Subtasks

- [ ] Task 1: 验证 Production Branch 配置 (AC: 1)
  - [ ] 1.1 登录 Vercel Dashboard → Settings → Git
  - [ ] 1.2 确认 Production Branch = `main`
  - [ ] 1.3 推送测试提交到 `master`，验证触发 Preview 而非 Production

- [ ] Task 2: 配置三环境变量 (AC: 2, 3)
  - [ ] 2.1 在 Vercel Dashboard → Environment Variables 按环境配置
  - [ ] 2.2 确认 `VERCEL_ENV` 系统变量可用
  - [ ] 2.3 验证 Sentry DSN 按环境区分
  - [ ] 2.4 验证采样率代码使用 `VERCEL_ENV` 判断

- [ ] Task 3: 验证分支级变量覆盖 (AC: 4)
  - [ ] 3.1 创建功能分支
  - [ ] 3.2 为分支设置独立环境变量
  - [ ] 3.3 推送触发 Preview 部署
  - [ ] 3.4 验证使用分支级变量而非通用 Preview 变量

- [ ] Task 4: 安全检查 (AC: 5)
  - [ ] 4.1 确认 `.gitignore` 包含 `.env*`
  - [ ] 4.2 确认 `SENTRY_AUTH_TOKEN` 不在 Development/Preview 环境设置
  - [ ] 4.3 通过 `vercel env list` 检查变量分布

- [ ] Task 5: 注册 SMTP 提供商 + 生产环境部署 (AC: 6)
  - [ ] 5.1 注册阿里云 DirectMail 账号（需阿里云账号 + 实名认证）
  - [ ] 5.2 绑定发信域名（需备案域名或通过 DMARC 验证）
  - [ ] 5.3 获取 SMTP 凭据：host = `smtpdm.aliyun.com`, port = `465`, user, pass
  - [ ] 5.4 在 Vercel Dashboard → Environment Variables → Production 环境配置：
    - `SUPABASE_SMTP_HOST=smtpdm.aliyun.com`
    - `SUPABASE_SMTP_PORT=465`
    - `SUPABASE_SMTP_USER=<发信邮箱>`
    - `SUPABASE_SMTP_PASS=<SMTP 密码>`
    - `SUPABASE_SMTP_ADMIN_EMAIL=<noreply 域名邮箱>`
  - [ ] 5.5 在 Vercel Dashboard Preview 环境配置测试 SMTP 凭据（如有）
  - [ ] 5.6 在 Supabase Dashboard → Auth → Email Templates 上传中文邮件模板
  - [ ] 5.7 触发一次密码重置，验证生产环境邮件正常送达

---

## Dev Notes

### Architecture Context

**Vercel 三环境模型**（参考 `_bmad-output/standards/vercel-deployment-environments-best-practices.md`）:

| 环境 | 触发条件 | URL | 用途 |
|------|---------|-----|------|
| Production | Production Branch 推送 | 自定义域名 + `*.vercel.app` | 线上生产 |
| Preview | 非 Production Branch 推送 | `*-<hash>.vercel.app` | 测试/审查 |
| Development | 本地 `vercel dev` | `localhost:3000` | 本地开发 |

**环境变量规划**（来自 Vercel 标准文档）:

| 变量 | Production | Preview | Development |
|------|-----------|---------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | 生产库 URL | 预览库 URL | 本地 Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 生产 Key | 预览 Key | 本地 Key |
| `NEXT_PUBLIC_SENTRY_DSN` | 生产 DSN | 预览 DSN | 空 |
| `SENTRY_AUTH_TOKEN` | CI 环境变量 | 不需要 | 不需要 |
| `DASHSCOPE_API_KEY` | 生产 API Key | 测试 Key | 本地 Key |

### Key Distinctions

| Story | Scope |
|-------|-------|
| 13.1 | Vercel 自动部署 CI/CD 流水线 |
| 13.3 | SMTP 配置文件 + 本地 Inbucket 验证（模板已创建，未注册真实账号） |
| **13.7（本 Story）** | 三环境变量隔离 + 分支映射 + `VERCEL_ENV` + SMTP 注册 + 生产部署 |
| 13.8 | Preview 部署验证流程 + PR 集成 |

### 相关文件

- `xiaozhi-journal/AGENTS.md` — vercel-agent-rules 已存在
- `docs/project-context.md` — Technology Stack 已包含 Vercel
- `_bmad-output/standards/vercel-deployment-environments-best-practices.md` — 完整参考

---

## Dev Agent Record

### Implementation Plan

_待实现_

### Completion Notes

_待实现_

---

## File List

_待实现_

---

## Change Log

- 创建 Story 13.7（2026-04-23，Correct Course）
