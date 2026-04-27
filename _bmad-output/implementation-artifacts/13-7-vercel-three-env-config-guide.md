# Vercel 三环境配置操作指南

> 本文档为 Story 13.7 实施指南，基于 Vercel 官方文档调研。

---

## Sources

- [Environments - Vercel Docs](https://vercel.com/docs/deployments/environments) — 三环境定义
- [Environment Variables - Vercel Docs](https://vercel.com/docs/environment-variables) — 环境变量配置
- [System Environment Variables - Vercel Docs](https://vercel.com/docs/environment-variables/system-environment-variables) — VERCEL_ENV 定义
- [Managing Environment Variables - Vercel Docs](https://vercel.com/docs/environment-variables/managing-environment-variables) — 变量管理

---

## 1. 三环境定义（官方文档）

### 1.1 环境类型

| 环境 | 触发条件 | URL | 用途 |
|------|---------|-----|------|
| **Local Development** | 本地 `vercel dev` 或框架开发命令 | `localhost:3000` | 开发调试 |
| **Preview** | 非 Production Branch 推送 / PR / `vercel` CLI | `*-<hash>.vercel.app` | 测试/QA |
| **Production** | Production Branch 推送 / `vercel --prod` | 自定义域名 + `*.vercel.app` | 用户访问 |

**来源：** [Environments - Vercel Docs](https://vercel.com/docs/deployments/environments)

### 1.2 VERCEL_ENV 系统变量

> **官方定义：** The environment that the app is deployed and running on. The value can be either production, preview, or development.

```bash
VERCEL_ENV=production | preview | development
```

**可用时机：** Build 和 Runtime 都可用

**来源：** [System Environment Variables - Vercel Docs](https://vercel.com/docs/environment-variables/system-environment-variables#vercel_env)

---

## 2. 环境变量配置（官方文档）

### 2.1 按环境设置变量

每个变量可选择应用到以下环境：
- **Production** — Production Branch 推送时生效
- **Preview** — 非 Production Branch 推送时生效
- **Development** — `vercel dev` 本地开发时生效

**来源：** [Environment Variables - Vercel Docs](https://vercel.com/docs/environment-variables#environments)

### 2.2 分支级变量覆盖

> **官方规则：** Any branch-specific variables will override other preview environment variables with the same name.

- Preview 变量可按分支设置独立值
- 分支级变量 > 通用 Preview 变量（优先级更高）
- 无需为每个分支复制所有变量，仅需覆盖需要的

**来源：** [Environment Variables - Preview environment variables](https://vercel.com/docs/environment-variables#preview-environment-variables)

### 2.3 变量修改生效

> **官方规则：** Changes to environment variables are not applied to previous deployments, they only apply to new deployments. You must redeploy your project to update the value of any variables.

**来源：** [Managing Environment Variables - Vercel Docs](https://vercel.com/docs/environment-variables/managing-environment-variables)

---

## 3. 已完成代码改动

### ✅ Sentry VERCEL_ENV 采样率修复

**文件变更：**
- `sentry.client.config.ts`
- `sentry.server.config.ts`
- `sentry.edge.config.ts`

**改动内容：**
```typescript
// 修复前（错误）
environment: process.env.NODE_ENV,
tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,

// 修复后（正确）
environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
tracesSampleRate: process.env.VERCEL_ENV === 'production' ? 0.1 : 1.0,
```

**采样率对照表：**
| 环境 | VERCEL_ENV | tracesSampleRate |
|------|------------|------------------|
| Production | `production` | 0.1 |
| Preview | `preview` | 1.0 |
| Development | `development` 或 undefined | 1.0 |

### ✅ .gitignore 安全检查

`.gitignore` 已包含 `.env*`，防止敏感环境变量提交到 Git。

---

## 4. 用户手动操作清单

### 🔧 Task 1: 验证 Production Branch 配置

**操作步骤：**
1. 登录 [Vercel Dashboard](https://vercel.com/dashboard)
2. 项目 → Settings → Git
3. 确认 Production Branch = `main`
4. 推送测试提交到 `master`，验证触发 Preview 而非 Production

---

### 🔧 Task 2: 配置三环境变量

**操作步骤：**
1. Vercel Dashboard → Settings → [Environment Variables](https://vercel.com/d?to=%2F%5Bteam%5D%2F%5Bproject%5D%2Fsettings%2Fenvironment-variables)
2. 按 Development/Preview/Production 分别配置：

| 变量 | Production | Preview | Development |
|------|-----------|---------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | 生产库 URL | 预览库 URL | 本地 Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 生产 Key | 预览 Key | 本地 Key |
| `NEXT_PUBLIC_SENTRY_DSN` | `https://49c2cb055a3c297e455f5901659f859e@o4511267437871104.ingest.de.sentry.io/4511267445473360` | 预览 DSN（可选） | 空 |
| `DASHSCOPE_API_KEY` | 生产 API Key | 测试 Key | 本地 Key |
| `SENTRY_AUTH_TOKEN` | CI（GitHub Actions）| 不设置 | 不设置 |

3. **重要：** 配置后必须 Redeploy 才生效

---

### 🔧 Task 3: 验证分支级变量覆盖

**适用场景：** 功能分支需要不同数据库/API Key。

**操作步骤：**
1. Settings → Environment Variables
2. 点击变量 → Add Override for Branch
3. 输入分支名
4. 设置分支级变量值
5. 推送该分支触发 Preview 部署
6. 验证使用分支级变量

---

### 🔧 Task 4: 安全检查

**已完成：**
- ✅ `.gitignore` 包含 `.env*`

**待验证：**
- [ ] `SENTRY_AUTH_TOKEN` 仅在 Production/CI 环境
- [ ] 运行 `vercel env list` 检查变量分布

**CLI 命令：**
```bash
vercel env list
```

---

### 🔧 Task 5: 注册 SMTP 提供商

**前置要求：**
- 阿里云账号 + 实名认证
- 备案域名或 DMARC 验证域名

**操作步骤：**
1. 注册阿里云 DirectMail
2. 绑定发信域名（配置 DNS TXT）
3. 获取 SMTP 凭据（host/port/user/pass）
4. Vercel Production 环境配置 `SUPABASE_SMTP_*`
5. Supabase Dashboard 上传中文邮件模板
6. 触发密码重置验证送达

---

## 5. 完成检查清单

- [x] Sentry VERCEL_ENV 采样率修复（代码）
- [x] .gitignore 包含 `.env*`
- [ ] Production Branch = `main`（Vercel Dashboard）
- [ ] 三环境变量配置完成
- [ ] `SENTRY_AUTH_TOKEN` 仅在 Production/CI
- [ ] SMTP 提供商注册 + 生产验证

---

## 6. 参考链接

- [Environments - Vercel Docs](https://vercel.com/docs/deployments/environments)
- [Environment Variables - Vercel Docs](https://vercel.com/docs/environment-variables)
- [System Environment Variables - Vercel Docs](https://vercel.com/docs/environment-variables/system-environment-variables)
- [Managing Environment Variables - Vercel Docs](https://vercel.com/docs/environment-variables/managing-environment-variables)