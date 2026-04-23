---
name: sentry-best-practices
description: Sentry Next.js SDK v10+ 最佳实践参考
type: reference
---

# Sentry Next.js SDK (v10+) 最佳实践

**调研日期**: 2026-04-23
**版本**: Sentry v10+ (OpenTelemetry v2)
**来源**: Sentry 官方文档

---

## 1. 核心配置文件

### App Router 推荐文件结构

**浏览器端配置** (`instrumentation-client.ts` 或 `sentry.client.config.ts`):
```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === "development" ? 1.0 : 0.1,
  integrations: [Sentry.replayIntegration()],
  replaysOnErrorSampleRate: 1.0,
  enableLogs: true, // v10+ 正式 API，不再是 _experiments
  beforeSend(event) {
    // 脱敏处理
    if (event.user?.email) delete event.user.email;
    return event;
  },
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
```

**服务端入口** (`instrumentation.ts`):
```typescript
export async function register() {
  if (process.env.NEXT_RUNTIME === "nodejs") {
    await import("./sentry.server.config");
  }
  if (process.env.NEXT_RUNTIME === "edge") {
    await import("./sentry.edge.config");
  }
}

export const onRequestError = Sentry.captureRequestError;
```

---

## 2. 错误捕获模式

| 场景 | 方法 |
|------|------|
| 全局错误边界 | `global-error.tsx` + `Sentry.captureException()` |
| 服务端请求错误 | `onRequestError` hook (Next.js 15+) |
| Server Actions | `Sentry.withServerActionInstrumentation()` |
| 客户端未捕获 | SDK 自动捕获 (需 init) |

---

## 3. 用户上下文集成

```typescript
// 登录后设置
Sentry.setUser({ id: user.id, email: user.email, username: user.username });

// 登出时清除
Sentry.setUser(null);

// beforeSend 脱敏
beforeSend(event) {
  if (event.user) delete event.user.email; // 不上报敏感字段
  return event;
}
```

---

## 4. Source Maps 配置

```typescript
// next.config.ts
import { withSentryConfig } from "@sentry/nextjs";

export default withSentryConfig(nextConfig, {
  org: "your-org",
  project: "your-project",
  authToken: process.env.SENTRY_AUTH_TOKEN, // CI 环境变量
  widenClientFileUpload: true,
});
```

**注意事项**:
- `SENTRY_AUTH_TOKEN` 不可提交到版本控制
- 仅在 CI 构建时设置（本地开发不需要）

---

## 5. 性能监控

| 环境 | tracesSampleRate |
|------|-----------------|
| 开发 | 1.0 (100%) |
| 生产 | 0.1 (10%) 或根据流量调整 |

**v10+ 变更**: 使用 `hasSpansEnabled` 替代 `hasTracingEnabled`

---

## 6. v9 → v10 Migration 关键变更

| 项目 | v9 | v10 |
|------|----|----|
| OpenTelemetry | v1 | v2 |
| FID 指标 | 支持 | 移除，用 INP |
| 日志 API | `_experiments.enableLogs` | `enableLogs` |
| IP 收集 | 默认 | 需显式 `sendDefaultPii: true` |

---

## 7. 常见陷阱

| 陷阱 | 解决方案 |
|------|---------|
| `SENTRY_AUTH_TOKEN` 提交 | 使用 CI 环境变量，不写入代码 |
| `beforeSend` 返回 null | 会丢弃事件，确保返回 event 或 throw |
| 大数据块触发 413 | 过滤大型 context，避免超限 |
| Alert 配置使用 FID | v10 移除 FID，使用 INP |

---

## 8. 本项目已实现

| 功能 | 实现状态 |
|------|---------|
| SDK 安装 | ✅ `@sentry/nextjs` |
| client config | ✅ `sentry.client.config.ts` |
| server config | ✅ `sentry.server.config.ts` |
| 用户上下文 | ✅ `AuthGuard` 中 `Sentry.setUser()` |
| beforeSend URL | ✅ 附加 `window.location.href` |
| Source Maps | ⏳ 暂不需要 |
| Alert | ✅ Email Alert + 聚合 |

---

## 9. 参考链接

- [Sentry Next.js Manual Setup](https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/)
- [v9 to v10 Migration](https://docs.sentry.io/platforms/javascript/guides/nextjs/migration/v9-to-v10/)
- [Filtering Configuration](https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/filtering/)
- [APIs Configuration](https://docs.sentry.io/platforms/javascript/guides/nextjs/configuration/apis/)