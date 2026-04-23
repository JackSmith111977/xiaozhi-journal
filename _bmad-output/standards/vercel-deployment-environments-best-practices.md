---
name: vercel-deployment-environments
description: Vercel 部署环境（Production/Preview/Development）分支映射与环境变量配置
type: reference
---

# Vercel 部署环境最佳实践

**调研日期**: 2026-04-23
**来源**: Vercel 官方文档
**版本**: Vercel 2026

---

## 1. 三种部署环境

Vercel 提供三个默认部署环境：

| 环境 | 触发条件 | URL | 用途 |
|------|---------|-----|------|
| **Production** | Production Branch 推送（默认 `main`/`master`） | 自定义域名 + `*.vercel.app` | 线上生产环境 |
| **Preview** | 任何非 Production Branch 的推送（PR/功能分支） | 唯一预览 URL `*-<hash>.vercel.app` | 测试/审查/演示 |
| **Development** | 本地 `vercel dev` 或 `next dev` | `localhost:3000` | 本地开发 |

### 系统环境变量

Vercel 自动提供 `VERCEL_ENV` 变量：
- Production 部署：`VERCEL_ENV = "production"`
- Preview 部署：`VERCEL_ENV = "preview"`
- 本地开发：`VERCEL_ENV = "development"`

可在代码中用 `process.env.VERCEL_ENV` 判断当前环境。

---

## 2. 分支映射配置

### 修改 Production Branch

1. Vercel Dashboard → 项目 → **Settings**
2. **Environments** → **Production Branch** 下拉框
3. 选择目标分支（不限于 `main`/`master`）

### 分支 → 环境映射规则

| 分支类型 | 环境 |
|---------|------|
| Production Branch | Production |
| 任何其它分支/PR | Preview |
| 本地 | Development |

### 保护 Production Branch

建议在 GitHub 仓库设置 Branch Protection Rule：
- 要求 PR 审查通过
- 要求 CI 状态检查通过
- 禁止直接 push 到 Production Branch

---

## 3. 环境变量按环境隔离

### 添加方式

**Dashboard**：
1. 项目 → **Settings** → **Environment Variables**
2. 点击 **Add New Variable**
3. 输入 Name 和 Value
4. 勾选适用的环境（Development / Preview / Production）
5. 保存后 **重新部署** 生效

**CLI**：
```bash
vercel env add <NAME> [Development|Preview|Production]
vercel env list
vercel env pull          # 拉取到本地 .env.local
vercel env pull --environment=production
```

### 变量覆盖优先级

同一变量名可在不同环境设不同值：

| 变量名 | Development | Preview | Production |
|--------|-------------|---------|------------|
| `DATABASE_URL` | `postgresql://localhost:5432/dev` | `postgresql://preview-db.supabase.co/preview` | `postgresql://prod-db.supabase.co/prod` |
| `SENTRY_DSN` | 空 | Preview DSN | Production DSN |
| `NEXT_PUBLIC_API_URL` | `http://localhost:3000` | `https://preview.vercel.app` | `https://xiaozhi.com` |

### 分支级变量覆盖

- 可为**特定分支**设置独立的环境变量
- **分支级变量 > 通用 Preview 变量**（更高优先级）
- 适用场景：功能分支需要不同的数据库/API Key

---

## 4. Preview 部署特性

| 特性 | 说明 |
|------|------|
| 自动触发 | 任何非 Production Branch 推送自动创建 Preview |
| 唯一 URL | 每个 Preview 有独立 URL，格式 `project-<hash>.vercel.app` |
| PR 评论集成 | 每次 Preview 部署后在 GitHub PR 添加评论含 URL |
| 独立变量 | 可为每个分支/PR 设独立环境变量 |
| 自定义域名 | Pro 团队可配置 Preview 自定义域名 |
| 分享链接 | 可通过 **Share Deployment** 生成临时公开链接 |

---

## 5. 本项目推荐配置

### 分支策略

| 分支 | 环境 | 用途 |
|------|------|------|
| `main` | Production | 生产环境，自定义域名 |
| `master` | Preview | 日常开发分支，Vercel 自动 Preview |
| `feature/*` | Preview | 功能分支，独立 Preview URL |

### 环境变量规划

| 变量 | Production | Preview | Development |
|------|-----------|---------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | 生产库 URL | 预览库 URL | 本地 Supabase |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | 生产 Key | 预览 Key | 本地 Key |
| `NEXT_PUBLIC_SENTRY_DSN` | 生产 DSN | 预览 DSN | 空 |
| `SENTRY_AUTH_TOKEN` | CI 环境变量 | 不需要 | 不需要 |
| `DASHSCOPE_API_KEY` | 生产 API Key | 测试 Key | 本地 Key |
| `SUPABASE_SMTP_*` | 生产 SMTP | Inbucket/测试 | Inbucket |

### Sentry 按环境区分

```typescript
// sentry.client.config.ts
Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
  tracesSampleRate: process.env.VERCEL_ENV === 'production' ? 0.1 : 1.0,
});
```

---

## 6. 常见陷阱

| 陷阱 | 解决方案 |
|------|---------|
| 修改环境变量后未重新部署 | 修改变量后必须手动 Redeploy |
| `.env.local` 提交到 Git | 确保 `.gitignore` 包含 `.env*` |
| Preview 和 Production 共用同一数据库 | 使用 `VERCEL_ENV` 区分数据库 URL |
| `NEXT_PUBLIC_` 前缀遗漏 | 客户端访问的变量必须以 `NEXT_PUBLIC_` 开头 |
| 分支映射错误 | 确认 Settings → Production Branch 设置正确 |

---

## 7. 参考链接

- [Vercel Environments](https://vercel.com/docs/deployments/environments)
- [Vercel Environment Variables](https://vercel.com/docs/environment-variables)
- [Managing Environment Variables](https://vercel.com/docs/environment-variables/managing-environment-variables)
- [System Environment Variables](https://vercel.com/docs/environment-variables/system-environment-variables)
- [Set up Staging Environment](https://vercel.com/kb/guide/set-up-a-staging-environment-on-vercel)
- [Per-Environment Build Commands](https://vercel.com/kb/guide/per-environment-and-per-branch-build-commands)
