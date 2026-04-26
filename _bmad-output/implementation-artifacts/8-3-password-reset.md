Status: done

# Story 8.3: 密码重置

## Story

As a 忘记密码的用户,
I want 通过邮箱验证链接重置密码,
So that 我能重新访问自己的账号。

## Acceptance Criteria

1. **Given** 用户在登录页点击"忘记密码"
   **When** 用户输入注册邮箱并点击"发送重置链接"
   **Then** 调用 `supabase.auth.resetPasswordForEmail(email)`
   **And** 显示提示："重置链接已发送到你的邮箱，请查收"

2. **Given** 用户点击邮件中的重置链接
   **When** 跳转到重置密码页 (`/auth/callback`)
   **Then** Supabase 自动验证 token
   **And** 用户可输入新密码（≥ 8 字符）
   **And** 提交成功后跳转登录页

3. **Given** 重置链接过期或无效
   **When** 用户访问重置页面
   **Then** 显示中文提示："链接已过期，请重新申请重置"

## Tasks / Subtasks

- [x] Task 1: 重置密码请求 UI (AC: #1)
  - [x] 在 `src/app/auth/login/page.tsx` 的忘记密码链接打开重置输入模式
  - [x] 邮箱输入框 + 发送按钮
  - [x] 调用 `supabase.auth.resetPasswordForEmail(email)`
  - [x] 显示成功/错误提示

- [x] Task 2: 重置密码回调页 (AC: #2, #3)
  - [x] 创建 `src/app/auth/callback/page.tsx`
  - [x] 检测 Supabase auth token 有效性
  - [x] 新密码输入框（≥ 8 字符验证 + 确认密码）
  - [x] 提交后更新密码并跳转登录页
  - [x] 无效/过期链接显示错误提示

## Dev Notes

### 前置 Story 依赖

- **Story 8.1**（已完成）：`src/app/auth/login/page.tsx` 已有"忘记密码？"占位链接
- **Story 8.2**（已完成）：`src/lib/auth.ts` 认证工具函数，`src/store/auth.ts` 认证状态管理

### Supabase 密码重置机制

Supabase Auth 内置密码重置流程：
- `resetPasswordForEmail(email)` 发送包含 token 的邮件
- 用户点击邮件链接 → Supabase 处理 token → 重定向到 `/auth/callback`
- 在 callback 页面调用 `supabase.auth.updateUser({ password: newPassword })`
- 需要配置 `siteUrl` 和 `redirectTo` 确保回调正确

### 架构约束

- **文件命名**：页面文件使用 App Router 惯例（`page.tsx`）
- **导入别名**：`@/*` 映射到 `./src/*`
- **UX-DR16 反馈模式**：成功柔绿 `#A8C5A0`，错误暖珊瑚 `#D4856A`

### 技术规格

- **回调页路由**：`/auth/callback` — Next.js App Router 页面
- **Token 检测**：Supabase 在用户点击邮件链接时自动设置 session，在 callback 页调用 `supabase.auth.getUser()` 即可验证
- **密码更新**：`supabase.auth.updateUser({ password: newPassword })`
- **重定向配置**：需要在 Supabase Dashboard → Auth → URL Configuration 中添加 `/auth/callback` 为允许的 redirect URL

### 注意事项

1. **邮件模板**：Supabase 默认发送英文邮件。可以在 Dashboard → Auth → Email Templates 中自定义为中文。
2. **本地开发**：本地测试时邮件不会真正发送。可以在 Supabase Dashboard 查看 "Magic Link" 日志获取链接，或使用 `redirectTo` 参数指定本地 URL。

### 测试标准

- 本项目不写单元测试，手动验证
- 验证点：
  1. 忘记密码链接可点击，弹出邮箱输入界面
  2. 输入邮箱后显示"重置链接已发送"提示
  3. Callback 页面能检测有效 token
  4. 新密码 ≥ 8 字符验证
  5. 密码更新成功后跳转登录页
  6. 无效/过期链接显示友好提示
  7. `pnpm dev` 启动无报错
  8. TypeScript 编译通过（`tsc --noEmit` 无报错）

### File List (预期)

- `src/app/auth/login/page.tsx` — 修改：增加忘记密码输入模式
- `src/app/auth/callback/page.tsx` — 新增：密码重置回调页
- `src/lib/auth.ts` — 可能修改：增加 `resetPassword` / `updatePassword` 函数

### References

- [Source: epics.md#Epic 8 → Story 8.3]
- [Source: architecture.md#Authentication & Security]
- [Source: ux-design-specification.md#UX-DR16, UX-DR22]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

- `src/lib/auth.ts` — 新增 `resetPassword()` 和 `updatePassword()` 函数
- `src/app/auth/login/page.tsx` — 新增 `reset` 模式，忘记密码链接切换到邮箱输入模式，隐藏密码/年龄确认字段
- `src/app/auth/callback/page.tsx` — 新增密码重置回调页，检测 token 有效性、新密码输入（含确认）、密码 ≥ 8 验证、无效链接友好提示
- `tsc --noEmit` 编译通过

### File List

- `src/lib/auth.ts` — 修改：新增 resetPassword、updatePassword 函数
- `src/app/auth/login/page.tsx` — 修改：新增 reset 模式
- `src/app/auth/callback/page.tsx` — 新增：密码重置回调页

## Change Log

Story 8.3 实现密码重置功能。登录页新增"忘记密码"输入模式，回调页支持 token 检测、密码修改、链接过期友好提示。
