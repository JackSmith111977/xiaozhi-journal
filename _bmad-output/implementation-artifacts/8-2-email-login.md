Status: review

# Story 8.2: 邮箱登录 + Session 管理

## Story

As a 已注册用户,
I want 通过邮箱和密码登录,
So that 我能访问自己的日记数据。

## Acceptance Criteria

1. **Given** 用户在登录页 (`/auth/login`) 切换到登录 Tab
   **When** 用户输入已注册的邮箱和密码
   **Then** 调用 `supabase.auth.signInWithPassword({ email, password })`
   **And** 成功后跳转到首页（`/`）
   **And** Zustand store 更新用户上下文

2. **Given** 登录成功
   **When** 页面刷新
   **Then** 用户 Session 保持登录状态（Supabase 自动管理 token 刷新）
   **And** 不需要重新登录

3. **Given** 密码错误
   **When** 登录请求返回认证失败
   **Then** 显示中文提示："邮箱或密码不正确"
   **And** 不清空邮箱输入框

4. **Given** 用户未注册直接登录
   **When** 使用该邮箱登录
   **Then** 显示通用错误提示："邮箱或密码不正确"（安全最佳实践，防止邮箱枚举）
   **And** 用户可切换到注册 Tab 进行注册

## Tasks / Subtasks

- [x] Task 1: 增强登录逻辑 (AC: #1, #3, #4)
  - [x] 在 `src/lib/auth.ts` 中完善 `signIn` 函数，区分"账号不存在"和"密码错误"
  - [x] 登录成功后将用户信息写入 Zustand store
  - [x] 登录失败时保留邮箱输入框内容
  - [x] **[Code Review P0 Fix]** 移除 `isEmailRegistered()` 函数 — 该函数通过 `signUp` 试探邮箱存在性，会创建虚假账号且增加 API 调用。改为登录失败统一显示"邮箱或密码不正确"，符合安全最佳实践（防止邮箱枚举攻击）

- [x] Task 2: 创建用户状态 Store (AC: #2)
  - [x] 创建 `src/store/auth.ts`（认证状态管理）
  - [x] 监听 Supabase auth state change 自动同步登录状态
  - [x] 提供 `user`, `loading`, `isAuthenticated` 状态

- [x] Task 3: 路由鉴权保护 (AC: #2)
  - [x] 创建 `src/components/auth-guard.tsx`（路由守卫组件）
  - [x] 未登录用户访问首页时自动跳转到 `/auth/login`
  - [x] 已登录用户访问 `/auth/login` 时自动跳转到 `/`

## Dev Notes

### 前置 Story 依赖

- **Story 8.1**（已完成）：`src/lib/auth.ts` 已有 `signIn` 基础实现，`src/app/auth/login/page.tsx` 已有登录 Tab UI
- **Story 1.1**（已完成）：`src/lib/supabase.ts` Supabase 客户端单例

### 当前代码库状态

通过 Story 8.1 的代码扫描：

1. **`src/lib/auth.ts`** 已有 `signIn` 基础实现：
   ```typescript
   export async function signIn(email: string, password: string) {
     const { data, error } = await supabase.auth.signInWithPassword({
       email, password,
     })
     if (error) throw error
     return data
   }
   ```

2. **`src/app/auth/login/page.tsx`** 已有登录 Tab：
   - 登录模式调用 `signIn(email, password)`
   - 错误处理已区分注册/登录错误
   - 登录成功后 `router.push('/')`

3. **潜在问题**：
   - `signIn` 直接 throw Supabase 原始 error，没有区分"账号不存在" vs "密码错误"
   - 没有 Zustand store 管理用户认证状态
   - 没有路由守卫，未登录用户也能访问首页（看到种子数据）

### Supabase Auth Session 机制

Supabase JS SDK 自动管理 session：
- 登录成功后 token 存储在 localStorage（默认）
- Token 过期前自动刷新
- 页面刷新后自动恢复 session
- 通过 `supabase.auth.onAuthStateChange` 监听状态变化

### 架构约束

- **Supabase Auth**：使用 `supabase.auth.signInWithPassword`，不需要自定义后端
- **Zustand store**：新增 `src/store/auth.ts`，与现有 `src/store/journal.ts` 独立
- **文件命名**：组件 kebab-case，lib/store camelCase
- **导入别名**：`@/*` 映射到 `./src/*`

### 技术规格

- **signIn 错误区分**：
  ```typescript
  // Supabase 返回的错误消息：
  // "Invalid login credentials" — 密码错误或账号不存在
  // 需要调用 supabase.auth.getUser 或检查用户是否存在来区分
  ```

- **Auth Store 模式**：
  ```typescript
  // 监听 Supabase auth state
  supabase.auth.onAuthStateChange((event, session) => {
    // event: 'SIGNED_IN' | 'SIGNED_OUT' | 'TOKEN_REFRESHED' | 'USER_UPDATED'
    // 同步到 Zustand store
  })
  ```

- **路由守卫**：
  - 使用 React 组件模式（非 Next.js middleware），因为 Auth 状态在客户端
  - 未登录 → 跳转 `/auth/login`
  - 已登录 → 允许访问

### UX 规范

- **UX-DR16 反馈模式**：成功柔绿 `#A8C5A0`，错误暖珊瑚 `#D4856A`
- **UX-DR22 登录/注册页**：邮箱输入 + 密码输入 + 忘记密码链接
- **按钮层级**：Primary（暖珊瑚实心 `#E8C4A0`）用于登录

### 注意事项

1. **Supabase email confirm**：如果 Story 8.1 中 Supabase 开启了邮箱确认，新注册用户可能无法立即登录。需要在 Supabase Dashboard 关闭 email confirmations 或在代码中处理未确认状态。

2. **Session 持久化**：Supabase 默认使用 localStorage 存储 session，页面刷新后自动恢复。不需要额外实现。

3. **路由守卫位置**：因为是 Client-side Auth，路由守卫应该在 Client Component 中实现（非 Next.js middleware）。首页 `/` 需要包装 auth-guard。

### 测试标准

- 本项目不写单元测试，手动验证
- 验证点：
  1. 登录 Tab 输入正确邮箱密码后点击登录，跳转到首页
  2. 密码错误时显示"邮箱或密码不正确"
  3. 未注册账号登录显示"没有找到这个邮箱对应的账号"
  4. 刷新页面后保持登录状态
  5. 未登录状态访问首页自动跳转登录页
  6. 已登录状态访问登录页自动跳转首页
  7. `npm run dev` 启动无报错
  8. TypeScript 编译通过（`tsc --noEmit` 无报错）

### File List (预期)

- `src/lib/auth.ts` — 修改：增强 signIn 错误处理
- `src/store/auth.ts` — 新增：认证状态管理
- `src/components/auth-guard.tsx` — 新增：路由守卫组件
- `src/app/page.tsx` — 修改：包装 auth-guard
- `src/app/auth/login/page.tsx` — 可能修改：增强登录错误提示

### References

- [Source: epics.md#Epic 8 → Story 8.2]
- [Source: architecture.md#Authentication & Security]
- [Source: architecture.md#State Management Patterns]
- [Source: ux-design-specification.md#UX-DR16, UX-DR22]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

- `src/store/auth.ts` — 新增 Zustand auth store，监听 `supabase.auth.onAuthStateChange`，提供 `user`/`loading`/`isAuthenticated` 状态
- `src/lib/auth.ts` — 移除 `isEmailRegistered()`（code review P0 修复），`signIn` 保持简洁直接 throw 原始 error
- `src/components/auth-guard.tsx` — 新增路由守卫组件，支持 `requireAuth` 模式（保护页面/重定向已登录用户）
- `src/app/page.tsx` — 包装 `AuthGuard`，未登录自动跳转 `/auth/login`
- `src/app/auth/login/page.tsx` — 包装 `AuthGuard requireAuth={false}`，已登录自动跳转首页；错误处理简化为统一提示
- `tsc --noEmit` 编译通过

### File List

- `src/store/auth.ts` — 新增：认证状态管理 store
- `src/lib/auth.ts` — 保持简洁：signIn 直接 throw Supabase error
- `src/components/auth-guard.tsx` — 新增：路由守卫组件
- `src/app/page.tsx` — 修改：包装 auth-guard
- `src/app/auth/login/page.tsx` — 修改：增强登录错误提示 + 路由守卫

## Change Log

Story 8.2 实现邮箱登录 + Session 管理 + 路由鉴权。Auth store 监听 Supabase session 变化，首页和登录页双向路由守卫。Code review P0 修复：移除 `isEmailRegistered()` 函数，改用安全方式处理登录错误（不区分账号不存在/密码错误，防止邮箱枚举攻击）。
