# Story 13.8: Preview 部署验证流程

Status: backlog

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

- [ ] Task 1: 验证 PR Preview 自动触发 (AC: 1)
  - [ ] 1.1 创建功能分支并推送
  - [ ] 1.2 创建 GitHub PR
  - [ ] 1.3 观察 Vercel Preview 部署自动创建
  - [ ] 1.4 确认 PR 评论含 Preview URL

- [ ] Task 2: 验证 Preview 环境变量 (AC: 2)
  - [ ] 2.1 在 Preview 部署中检查 `VERCEL_ENV` = `"preview"`
  - [ ] 2.2 确认使用 Preview Sentry DSN
  - [ ] 2.3 验证分支级变量覆盖生效

- [ ] Task 3: 浏览器功能验证 (AC: 3)
  - [ ] 3.1 打开 Preview URL
  - [ ] 3.2 检查 Console 无错误
  - [ ] 3.3 验证心情选择器、日记输入等核心功能
  - [ ] 3.4 确认 Sentry 错误上报走 Preview DSN

- [ ] Task 4: Share Deployment 测试 (AC: 4)
  - [ ] 4.1 在 Vercel Dashboard 创建 Share Deployment
  - [ ] 4.2 验证临时链接可访问
  - [ ] 4.3 确认无需 Vercel 账号即可访问

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

### Key Distinctions

| Story | Scope |
|-------|-------|
| 13.1 | Vercel 自动部署 CI/CD 流水线 |
| 13.7 | 三环境变量隔离 + 分支映射 |
| **13.8（本 Story）** | Preview 部署验证 + PR 集成 + 浏览器验证 |

### 相关文件

- `xiaozhi-journal/AGENTS.md` — vercel-agent-rules 已存在
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

- 创建 Story 13.8（2026-04-23，Correct Course）
