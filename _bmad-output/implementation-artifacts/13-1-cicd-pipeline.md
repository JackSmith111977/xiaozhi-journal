# Story 13.1: CI/CD Pipeline

Status: in-progress

---

## Story

As a 开发者,
I want 自动化部署流程,
So that 代码提交后能自动构建和部署到生产环境，无需手动操作。

---

## Acceptance Criteria

### AC1: Vercel 项目连接验证

**Given** 现有 `xiaozhi-journal/` Next.js 项目
**When** 检查 Vercel Dashboard
**Then** 项目已连接到 GitHub repo（`main` 分支）
**And** Build Command: `pnpm build`
**And** Output Directory: `.next`
**And** Install Command: `pnpm install`

### AC2: 分支 → 环境映射

**Given** Vercel 项目配置
**When** 配置 Branch Mapping
**Then** `main` → Production Environment
**And** `master` → 暂不自动部署（后续计划部署到 Preview）
**And** PR branches → Preview Deployments

### AC3: 构建触发与通知

**Given** 代码推送到 `main` 分支
**When** Vercel 检测到变更
**Then** 自动触发构建
**And** 构建成功后部署到 Production
**And** 构建失败时发送通知（Email/Slack）

### AC4: 部署成功验证

**Given** 构建成功
**When** 部署完成
**Then** 生产环境 URL 可访问
**And** 显示最新代码内容
**And** 部署记录出现在 Vercel Dashboard

---

## Tasks / Subtasks

- [x] Task 1: 验证 Vercel 项目配置 (AC: 1)
  - [x] 1.1 登录 Vercel Dashboard，确认项目已连接
  - [x] 1.2 检查 Build Settings 是否正确（Framework: Next.js）
  - [x] 1.3 验证 Environment Variables 已配置（Supabase keys 等）

- [x] Task 2: 配置分支映射 (AC: 2)
  - [x] 2.1 在 Vercel Settings → Git 中配置 Production Branch = `main`
  - [x] 2.2 确认 Preview Branches 行为（PR 自动创建 Preview）
  - [x] 2.3 决定 `master` 分支是否部署（建议：仅 Preview，不 Production）

- [x] Task 3: 配置构建通知 (AC: 3)
  - [x] 3.1 在 Vercel Settings → Notifications 配置 Email 通知
  - [x] 3.2 可选：配置 Slack/Discord Webhook（如有）
  - [x] 3.3 测试失败构建通知（故意触发失败构建验证）

- [x] Task 4: 创建 vercel.json（可选，高级配置） (AC: 2, 4)
  - [x] 4.1 评估是否需要 `vercel.json`（路由重写、缓存头等）
  - [x] 4.2 如需要，创建配置文件（参考 Next.js 16 docs）
  - [x] 4.3 验证配置不影响现有路由

- [x] Task 5: 验证完整流程 (AC: 4)
  - [x] 5.1 推送测试提交到 `main`（可空提交）
  - [x] 5.2 观察 Vercel Dashboard 构建过程
  - [x] 5.3 确认部署成功，访问生产 URL

---

## Dev Notes

### Architecture Context

**部署策略（architecture.md § Infrastructure & Deployment）：**
- Web 托管：Vercel（Next.js 原生支持 + Supabase 集成）
- 分支策略：`master` → 开发环境（日常开发）；`main` → 生产环境（自动部署）
- CI/CD：Vercel 自动部署（main → production），PR 合入 main 即触发
- Supabase 环境：开发库 + 生产库分离，两环境起步
- 扩展策略：Vercel Serverless + Supabase 自动扩展，支持 1K→10K DAU

**Vercel 自动部署机制：**
- Vercel 自动监听连接的 GitHub repo
- 每次 push 到 Production Branch 自动触发构建
- PR 自动创建 Preview Deployment（带唯一 URL）
- 无需额外 CI 配置（区别于 Story 15.4 GitHub Actions）

**注意：** 构建命令必须使用 `pnpm build`（项目使用 pnpm，非 npm/yarn）。

### Key Distinctions

| Story | Scope |
|-------|-------|
| **13.1（本 Story）** | Vercel 自动部署配置 |
| **13.2** | Sentry 错误监控集成 |
| **15.4** | GitHub Actions CI（lint + type-check + test） |

**注意：** Story 15.4 在 Phase 2 执行，本 Story 仅配置 Vercel 自动部署。

### Environment Variables

需要在 Vercel Dashboard 配置的环境变量（来自 `.env.local`）：

| 变量 | 说明 |
|------|------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase 项目 URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase Anon Key |
| `SUPABASE_SERVICE_ROLE_KEY` | 服务端 Supabase Key（不暴露） |
| `DASHSCOPE_API_KEY` | 阿里云百炼 API Key（服务端） |
| `ENCRYPTION_SECRET` | BYOK Key 加密密钥（服务端） |

### Vercel.json 考量

根据 Next.js 16 docs，`vercel.json` 可用于：
- 路由重写（rewrites）
- 自定义缓存头
- ISR 配置
- 函数超时设置

**当前评估：** 暂不需要 `vercel.json`，Next.js 16 默认配置足够。

### Project Structure Notes

- 项目根目录：`xiaozhi-journal/`
- 无 `.github/workflows/`（Story 15.4 创建）
- 无 `vercel.json`（暂不需要）

### Testing Standards

- 本 Story 不涉及代码测试
- 验证方式：实际触发构建观察 Vercel Dashboard

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.7 (claude-opus-4-7)

### Debug Log References

无错误需要调试

### Completion Notes List

- 2026-04-23: Story 13-1 完成
  - AC1 ✅: Vercel 项目已连接 GitHub repo，Build Settings 正确（Next.js，pnpm build）
  - AC2 ✅: Production Branch = main，PR 自动创建 Preview
  - AC3 ✅: Email 通知已配置
  - AC4 ✅: 部署成功，生产 URL: https://xiaozhi-journal.keidesu.top/
  - Task 4 评估：暂不需要 vercel.json
  - 环境变量已配置（Supabase + DashScope），ENCRYPTION_SECRET Epic 10 才需要

### Review Findings

#### Decision Needed → Resolved
- [x] [Review][Decision] BYOK 无效 Key 计费策略 — 保持统计（含无效 key 尝试），不计费用。Epic 14 计费系统再区分。
- [x] [Review][Decision] Sentry Replay 隐私 — `replaysSessionSampleRate=0`，保留 `replaysOnErrorSampleRate=1.0`。已修复。
- [x] [Review][Decision] AC2 master 分支行为 — 确认为暂不自动部署，后续计划部署 Preview。AC 已更新。

#### Patch
- [x] [Review][Patch] Completion Notes 构建命令矛盾 — AC 要求 `pnpm build`，但 Completion Notes 记 `npm run build` [cicd-pipeline.md:158] — **已修复**
- [x] [Review][Patch] NaN mood 校验绕过 — `typeof NaN === 'number'` 通过校验，需加 `Number.isNaN()` [route.ts:125] — **已修复**
- [x] [Review][Patch] Sentry client `enableLogs` + `replaysSessionSampleRate` — 移除 `enableLogs`，设 `sampleRate=0` [sentry.client.config.ts] — **已修复**
- [x] [Review][Patch] 服务端 Sentry 无 PII 脱敏 — `sentry.server.config.ts` 加 `beforeSend` [sentry.server.config.ts] — **已修复**
- [x] [Review][Patch] `online` 事件监听未清理 — useEffect 提取命名 handler + `removeEventListener` [page.tsx:155] — **已修复**
- [ ] [Review][Patch] DB 错误静默吞掉 — upsert/update 失败只 `console.error`，不返回错误，不计入 Sentry [route.ts:40-60]
- [ ] [Review][Patch] `||` vs `??` 空字符串歧义 — `byokKey || DASHSCOPE_API_KEY`，`""` 静默回退 [ai.ts:56]
- [ ] [Review][Patch] Sentry client 浏览器扩展噪音过滤 — `beforeSend` 可选补充 [sentry.client.config.ts]
- [ ] [Review][Patch] bfcache `location.reload()` 闪烁 + 丢失草稿 — 需配合 draft save 机制 [bfcache-handler.tsx:12]
- [ ] [Review][Patch] `encryptKey`/`decryptKey` 标记 `async` 但全同步 — 移除 `async` [encryption.ts:13,32]
- [ ] [Review][Patch] journal 更新顺序问题 — `incrementAIUsage` 先于 `updateJournalStatus`，失败时云-端不一致 [route.ts:206-211]
- [ ] [Review][Patch] 429 响应被前端忽略 — 前端直接丢弃 429 响应体，用户无感知 [journal-input.tsx:96-99]
- [ ] [Review][Patch] `userId` 不安全类型断言 — `user.id as string` 可能传播 undefined [route.ts:137]
- [ ] [Review][Patch] upsert 写旧 tier 值 — 并发时新 tier 可能被旧值覆盖，应排除 tier 字段 [route.ts:26-38]

#### Deferred
- [x] [Review][Defer] 前端从不发 useByok — BYOK 前端功能属 Epic 10，后端代码为未来脚手架，当前无可达路径是预期行为。
- [x] [Review][Defer] SQL migration 不可重入 — `CREATE TABLE IF NOT EXISTS` 不改已有表，需新迁移文件。当前阶段不阻塞。
- [x] [Review][Defer] `incrementAIUsage` 竞态 — 注释已承认 read-then-write 非原子，MVP 阶段可接受。
- [x] [Review][Defer] 加密格式无分隔符 — 密文+authTag 硬拼接。当前正常工作，格式迁移可在加密方案升级时处理。
- [x] [Review][Defer] architecture.md 缺 CI/CD 章节 — 可选完善，不影响功能。

#### Dismissed
- auth-guard 多 useEffect 竞态 — 运行正常，过度担忧。
- project-context 技术规范超范围 — 无害，全局上下文更新。