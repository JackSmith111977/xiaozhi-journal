# Bug Fix Retrospective: bfcache 浏览器后退"加载中"卡死

Date: 2026-04-22
Type: Production Bug
Root Cause: bfcache 恢复 + Supabase 客户端挂死 + 订阅泄漏

## Bug Summary

从历史记录页（`/history`）点击浏览器后退按钮后，页面卡在"加载中..."，无法返回首页。

## Root Cause

三个问题叠加：

1. **`<a href="/history">` 原生标签导航** — 触发整页刷新，浏览器将首页放入 bfcache
2. **bfcache 恢复后 Supabase 客户端挂死** — WebSocket 连接断开，`getSession()` 永远不 resolve
3. **`onAuthStateChange` 订阅泄漏** — 每次 `initialize()` 创建新订阅，仅 `SIGNED_OUT` 时清理

## Fix (4 changes)

| File | Change | Purpose |
|------|--------|---------|
| `page.tsx:214` | `<a href>` → `<Link>` | SPA 导航，避免整页刷新和 bfcache |
| `store/auth.ts` | `initialized` 模块级 flag + 5s 超时 + 单次订阅 | 防重复初始化，超时兜底，防泄漏 |
| `auth-guard.tsx` | 删除 `initCalled` 状态 | 依赖 store 内部幂等，简化逻辑 |
| `bfcache-handler.tsx` | 新增 `pageshow` 监听 | bfcache 恢复时强制 reload，重置所有状态 |

## Key Insights

1. **`<a>` vs `<Link>` 不只是性能问题** — 原生标签导航会改变浏览器 history 行为，影响 SPA 导航模型
2. **Store 的 `initialize()` 必须幂等** — React 19 异步渲染 + Next.js 导航导致组件可能多次 mount/unmount，`initCalled` 组件级状态不可靠
3. **异步初始化必须有超时** — 任何不设置超时的外部服务调用都可能在 bfcache、断网、服务异常时永久挂起
4. **bfcache 是 SPA 的敌人** — 恢复整个 JS 上下文但不保证网络/数据库连接存活，最安全策略是检测后强制 reload

## Lesson for Future

- 导航一律用 `<Link>`，禁止用 `<a>` 做内部页面跳转
- Store `initialize()` 必须包含：幂等 guard + 超时保护 + 单次订阅
- 新页面添加时检查是否遗漏 bfcache 处理
