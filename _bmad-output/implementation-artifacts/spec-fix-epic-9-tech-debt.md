---
title: 'Epic 9 技术债务修复'
type: 'refactor'
created: '2026-04-20'
status: 'in-review'
baseline_commit: 'f1a622205ad661e4ce46047583042043ef2efd7e'
context: []
---

<frozen-after-approval reason="human-owned intent — do not modify unless human renegotiates">

## Intent

**Problem:** Epic 9 Retrospective 识别了 5 项技术债务：Auth 用户删除后残留（P0）、异步资源泄漏风险（P1）、journals 表缺少 updated_at 索引（P1）、DB/TS 状态映射冗余（P2）、离线提示不自动清除（P2）。

**Approach:** 通过 Next.js API Route 实现 Auth 用户删除、合并重复的 online/offline 监听器、补充数据库索引、简化状态映射逻辑、优化离线提示生命周期。

## Boundaries & Constraints

**Always:**
- Service role key 仅用于服务端 API Route，不暴露给客户端
- 所有变更保持向后兼容，不破坏现有功能
- 保持现有 UI 交互不变

**Ask First:**
- 如果 Supabase Admin API 在当前版本中不可用，改用 Supabase Management API
- 如果删除 Auth 用户的 API 因权限限制无法调用，降级为仅删除 profile + 记录日志

**Never:**
- 不在客户端直接使用 service role key
- 不修改 journals 表的 CHECK 约束（已支持 6 种状态值）
- 不引入新的第三方依赖

## I/O & Edge-Case Matrix

| Scenario | Input / State | Expected Output / Behavior | Error Handling |
|----------|--------------|---------------------------|----------------|
| 账户删除 — 正常流程 | 已登录用户，输入"确认删除" | profile 删除 → auth 用户删除 → signOut → 跳转登录页 | 任一失败则停止并显示错误 |
| 账户删除 — 未登录 | 未登录状态调用删除 API | API 返回 401，客户端显示"请先登录" | 客户端拦截 |
| 账户删除 — 网络错误 | API Route 无法连接 Supabase | 返回 500，客户端显示"删除失败" | profile 已删除但 auth 未清理，日志警告 |
| 反复登录/登出 | 多次切换用户 | 无残留监听器，内存稳定 | — |
| 实时事件 — 未知状态 | DB 状态值不在 TS 枚举中 | fallback 到 `pending`，不 crash | console.warn 记录 |
| 离线 → 上线 | 保存了离线日记后网络恢复 | pendingMessage 清除，后台自动同步 | 同步失败则保持 pending |

</frozen-after-approval>

## Code Map

- `src/app/api/account/delete/route.ts` -- 新建，API Route 使用 service role key 删除 auth 用户
- `src/lib/account.ts` -- 修改，调用 `/api/account/delete` 端点
- `src/lib/sync-manager.ts` -- 修改，移除重复的 online/offline 监听器
- `src/store/auth.ts` -- 修改，添加 auth state change subscription 清理
- `src/lib/realtime.ts` -- 修改，简化 statusMap 为透传 + 类型守卫
- `src/store/journal.ts` -- 修改，pendingMessage 在线提示优化
- `supabase/migrations/007_add_journals_updated_at_index.sql` -- 新建，添加 updated_at 索引
- `.env.local` -- 修改，添加 SUPABASE_SERVICE_ROLE_KEY

## Tasks & Acceptance

**Execution:**
- [x] `supabase/migrations/007_add_journals_updated_at_index.sql` -- 新建迁移文件添加 `(user_id, updated_at DESC)` 索引 -- 提升 last-write-wins 查询性能
- [x] `src/lib/sync-manager.ts` -- 移除 online/offline 监听器，保留 `syncPending()` 和 `getSyncingStatus()` 纯函数 -- 消除与 journal store 的重复监听
- [x] `src/store/auth.ts` -- 保存 `onAuthStateChange` 返回值，添加 unsubscribe 调用 -- 修复 auth 监听器泄漏
- [x] `src/store/journal.ts` -- 调整 `initOfflineSync` 清理 `pendingMessage` 时显示短暂同步成功提示 -- 改善离线反馈
- [x] `src/lib/realtime.ts` -- 移除 `statusMap`，使用类型守卫直接透传 -- 消除不必要的映射层
- [x] `src/app/api/account/delete/route.ts` -- 新建 API Route，验证 session 后用 service role key 删除 auth 用户 -- 实现完整的账户删除
- [x] `src/lib/account.ts` -- 在 `deleteAccount()` 中调用 `/api/account/delete` 端点 -- 端到端账户删除
- [x] `.env.local` -- 添加 `SUPABASE_SERVICE_ROLE_KEY` 环境变量 -- 服务端认证

**Acceptance Criteria:**
- Given 用户已登录且确认删除，When 点击确认删除，Then profile + auth.users 均被删除，用户跳转登录页
- Given 反复登录/登出 5 次，When 检查内存使用，Then 无持续增长（无泄漏监听器）
- Given 迁移已执行，When 查询 pg_indexes，Then 存在 idx_journals_user_updated 索引
- Given realtime 事件到达，When 映射 payload，Then status 值正确且为 TS 类型中的值
- Given 离线保存日记后网络恢复，When 等待同步完成，Then pendingMessage 自动清除

## Verification

**Commands:**
- `npx tsc --noEmit` -- expected: 0 errors
- `cd xiaozhi-journal && npx next lint` -- expected: no errors
- `cd xiaozhi-journal && npx next build` -- expected: build succeeds

**Manual checks (if no CLI):**
- 检查 `sync-manager.ts` 中无 `addEventListener` 调用
- 检查 `auth.ts` 中 `onAuthStateChange` 返回值被保存和清理
- 检查 `api/account/delete/route.ts` 中有 session 验证
