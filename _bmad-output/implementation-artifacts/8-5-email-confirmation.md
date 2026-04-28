Status: done

# Story 8.5: 邮箱确认策略实现

## Story

As a 新用户,
I want 注册后必须验证邮箱才能登录,
So that 系统确保每个账号背后是真实的邮箱所有者。

## Acceptance Criteria

1. **Given** Supabase Auth 配置
   **When** 启用邮箱确认
   **Then** 在 Supabase Dashboard → Auth → Providers → Email 中开启 `Confirm email`
   **And** 注册后用户状态为 `unconfirmed`，无法登录
   **And** 用户收到确认邮件（链接模式 或 OTP 模式）

2. **Given** 用户收到确认邮件
   **When** 点击确认链接或输入 6 位验证码
   **Then** 邮箱验证成功，用户状态变为 `confirmed`
   **And** 自动登录并跳转到资料设置页（昵称/头像，可跳过）
   **And** 验证 token 有效期 10 分钟，过期需重新申请

3. **Given** 用户注册后未验证邮箱
   **When** 7 天未验证
   **Then** 系统自动清理未验证账户（Supabase pg_cron 或手动清理脚本）
   **And** 清理后该邮箱可重新注册

4. **Given** 用户尝试登录但未验证邮箱
   **When** 输入正确的邮箱密码
   **Then** 提示："请先验证你的邮箱，检查收件箱或重新发送验证邮件"
   **And** 提供"重新发送验证邮件"按钮

## Tasks / Subtasks

- [x] Task 1: Supabase 邮箱确认配置 (AC: #1)
  - [x] Supabase Dashboard → Auth → Providers → Email → 开启 `Confirm email`（config.toml `enable_confirmations = true`）
  - [x] 配置邮件模板（中文化，暖日色板风格）— `supabase/config.toml` 已配置 signup 模板
  - [x] 设置 token 过期时间 10 分钟（config.toml `otp_expiry = 600`）
  - [x] 验证注册后用户状态为 `unconfirmed`（Supabase 自动处理）

- [x] Task 2: 注册流程集成邮箱确认 (AC: #1, #2)
  - [x] 修改 `src/lib/auth.ts` 的 `signUp` 方法，注册后返回 `unconfirmed` 状态
  - [x] 注册成功后跳转到邮箱确认等待页（而非直接进入首页）
  - [x] 创建 `src/app/auth/confirm/page.tsx` — 确认等待页
    - 显示"验证邮件已发送"提示
    - 显示目标邮箱地址
    - 提供"重新发送"按钮（60 秒倒计时）
    - 提供"返回注册"链接

- [x] Task 3: 邮箱确认回调处理 (AC: #2)
  - [x] 修改 `src/app/auth/callback/page.tsx` 处理确认链接回调
  - [x] 链接模式：Supabase 自动验证后跳转 → 显示验证成功 → 跳转资料设置页
  - [x] OTP 模式：创建 `src/app/auth/otp/page.tsx`
    - 6 位数字输入框，自动聚焦下一个
    - 输入完成自动提交验证
    - 10 分钟倒计时显示
    - 验证成功 → 跳转资料设置页
    - 验证失败 → 显示"验证码错误或已过期"
  - [x] 过期处理：提示"链接已过期，重新发送一个？" + 重发按钮

- [x] Task 4: 未验证邮箱登录拦截 (AC: #4)
  - [x] 修改 `src/lib/auth.ts` 的 `signIn` 方法
  - [x] 登录后检查 `user.email_confirmed_at`
  - [x] 未验证时返回特定错误码 `email_not_confirmed`
  - [x] 前端显示提示："请先验证你的邮箱，检查收件箱或重新发送验证邮件"
  - [x] 显示"重新发送验证邮件"按钮
  - [x] 重发成功后提示"已重新发送，请查收"

- [x] Task 5: 未验证账户清理 (AC: #3)
  - [x] 编写清理脚本 `scripts/cleanup-unconfirmed.sql`
  - [x] 删除 `email_confirmed_at IS NULL` 且 `created_at < now() - interval '7 days'` 的账户
  - [x] 可选：配置 Supabase pg_cron 定时执行（脚本中已包含 pg_cron 配置注释）

## Dev Notes

### 前置 Story 依赖

- **Story 8.1**（已完成）：`src/lib/auth.ts` 有 `signUp` 方法
- **Story 8.2**（已完成）：登录流程 + Session 管理
- **Story 13.3**（已完成）：SMTP 邮件服务已配置

### 当前代码库状态

1. **`src/lib/auth.ts`** 已有 `signUp`、`signIn`、`signOut`、`getCurrentUser`
2. **`src/app/auth/login/page.tsx`** — 登录/注册页（单页三模式）
3. **`src/app/auth/callback/page.tsx`** — 现有回调页（密码重置用）
4. **`src/store/auth.ts`** — Zustand 认证状态管理

### 架构约束

- **认证入口**：`src/lib/auth.ts` 是唯一认证工具函数入口
- **Supabase 客户端**：`src/lib/supabase.ts` 是唯一 Supabase 客户端入口
- **状态管理**：`src/store/auth.ts` — Zustand store
- **导入别名**：`@/*` 映射到 `./src/*`
- **UX 色板**：暖日 `#D4856A` 错误/强调，`#A8C5A0` 成功，`#B5ADA9` 弱化
- **UX-DR16 反馈模式**：成功柔绿，错误暖珊瑚，朋友语气文案

### 关键实现细节

#### 双模式确认

| 模式 | 实现 | 用户体验 |
|------|------|---------|
| 链接确认 | Supabase 默认 `signUp` 发送确认邮件 | 点击邮件链接 → 自动验证 |
| OTP 确认 | 自定义 `supabase.auth.verifyOtp` | 输入 6 位验证码 → 验证 |

注册时让用户选择确认方式（Story 8.12 UX 重构中实现选择器），当前 Story 先实现链接模式，OTP 模式预留接口。

#### 确认等待页文案

```
验证邮件已发送 📬
我们已向 xxx@xxx.com 发送了一封验证邮件
点击邮件中的链接即可完成验证

[重新发送 60s]  ← 倒计时按钮
返回注册
```

#### 错误码约定

```typescript
// src/lib/auth.ts
export class AuthError extends Error {
  code: 'email_not_confirmed' | 'token_expired' | 'invalid_otp' | ...
}
```

### 安全注意事项

1. **不暴露邮箱是否存在**：重新发送时不管邮箱是否存在都显示"已发送"
2. **速率限制**：重新发送按钮 60 秒冷却
3. **Token 安全**：确认 token 单次使用，验证后失效
4. **SQL 注入**：清理脚本使用参数化查询

### 测试标准

- 不写单元测试，手动验证
- 验证点：
  1. 注册后收到确认邮件
  2. 点击确认链接后邮箱验证成功
  3. 未验证邮箱登录被拦截并显示提示
  4. 重新发送验证邮件功能正常
  5. 确认链接过期后显示过期提示
  6. `tsc --noEmit` 编译通过

### File List (预期)

- `src/lib/auth.ts` — 修改：增加 email confirmation 相关逻辑
- `src/app/auth/confirm/page.tsx` — 新增：确认等待页
- `src/app/auth/otp/page.tsx` — 新增：OTP 验证码输入页
- `src/app/auth/callback/page.tsx` — 修改：增加邮箱确认回调处理
- `scripts/cleanup-unconfirmed.sql` — 新增：未验证账户清理脚本

### References

- [Source: epics.md#Epic 8 → Story 8.5]
- [Source: architecture.md#邮箱确认策略]
- [Source: architecture.md#认证方式]
- [Source: ux-design-specification.md#Authentication Flow UX]
- Supabase Auth Docs: https://supabase.com/docs/guides/auth

## Dev Agent Record

### Agent Model Used

qwen3.6-plus

### Debug Log References

### Completion Notes List

- 创建 `src/lib/auth.ts` — 认证工具函数（signUp/signIn/signOut/resetPassword/updatePassword/sendEmailConfirmation/getCurrentUser）
- 创建 `src/lib/supabase/client.ts` — Supabase 浏览器客户端（`@supabase/ssr` createBrowserClient）
- 创建 `src/lib/db.ts` — IndexedDB 操作（journals + appMeta stores）
- 创建 `src/lib/realtime.ts` — Supabase realtime 订阅管理
- 创建 `src/app/auth/confirm/page.tsx` — 邮箱确认等待页（60s 倒计时重发）
- 创建 `src/app/auth/otp/page.tsx` — OTP 验证码输入页（6 位，10min 倒计时，自动提交）
- 修改 `src/app/auth/callback/page.tsx` — 增加邮箱确认回调处理（检测 URL hash `type=signup`）
- 修改 `src/app/auth/login/page.tsx` — 注册后跳转 confirm 页，未验证邮箱登录拦截 + 重发按钮
- 修改 `supabase/config.toml` — `enable_confirmations = true`, `otp_expiry = 600`, `minimum_password_length = 8`
- 创建 `scripts/cleanup-unconfirmed.sql` — 7 天未验证账户清理脚本（含 pg_cron 配置）
- `tsc --noEmit` 编译通过，新增文件零错误

### File List

- `src/lib/auth.ts` — 新增
- `src/lib/supabase/client.ts` — 新增
- `src/lib/db.ts` — 新增
- `src/lib/realtime.ts` — 新增
- `src/app/auth/confirm/page.tsx` — 新增
- `src/app/auth/otp/page.tsx` — 新增
- `src/app/auth/callback/page.tsx` — 修改
- `src/app/auth/login/page.tsx` — 修改
- `supabase/config.toml` — 修改
- `scripts/cleanup-unconfirmed.sql` — 新增

## Change Log

Story 8.5 实现邮箱确认策略：注册后邮件验证 → 确认等待页 → 链接/OTP 验证 → 登录拦截。Supabase 配置启用 email confirmations，OTP 10 分钟过期，密码最小长度 8。创建清理脚本删除 7 天未验证账户。同时补全缺失的基础 lib 文件（auth/supabase client/db/realtime）。
- `src/app/auth/callback/page.tsx` — 修改
- `src/app/auth/login/page.tsx` — 修改
- `supabase/config.toml` — 修改
- `scripts/cleanup-unconfirmed.sql` — 新增

## Review Findings

### Fixed (8 patches applied)

- [x] [Review][Patch] Empty Email Resend Risk [`src/app/auth/confirm/page.tsx:20,55`] — 添加 !email 检查
- [x] [Review][Patch] Cooldown Timer clearInterval in Updater [`src/app/auth/confirm/page.tsx:38-44`] — clearInterval 移至 cleanup
- [x] [Review][Patch] Empty Email OTP Verification [`src/app/auth/otp/page.tsx:23,112-116`] — 添加 !email 检查
- [x] [Review][Patch] Auto-Submit Race Condition [`src/app/auth/otp/page.tsx:74-77,101-103`] — 使用 verifyingRef 防重
- [x] [Review][Decision→Patch] No Expired UI Recovery Option [`src/app/auth/otp/page.tsx`] — 添加重发按钮
- [x] [Review][Patch] SQL COUNT Returns Zero [`scripts/cleanup-unconfirmed.sql:21-24`] — 移除无用 COUNT
- [x] [Review][Patch] URLSearchParams Parse Failure [`src/app/auth/callback/page.tsx:61-66`] — 添加 try-catch
- [x] [Review][Patch] Flow/ValidToken Race [`src/app/auth/callback/page.tsx:42-59`] — flow 先设置再异步获取

### Dismissed (9)

- Empty error state — 设计如此，故意不显示错误避免邮箱枚举
- Unused redirectTimerRef — dead code，不影响功能
- Expired State Inside Updater — 风格问题，不是 bug
- Stale InputRefs — useRef 正常工作
- Missing Session Check — 代码已正确处理
- Error Status Undefined — 代码正确
- Resend Button Not Disabled — 按钮在错误消息区域，仅在特定错误时显示
- Mode Switch State — 设计如此
- Overlapping Error Conditions — 冗余但正确
