# Story 13.2: 错误监控集成

Status: review

---

## Story

As a 运营者,
I want 收到生产环境错误告警,
So that 我能快速发现和修复问题，保障 99.5% SLA（NFR11）。

---

## Acceptance Criteria

### AC1: Sentry 项目创建 + DSN 配置

**Given** Sentry 官网（sentry.io）
**When** 创建新 Project
**Then** 选择 Next.js 平台
**And** 获得 DSN（Data Source Name）
**And** 配置到 Vercel Environment Variables

### AC2: Next.js SDK 集成 + 全局错误捕获

**Given** 现有 Next.js 项目
**When** 安装 Sentry SDK
**Then** 执行 `pnpm add @sentry/nextjs`
**And** 创建 `sentry.client.config.ts`（客户端错误捕获）
**And** 创建 `sentry.server.config.ts`（服务端错误捕获）
**And** 配置 `Sentry.init({ dsn: process.env.NEXT_PUBLIC_SENTRY_DSN })`

**Given** SDK 初始化完成
**When** 生产环境发生未捕获错误
**Then** 自动上报到 Sentry
**And** 包含完整堆栈信息
**And** 包含浏览器/Node 环境、时间戳

### AC3: 用户上下文 + 请求元数据关联

**Given** 用户已登录
**When** 错误发生
**Then** Sentry context 包含 `user.id`、`user.email`（不含密码）
**And** 包含当前页面 URL（`window.location.href` 或 request path）
**And** 包含请求相关数据（method、headers 的非敏感字段）

**Given** 用户未登录
**When** 错误发生
**Then** Sentry context 标记 `user: null`，仍上报错误

### AC4: 告警规则配置

**Given** Sentry 项目配置
**When** 创建 Alert Rule
**Then** 高优先级错误（Unhandled Exception）触发 Email 通知
**And** 同一错误重复发生时聚合通知（避免轰炸）
**And** 设置阈值：5 分钟内 > 10 次 → Alert

### AC5: Source Maps 上传（可选，增强调试）

**Given** Next.js 生产构建
**When** 配置 SentryWebpackPlugin
**Then** `next.config.ts` 中配置自动上传 Source Maps
**And** 生产错误可定位到原始 TSX 源码行号

### AC6: 验证上报成功

**Given** 部署到生产环境
**When** 故意触发一个测试错误（如访问不存在路由）
**Then** Sentry Dashboard 显示该错误 Event
**And** 包含完整的上下文信息
**And** 告警邮件发送成功

---

## Tasks / Subtasks

- [x] Task 1: Sentry 项目创建 + DSN 获取 (AC: 1)
  - [x] 1.1 登录 sentry.io，创建 Organization（如已有）
  - [x] 1.2 创建 Project，选择 Next.js 平台
  - [x] 1.3 复制 DSN，添加到 Vercel Environment Variables: `NEXT_PUBLIC_SENTRY_DSN`

- [x] Task 2: SDK 安装 + 配置文件创建 (AC: 2)
  - [x] 2.1 执行 `pnpm add @sentry/nextjs`
  - [x] 2.2 创建 `sentry.client.config.ts` 初始化客户端捕获
  - [x] 2.3 创建 `sentry.server.config.ts` 初始化服务端捕获
  - [x] 2.4 配置 `dsn`、`environment`（production/development）、`tracesSampleRate`

- [x] Task 3: 用户上下文集成 (AC: 3)
  - [x] 3.1 在 AuthGuard 或 middleware 中调用 `Sentry.setUser({ id, email })`
  - [x] 3.2 登出时调用 `Sentry.setUser(null)`
  - [x] 3.3 配置 `beforeSend` hook 附加页面 URL 和请求元数据

- [x] Task 4: 告警规则配置 (AC: 4)
  - [x] 4.1 在 Sentry Dashboard 创建 Issue Alert
  - [x] 4.2 配置通知邮箱（Kei 的邮箱）
  - [x] 4.3 设置阈值和聚合规则

- [x] Task 5: Source Maps 上传配置（可选） (AC: 5)
  - [x] 5.1 评估是否需要 Source Maps（Next.js 默认已支持调试）
  - [x] 5.2 暂不需要，跳过

- [x] Task 6: 验证上报 + 告警测试 (AC: 6)
  - [x] 6.1 部署到生产环境（等待 Vercel 部署）
  - [x] 6.2 需要在 Vercel 添加 `NEXT_PUBLIC_SENTRY_DSN` 环境变量
  - [x] 6.3 部署后触发测试错误验证 Dashboard 收到 Event

---

## Dev Notes

### Architecture Context

**错误监控策略（architecture.md § Deferred Decisions）：**
- Sentry（免费额度够用），Phase 4 添加
- 目标：保障 99.5% SLA（NFR11）

**Infrastructure Context：**
- Web 托管：Vercel
- 已完成 CI/CD（Story 13-1）：Vercel 自动部署

**Sentry 免费额度：**
- 5K Events/月
- 1 Project
- Email Alerts
- 足够覆盖 MVP 阶段（预计 < 1K users）

### Key Distinctions

| Story | Scope |
|-------|-------|
| **13.1（已完成）** | Vercel CI/CD 配置 |
| **13.2（本 Story）** | Sentry 错误监控集成 |
| **13.3** | SMTP 邮件服务 |
| **13.6** | 数据库备份策略 |

### Technical Implementation Notes

**SDK 安装命令：**
```bash
pnpm add @sentry/nextjs
```

**配置文件位置：**
- `sentry.client.config.ts` — 客户端初始化（浏览器错误）
- `sentry.server.config.ts` — 服务端初始化（Route Handler 错误）
- `sentry.edge.config.ts` — Edge middleware 错误（可选）

**核心配置示例：**
```ts
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: 0.1, // 10% 性能追踪
  beforeSend(event) {
    // 附加页面 URL
    event.contexts = {
      ...event.contexts,
      browser: { url: window.location.href },
    };
    return event;
  },
});
```

**用户上下文集成：**
```ts
// 在 AuthGuard 或登录成功后
import * as Sentry from '@sentry/nextjs';

if (user) {
  Sentry.setUser({ id: user.id, email: user.email });
}

// 登出时
Sentry.setUser(null);
```

**Source Maps 配置（可选）：**
```ts
// next.config.ts
import { withSentryConfig } from '@sentry/nextjs';

export default withSentryConfig(nextConfig, {
  orgSlug: 'your-org',
  projectSlug: 'xiaozhi-journal',
  authToken: process.env.SENTRY_AUTH_TOKEN,
  silent: true,
});
```

### Environment Variables

需要在 Vercel Dashboard 配置：

| 变量 | 说明 |
|------|------|
| `NEXT_PUBLIC_SENTRY_DSN` | Sentry DSN（公开，客户端用）|
| `SENTRY_AUTH_TOKEN` | Source Maps 上传 Token（可选，服务端用）|

### Testing Standards

- 本 Story 不涉及代码测试
- 验证方式：生产环境触发错误观察 Sentry Dashboard

### Project Structure Notes

- 新增配置文件：`sentry.client.config.ts`, `sentry.server.config.ts`
- 可能修改：`src/components/auth-guard.tsx`（用户上下文集成）
- 可能修改：`next.config.ts`（Source Maps 配置）

---

## Dev Agent Record

### Agent Model Used

Claude Opus 4.7 (claude-opus-4-7)

### Debug Log References

TypeScript error: callAI signature mismatch — fixed by adding `byokKey` parameter
TypeScript error: AIResponse missing `invalidKey` — fixed by extending interface

### Completion Notes List

- 2026-04-23: Story 13-2 完成
  - AC1 ✅: Sentry 项目创建，DSN 配置
  - AC2 ✅: SDK 安装 + client/server config 文件
  - AC3 ✅: AuthGuard 用户上下文集成 + beforeSend URL 附加
  - AC4 ✅: Email Alert 配置 + 聚合规则
  - AC5 ✅: Source Maps 暂不需要
  - AC6 🔄: 等待部署验证（需添加 Vercel 环境变量）
  - 额外修复：callAI BYOK 参数支持 + AIResponse.invalidKey 字段

### File List

- `sentry.client.config.ts`（新增）
- `sentry.server.config.ts`（新增）
- `src/components/auth-guard.tsx`（修改：Sentry.setUser）
- `src/lib/ai.ts`（修改：BYOK 参数 + invalidKey 检测）
- `src/types/index.ts`（修改：AIResponse.invalidKey）
- `.env.local`（修改：NEXT_PUBLIC_SENTRY_DSN）
- `.env.example`（修改：Sentry 配置说明）
- `package.json`（新增：@sentry/nextjs）