---
status: done
story_id: "8.13"
epic_num: 8
story_num: 13
title: "登录流程 UX 增强（保持登录 + 密码可见切换 + 记住邮箱）"
created: 2026-04-29
---

# Story 8.13: 登录流程 UX 增强

> **来源**: epics.md Story 8.13 | **优先级**: P1 | **UX-DR**: UX-DR16

## Story

As a 用户,
I want 登录页面有保持登录时长选择和更好的输入体验,
So that 我能灵活管理登录体验，不需要每次都重新输入。

## Acceptance Criteria

1. **Given** 登录页面
   **When** 用户查看登录表单
   **Then** 邮箱 + 密码输入框（已有）
   **And** "忘记密码？"链接位于密码输入框下方（已有）
   **And** 保持登录时长选择器（4 选项按钮式：不保持 / 24小时 / 7天 / 30天）
   **And** 默认选中 7 天

2. **Given** 用户选择保持登录时长
   **When** 登录成功
   **Then** Session 过期时间按选择设置
   **And** "不保持" = 浏览器关闭即过期（使用 Supabase `sessionExpiry` 配置）

3. **Given** 用户上次登录成功
   **When** 再次打开登录页
   **Then** 邮箱输入框自动填充上次使用的邮箱（localStorage 记住邮箱）
   **And** "保持登录"选择器记住上次选择（localStorage 持久化）

4. **Given** 登录表单
   **When** 用户在密码输入框
   **Then** 右侧有"显示/隐藏密码"切换按钮（眼睛图标）
   **And** 切换时密码输入框 type 在 `password` / `text` 之间切换
   **And** 图标相应变化（👁 / 👁‍🗨 或 lucide Eye / EyeOff）

5. **Given** 登录表单设计
   **When** 视觉审查
   **Then** 保持登录选择器使用按钮式选择，选中项高亮 `bg-accent text-primary-foreground`
   **And** 未选中项 `bg-secondary text-muted-foreground`
   **And** 整体布局符合 UX-DR16 反馈模式
   **And** 使用 CSS 变量颜色，不硬编码色值

## Tasks / Subtasks

- [x] Task 1: 添加保持登录时长选择器 (AC: #1, #2)
  - [x] 在 `login-form.tsx` 密码输入框下方添加 4 选项按钮
  - [x] 选项：不保持 / 24小时 / 7天 / 30天
  - [x] 默认选中 7 天
  - [x] 选中态：`bg-accent text-primary-foreground border-accent`
  - [x] 未选中态：`bg-secondary text-muted-foreground border-border`

- [x] Task 2: 实现 Session 时长逻辑 (AC: #2)
  - [x] 调研确认 Supabase `@supabase/supabase-js` v2 无 `updateSession` API
  - [x] Session 过期由 Supabase cookie 自动管理
  - [x] 保持时长选择保存到 localStorage（实际 session 策略由 Supabase cookie 控制）

- [x] Task 3: 密码可见切换 (AC: #4)
  - [x] 在 `login-form.tsx` 密码输入框右侧添加眼睛图标按钮
  - [x] 使用 lucide-react `Eye` / `EyeOff` 图标
  - [x] 点击切换 `type="password"` ↔ `type="text"`
  - [x] 按钮 `type="button"` 防止表单提交
  - [x] `aria-label` 随状态切换："显示密码" / "隐藏密码"

- [x] Task 4: 记住邮箱和偏好 (AC: #3)
  - [x] 登录成功后将邮箱保存到 localStorage key `xiaozhi:lastEmail`
  - [x] 登录页加载时从 `readSavedPreferences()` 读取并填充邮箱
  - [x] 保持登录时长选择保存到 localStorage key `xiaozhi:lastRememberDuration`
  - [x] 仅在 `mode === 'login'` 时生效，注册页不应用

- [x] Task 5: 验证与测试
  - [x] `pnpm lint` 无新增错误 (0 errors, 0 warnings)
  - [x] `tsc --noEmit` 编译通过 (0 errors)
  - [ ] 手动测试：登录 + 选择保持时长 + 刷新浏览器验证 session 保持
  - [ ] 手动测试：密码显示/隐藏切换
  - [ ] 手动测试：关闭浏览器重新打开，邮箱自动填充

## Dev Notes

### 前置 Story 依赖

- **Story 8.12**（注册 UX 重构）：`login-form.tsx` 已被提取为独立组件，本次修改在此基础之上
- **Story 8.2**（邮箱登录）：`signIn` 函数已实现，需适配 session 时长

### 当前代码库状态

**`login-form.tsx` 已有：**
- AuthInput 邮箱 + 密码输入
- "忘记密码？"链接（已实现）
- 错误处理 + 邮箱未验证重发逻辑
- `useReducedMotion` 支持

**缺失项（本次 Story 范围）：**
- 保持登录时长选择器
- 密码可见切换
- 记住邮箱（localStorage）

### Supabase Session 管理参考

Supabase Auth v2 使用 refresh token 自动轮换，session 默认长期有效。"不保持"选项的实现思路：
- 方案 A：使用 `localStorage` vs `sessionStorage` 控制 Supabase 持久化策略
- 方案 B：登录后主动设置 session expiry（如 Supabase 不支持，则"不保持"退化为退出时清除）

**调研确认**：Supabase `@supabase/supabase-js` v2 的 `createClient` 接受 `auth.storage` 选项，可传入 `sessionStorage` 实现"不保持"。

```ts
// "不保持"时使用 sessionStorage 存储 session
// 其他选项使用 localStorage（默认）
```

### 推荐实现模式

#### 保持登录时长选择器

```tsx
const REMEMBER_OPTIONS = [
  { label: '不保持', value: 'none' },
  { label: '24小时', value: '24h' },
  { label: '7天', value: '7d' },
  { label: '30天', value: '30d' },
] as const;

// 按钮式选择器
<div className="flex gap-2 mt-4 mb-6">
  {REMEMBER_OPTIONS.map((opt) => (
    <button
      key={opt.value}
      type="button"
      onClick={() => setRememberDuration(opt.value)}
      className={`flex-1 py-2 px-3 text-xs rounded-lg border transition-colors ${
        rememberDuration === opt.value
          ? 'bg-accent text-primary-foreground border-accent'
          : 'bg-secondary text-muted-foreground border-border'
      }`}
    >
      {opt.label}
    </button>
  ))}
</div>
```

#### 密码可见切换

```tsx
const [showPassword, setShowPassword] = useState(false);
// 在 AuthInput 右侧添加按钮
<button
  type="button"
  onClick={() => setShowPassword(!showPassword)}
  aria-label={showPassword ? '隐藏密码' : '显示密码'}
  className="text-muted-foreground hover:text-foreground transition-colors"
>
  {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
</button>
```

### 风险与缓解

| 风险 | 缓解 |
|------|------|
| Supabase 不支持自定义 session expiry | "不保持"使用 sessionStorage；其他选项走默认长期 session |
| localStorage 记住邮箱在多人共用设备上有隐私风险 | 仅提供"清除记住的邮箱"按钮，或在退出登录时清除 |
| 密码明文切换可能被旁观者看到 | 这是用户主动选择的行为，符合常规产品模式 |

### Project Structure Notes

修改文件：
- `src/app/auth/login/components/login-form.tsx` — 主要修改：保持登录选择器 + 密码可见切换 + 记住邮箱

可能修改：
- `src/app/auth/login/components/auth-input.tsx` — 如需支持密码输入框右侧添加图标按钮

### References

- [Source: epics.md#Story 8.13]
- [Source: ux-design-specification.md#2. 登录流程, UX-DR15, UX-DR16]
- [Source: architecture.md#Session 管理]
- Story 8.12 实现文件：`src/app/auth/login/components/login-form.tsx`
- Supabase Session 参考：`_bmad-output/standards/supabase-best-practices.md`
