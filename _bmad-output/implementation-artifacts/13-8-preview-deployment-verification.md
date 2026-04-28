# Story 13.8: Preview 部署验证流程

Status: done

---

## Story

As a 开发者,
I want 每次 PR 自动有可访问的 Preview URL,
So that 可以在合入 main 前验证功能正确性。

---

## Acceptance Criteria

### AC1: PR 自动触发 Preview 部署

**Given** 代码推送到非 main 分支
**When** Vercel 检测到变更
**Then** 自动创建 Preview 部署
**And** 生成唯一 URL `project-<hash>.vercel.app`
**And** GitHub PR 自动评论含 Preview URL

### AC2: Preview 环境变量隔离

**Given** Preview 部署已创建
**When** 访问 Preview URL
**Then** 使用 Preview 环境变量（非 Production 变量）
**And** Preview Sentry DSN 指向 Preview 项目
**And** 分支级变量覆盖通用 Preview 变量

### AC3: 浏览器验证无错误

**Given** Preview 部署已创建
**When** 在浏览器打开 Preview URL
**Then** Console 无构建/运行时错误
**And** 首屏加载正常（波形图 + 心情选择器可见）
**And** 无 404 路由错误

### AC4: Share Deployment 临时分享

**Given** 需要临时分享 Preview
**When** 点击 Vercel Dashboard → Share Deployment
**Then** 生成临时公开链接
**And** 链接无需 Vercel 账号即可访问
**And** 链接有效期可配置

---

## Tasks / Subtasks

- [x] Task 1: 验证 PR Preview 自动触发 (AC: 1) — ✅ 用户已验证
  - [x] 1.1 创建功能分支并推送
  - [x] 1.2 创建 GitHub PR
  - [x] 1.3 观察 Vercel Preview 部署自动创建
  - [x] 1.4 确认 PR 评论含 Preview URL

- [x] Task 2: 验证 Preview 环境变量 (AC: 2) — ✅ 用户已验证
  - [x] 2.1 在 Preview 部署中检查 `VERCEL_ENV` = `"preview"`
  - [x] 2.2 确认使用 Preview Sentry DSN
  - [x] 2.3 验证分支级变量覆盖生效

- [x] Task 3: 浏览器功能验证 (AC: 3) — ✅ 用户已验证
  - [x] 3.1 打开 Preview URL
  - [x] 3.2 检查 Console 无错误
  - [x] 3.3 验证心情选择器、日记输入等核心功能
  - [x] 3.4 确认 Sentry 错误上报走 Preview DSN

- [x] Task 4: Share Deployment 测试 (AC: 4) — ✅ 用户已验证
  - [x] 4.1 在 Vercel Dashboard 创建 Share Deployment
  - [x] 4.2 验证临时链接可访问
  - [x] 4.3 确认无需 Vercel 账号即可访问

---

## Dev Notes

### Architecture Context

**Preview 部署特性**（参考 Vercel 标准文档）:

| 特性 | 说明 |
|------|------|
| 自动触发 | 任何非 Production Branch 推送自动创建 |
| 唯一 URL | `project-<hash>.vercel.app` |
| PR 评论集成 | GitHub PR 自动评论含 Preview URL |
| 独立变量 | 可为每个分支/PR 设独立环境变量 |
| 分享链接 | Share Deployment 生成临时公开链接 |

### Previous Story Intelligence (13.7)

**已完成配置：**
- Production Branch = `main`
- `master` → Preview 环境
- `feature/*` → Preview 环境
- 三环境变量隔离（NEXT_PUBLIC_SUPABASE_URL, SENTRY_DSN 等）
- VERCEL_ENV 采样率配置
- SMTP 服务商已切换到 Resend（smtp.resend.com）

**Story 13.7 验证结果：**
- ✅ Sentry VERCEL_ENV 采样率修复已应用
- ✅ Resend SMTP 配置验证通过（密码重置邮件送达）
- ✅ Vercel CLI 技术调研文档已创建

### Key Distinctions

| Story | Scope |
|-------|-------|
| 13.1 | Vercel 自动部署 CI/CD 流水线 |
| 13.7 | 三环境变量隔离 + 分支映射 + SMTP 配置 |
| **13.8（本 Story）** | Preview 部署验证 + PR 集成 + 浏览器验证 |

### 技术要求

**Preview 部署验证清单：**

1. **PR 自动触发**
   - 创建功能分支 → 推送 → 创建 PR
   - Vercel 自动创建 Preview 部署
   - GitHub PR 评论含 Preview URL

2. **环境变量验证**
   - Preview 使用 Preview 环境变量
   - `VERCEL_ENV = "preview"`
   - Sentry DSN 指向 Preview 项目

3. **浏览器验证**
   - Console 无构建/运行时错误
   - 首屏加载正常（波形图 + 心情选择器）
   - 核心 UI 功能可用

4. **Share Deployment**
   - 临时分享链接可生成
   - 无需 Vercel 账号可访问

### Git Intelligence

**最近 10 次提交：**
- `8255f38` — docs(epic-13): Vercel CLI 调研 + 三环境配置指南
- `42fa6f2` — feat(epic-13): SMTP 服务商变更 + Story 13.7 完成
- `9b36ae0` — fix(epic-4): High Impact deferred 修复 + retro

**代码模式：**
- Story 文件状态变更：`Status: backlog` → `Status: ready-for-dev` → `Status: done`
- Sprint Status YAML 同步更新
- 提交信息格式：`feat(epic-X): description` / `fix(epic-X): description`

### 相关文件

- `_bmad-output/standards/vercel-deployment-environments-best-practices.md` — Vercel 三环境配置参考
- `_bmad-output/implementation-artifacts/13-7-vercel-three-env-config.md` — 上一个 Story（三环境配置）
- `_bmad-output/implementation-artifacts/13-1-cicd-pipeline.md` — CI/CD 流水线配置
- `xiaozhi-journal/sentry.client.config.ts` — Sentry VERCEL_ENV 采样率
- `.github/workflows/` — GitHub Actions CI（如存在）

### 验证工具

**可用 MCP 工具：**
- `mcp__playwright__browser_navigate` — 打开 Preview URL
- `mcp__playwright__browser_snapshot` — 页面快照验证
- `mcp__playwright__browser_console_messages` — Console 错误检查

**本地命令：**
- `git checkout -b feature/test-preview` — 创建测试分支
- `git push origin feature/test-preview` — 推送触发 Preview
- `gh pr create` — 创建 GitHub PR

---

## Dev Agent Record

### Implementation Plan

Story 13.8 为验证型 Story，无代码实现。
所有 AC 通过用户手动验证确认。

### Completion Notes

- ✅ Task 1-4 全部通过用户验证
- Preview 部署自动触发正常
- 环境变量隔离正常（VERCEL_ENV=preview）
- 浏览器无错误，核心功能可用
- Share Deployment 可正常生成临时链接

**验证结论：** Vercel Preview 部署流程符合预期。

---

## File List

无文件变更（验证型 Story）

---

## Change Log

- 创建 Story 13.8（2026-04-23，Correct Course）
- 状态更新 → ready-for-dev（2026-04-27）
- 状态更新 → in-progress（2026-04-27）
- Task 1-4 全部完成（2026-04-27，用户验证）
- 状态更新 → review（2026-04-27）
- 状态更新 → done（2026-04-27）
