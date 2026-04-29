# Memory

_Curated long-term knowledge. Empty at birth — grows through sessions._

_Keep under 200 lines. Raw session notes go in `sessions/YYYY-MM-DD.md`._

## API Conventions Registry

| Pattern | Source File | Convention | Last Updated |
|---------|------------|------------|--------------|
| `signIn(email, password, rememberDuration?)` | `src/lib/auth.ts` | 可选 rememberDuration 参数：'none'/'24h'/'7d'/'30d'，'none' 时登录后立即 signOut | 2026-04-29 |

## Naming Conventions Registry

| Type | Convention | Example | Last Updated |
|------|-----------|---------|--------------|
| localStorage key | `xiaozhi:` 前缀 + camelCase | `xiaozhi:lastEmail`, `xiaozhi:lastRememberDuration` | 2026-04-29 |

## Common Errors Registry

| Error Type | Rule ID | Context | Fix Approach | Date |
|------------|---------|---------|-------------|------|
| UI 状态变量未传递给底层 API | CE-001 | rememberDuration 选择器存在但未传给 signIn | 修改 signIn 签名接受可选参数 | 2026-04-29 |
| useEffect 依赖未 memoize 回调 | CE-002 | `onEmailChange` 作为依赖可能触发无限重渲染 | 改为 useState initializer 内一次性调用 | 2026-04-29 |
| 静默 catch 块吞错误 | CE-003 | localStorage 操作失败无反馈 | 至少添加 `console.warn` | 2026-04-29 |
| 非 Error 类型 throw 无兜底 | CE-004 | `catch (err: unknown)` 仅处理 `instanceof Error` | 添加 `String(err)` fallback | 2026-04-29 |

## Review Preferences

| Preference | Value | Reason | Date |
|------------|-------|--------|------|
| 按钮组 ARIA | 用 role="radiogroup" + role="radio" | 屏幕阅读器需要感知选项关系 | 2026-04-29 |
| 布尔切换按钮 | 添加 aria-pressed | 屏幕阅读器需确定当前开关状态 | 2026-04-29 |
| role="radio" 按钮 | 仅用 aria-checked，不用 aria-pressed | jsx-a11y 规则：aria-pressed 不被 radio role 支持 | 2026-04-29 |
