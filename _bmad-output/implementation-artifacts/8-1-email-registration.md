Status: review

# Story 8.1: 邮箱注册 + 年龄确认

## Story

As a 新用户,
I want 通过邮箱注册账号并确认年龄,
So that 我能开始使用 Xiaozhi Journal 记录心情。

## Acceptance Criteria

1. **Given** 用户打开注册页 (`/auth/login`)
   **When** 用户输入邮箱和密码（密码 ≥ 8 字符）
   **Then** 调用 `supabase.auth.signUp({ email, password })`
   **And** 注册前检查年龄确认复选框（"我已年满 18 岁"，符合 NFR23）
   **And** 未勾选年龄确认时注册按钮 disabled

2. **Given** 注册成功
   **When** Supabase 返回用户信息
   **Then** 自动在 `profiles` 表插入记录（id = auth.uid(), email, nickname = 邮箱前缀）
   **And** 跳转到首页（`/`）
   **And** 显示成功提示（符合 UX-DR16 反馈模式）

3. **Given** 邮箱已被注册
   **When** 注册请求返回冲突
   **Then** 显示中文提示："这个邮箱已经被注册了，试试登录？"
   **And** 提供"去登录"链接

4. **Given** 密码格式不正确（< 8 字符）
   **When** 用户尝试提交
   **Then** 输入框下方显示红色错误提示（符合 UX-DR16）
   **And** 不发起注册请求

## Tasks / Subtasks

- [x] Task 1: 创建注册页面 UI (AC: #1, #4)
  - [x] 创建 `src/app/auth/login/page.tsx`（注册/登录共用页，本 Story 先做注册）
  - [x] 邮箱输入框：type="email"，placeholder="请输入邮箱"
  - [x] 密码输入框：type="password"，placeholder="请输入密码（至少 8 位）"
  - [x] 年龄确认复选框："我已年满 18 岁"
  - [x] 注册按钮：disabled 当邮箱为空 或 密码 < 8 字符 或 年龄未确认
  - [x] 密码错误提示：红色文字，输入框下方显示
  - [x] "忘记密码"链接（占位，Story 8.3 实现）
  - [x] "已有账号？去登录"链接（切换到登录模式，Story 8.2 实现）

- [x] Task 2: 实现注册逻辑 (AC: #2, #3)
  - [x] 创建 `src/lib/auth.ts`（认证工具函数）
  - [x] `signUp(email, password)` 函数：调用 `supabase.auth.signUp`
  - [x] 注册成功后自动插入 `profiles` 表记录（nickname = 邮箱前缀）
  - [x] 处理冲突错误（邮箱已注册）
  - [x] 跳转到首页 `/`
  - [x] 显示成功/错误提示（UX-DR16 反馈模式：成功柔绿，错误暖珊瑚）

## Dev Notes

### 架构约束

- **Supabase Auth**：使用 `supabase.auth.signUp({ email, password })`，不需要自定义后端
- **profiles 表**：`id uuid PK`（= auth.uid()）, `email`, `nickname`, `avatar_url`, `created_at`
- **行级安全（RLS）**：profiles 表策略 — `CREATE POLICY "Users can only access their own profile" ON profiles FOR ALL USING (auth.uid() = id)`
- **认证状态**：注册成功后 Supabase 自动设置 session，用户处于已登录状态
- **文件命名**：页面文件使用 App Router 惯例（`page.tsx`），lib 文件 camelCase（`auth.ts`）
- **导入别名**：`@/*` 映射到 `./src/*`

### 前置 Story 依赖

- **Story 1.1**（已完成）：`src/lib/supabase.ts` Supabase 客户端单例
- **Story 9.1**（未完成）：profiles 表尚未创建 — 本 Story 需要 `profiles` 表存在

### 关键依赖问题

**profiles 表尚未创建** — Story 9.1（DB 迁移）在 backlog 中。这意味着：

1. `supabase.auth.signUp` 可以正常工作（Auth 是 Supabase 内置功能，不依赖自定义表）
2. 但自动插入 `profiles` 表的逻辑会因为表不存在而失败
3. **本 Story 的实现方案**：注册时调用 `profiles` 插入，如果表不存在则 `console.warn` 并继续，不阻塞注册流程

### 技术规格

- **注册流程**：
  ```typescript
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })
  if (error) throw error
  
  // 自动插入 profiles 记录（表不存在时静默跳过）
  if (data.user) {
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: data.user.id,
        email: data.user.email,
        nickname: data.user.email?.split('@')[0] || '用户',
      })
    
    if (profileError && profileError.code !== '42P01') { // 42P01 = undefined_table
      console.warn('[Auth] Failed to insert profile:', profileError.message)
    }
  }
  ```

- **邮箱冲突处理**：Supabase Auth 对重复邮箱返回特定错误码 `user_already_exists`（或 `Email already registered` 消息）
- **密码验证**：客户端验证密码长度 ≥ 8，Supabase 服务端也会验证
- **年龄确认**：纯 UI 层面的复选框，不存储到数据库（NFR23 只要求确认，不要求持久化）

### UX 规范

- **UX-DR16 反馈模式**：成功（柔绿 `#A8C5A0`）/ 错误（暖珊瑚 `#D4856A`）
- **UX-DR22 登录/注册页**：邮箱输入 + 密码输入 + 密码重置链接 + 年龄确认（18+）
- **按钮层级**：Primary（暖珊瑚实心 `#E8C4A0`）用于注册
- **表单模式**：无外框输入框，底部 2px 暖灰线（UX-DR17）

### 注意事项

1. **profiles 表依赖**：最佳做法是 Story 9.1 先执行 DB 迁移。但如果先做本 Story，注册功能仍可工作（Supabase Auth 独立于 profiles 表），只是 nickname 不会自动设置。后续 DB 迁移后可通过 trigger 自动创建 profile。

2. **注册/登录共用页设计**：epics.md 中提到 `/auth/login` 作为登录/注册页。建议采用模式切换（"注册" / "登录" Tab），两个 Story 共享同一个页面。

3. **Supabase email confirm**：默认情况下 Supabase 会发送确认邮件。商业版中建议关闭此功能（用户首次即可用），或在 Supabase Dashboard 中配置 "Enable email confirmations" 为 off。

### 测试标准

- 本项目不写单元测试，手动验证
- 验证点：
  1. 注册页面正常渲染，邮箱/密码输入框、年龄复选框、注册按钮可见
  2. 密码 < 8 字符时注册按钮 disabled
  3. 未勾选年龄确认时注册按钮 disabled
  4. 注册成功后跳转到首页
  5. 重复邮箱注册显示中文提示
  6. `npm run dev` 启动无报错
  7. TypeScript 编译通过（`tsc --noEmit` 无报错）

### File List (预期)

- `src/app/auth/login/page.tsx` — 注册/登录页面（本 Story 实现注册部分）
- `src/lib/auth.ts` — 认证工具函数

### References

- [Source: epics.md#Epic 8 → Story 8.1]
- [Source: architecture.md#Authentication & Security]
- [Source: architecture.md#API Patterns — /api/auth/*]
- [Source: architecture.md#Implementation Patterns — Naming]
- [Source: ux-design-specification.md#UX-DR16, UX-DR22]
- [Source: epics.md#NFR23 — 年龄确认（18+）]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

- 注册/登录共用页采用 Tab 模式切换，共享邮箱/密码输入框
- `signUp` 函数自动插入 profiles 记录，表不存在时 `console.warn` 不阻塞
- 密码 < 8 字符实时红色提示
- 年龄复选框未勾选时注册按钮 disabled
- 重复邮箱注册时检测 Supabase 错误消息并显示中文提示 + "去登录" 链接
- 登录模式调用 `signIn` 而非 `signUp`，错误消息区分注册/登录
- `tsc --noEmit` 编译通过

### File List

- `src/app/auth/login/page.tsx` — 注册/登录页面（Tab 模式）
- `src/lib/auth.ts` — 认证工具函数（signUp, signIn, signOut, getCurrentUser）

## Change Log

Story 8.1 实现邮箱注册功能，含年龄确认（18+）+ 密码验证 + profiles 自动创建。注册/登录共用页，为 Story 8.2 预留登录模式。
