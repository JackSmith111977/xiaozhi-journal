# Epic 8 E2E Verification Report — Round 1

**Date:** 2026-04-21  
**Stories:** 8-1, 8-2, 8-3, 8-4  
**Dev Server:** http://localhost:3000  
**Browser:** Playwright Chromium

---

## Test Results Summary

| ID | Test Case | Status | Notes |
|----|-----------|--------|-------|
| 8.1-1 | 注册页面渲染：邮箱/密码输入框、年龄复选框、注册按钮可见 | **PASS** | 截图：`epic8-login-page.png` |
| 8.1-2 | 密码 < 8 字符时注册按钮 disabled + 红色提示 | **PASS** | 提示文本"密码至少需要 8 位" |
| 8.1-3 | 密码 ≥ 8 但年龄未勾选 → 按钮 disabled | **PASS** | |
| 8.1-4 | 勾选年龄 → 注册按钮 enabled | **PASS** | |
| 8.1-5 | 注册新用户 → 跳转首页 | **FAIL (P0)** | 注册成功但无法进入首页，见 P0-1 |
| 8.1-6 | `@test.com` 邮箱格式被 Supabase 拒绝 | **FAIL (P1)** | 错误消息为英文原始错误，未中文化，见 P1-1 |
| 8.2-1 | 登录 Tab 切换：密码输入框 + 登录按钮 + "忘记密码？" | **PASS** | 年龄复选框正确隐藏 |
| 8.2-2 | 错误密码登录 → "邮箱或密码不正确" | **PASS** | 邮箱输入框内容保留 |
| 8.2-3 | 未登录访问 `/settings` → 自动跳转 `/auth/login` | **PASS** | AuthGuard 工作正常 |
| 8.2-4 | 切换登录模式时保留邮箱/密码输入 | **PASS** | |
| 8.3-1 | "忘记密码？" → 进入重置密码模式 | **PASS** | 标题"重置密码"，邮箱输入框，发送按钮 |
| 8.3-2 | 发送重置链接 → 显示"重置链接已发送到你的邮箱，请查收" | **PASS** | |
| 8.3-3 | `/auth/callback` 无 token → 显示"链接已过期" | **PASS** | 截图：`epic8-callback-invalid.png` |
| 8.3-4 | 切换模式时旧错误消息未清除 | **FAIL (P2)** | 登录错误消息在重置密码模式仍显示，见 P2-1 |
| 8.4-1 | 设置页（需登录态）→ 昵称编辑、头像上传、退出登录 | **BLOCKED** | 依赖 P0-1 修复后可登录才能验证 |
| 8.4-2 | 未登录访问 `/settings` → 自动跳转登录 | **PASS** | 同 8.2-3 |

---

## Issues Found

### P0-1: 注册成功但无法进入首页

**现象：** 注册成功后显示"注册成功，欢迎加入！"，1 秒后 `router.push('/')`，但 AuthGuard 检测到 `hasUser: false`（`session: false error: none`），立即重定向回 `/auth/login`。

**根因：** Supabase 项目开启了邮箱确认（Email Confirmation）。`supabase.auth.signUp()` 不创建 session，只发送确认邮件。代码在第 64-65 行直接 `router.push('/')` 而未处理"等待邮箱确认"的情况。

**影响：** 新用户注册后无法使用应用，完全阻断注册流程。

**修复建议：**
1. **方案 A（推荐）**：在 Supabase Dashboard → Auth → Email Templates 中关闭 "Enable email confirmations"，使注册后自动建立 session。
2. **方案 B**：代码层面在 `signUp` 成功后显示"请查收确认邮件"，不跳转首页，直到用户点击邮件链接后才建立 session。

---

### P1-1: 注册错误消息未中文化

**现象：** 输入 `e2e-test-20260421@test.com` 注册，Supabase 返回英文错误 `Email address "e2e-test-20260421@test.com" is invalid`，直接透传给用户。

**根因：** `page.tsx:75` 错误处理只对"already registered"做了中文化，其他 Supabase 原始错误直接显示。

**修复建议：** 在 catch 块中增加对常见 Supabase 错误码的中文化映射，或使用更通用的兜底提示。

---

### P2-1: 切换模式时旧错误消息未清除

**现象：** 在登录模式输入错误密码后点击"忘记密码？"，切换到重置密码模式时，之前的"邮箱或密码不正确"错误消息仍显示。

**根因：** `setMode()` 只切换了模式状态，没有调用 `setError(null)`。

**修复建议：** 在 `setMode()` 时同步清除 error 和 success 状态。

---

## Console Errors

| # | Message | Severity | Notes |
|---|---------|----------|-------|
| 1 | `400 POST /auth/v1/token?grant_type=password` | Expected | 错误密码登录，正常行为 |
| 2 | `400 POST /auth/v1/signup` | Expected | 邮箱格式被 Supabase 拒绝 |
| 3 | `Input elements should have autocomplete attributes` | Info | 浏览器建议，不影响功能 |

## Next.js Errors

None (config: [], session: [])

## TypeScript Compilation

`tsc --noEmit` 之前验证通过。

---

## Screenshots

| File | Description |
|------|-------------|
| `epic8-login-page.png` | 登录页渲染正常 |
| `epic8-callback-invalid.png` | 无 token 的 callback 页面 |

---

## Conclusion

**Epic 8 未全部通过。** 关键阻塞问题 P0-1 需要优先修复（注册后无法登录）。修复后重新验证 8.1-5 和 8.4 全部用例。

### Next Steps

1. ~~**修复 P0-1**~~: DONE — `src/lib/auth.ts` signUp 成功后自动 signIn 建立 session
2. ~~**修复 P1-1**~~: DONE — `page.tsx` 增加 `is invalid` 错误中文化
3. ~~**修复 P2-1**~~: DONE — 所有 `setMode()` 调用同步清除 error/success
4. **Round 2 验证**: 等待 Supabase rate limit 解除后（约 1 小时），使用新邮箱验证注册→自动登录→首页跳转流程
