Status: in-progress

# Story 8.4: 个人资料管理

## Story

As a 已登录用户,
I want 管理自己的昵称和头像,
So that 我能个性化自己的账号。

## Acceptance Criteria

1. **Given** 用户在设置页 (`/settings`)
   **When** 用户修改昵称（1-20 字符）
   **Then** 调用 `supabase.from('profiles').update({ nickname })` WHERE `id = auth.uid()`
   **And** 成功后显示"已保存"提示
   **And** Zustand store 同步更新用户信息

2. **Given** 用户上传头像
   **When** 选择图片文件（≤ 2MB，jpg/png）
   **Then** 调用 `supabase.storage.from('avatars').upload(userId, file)`
   **And** 更新 `profiles.avatar_url` 为存储路径
   **And** 头像图片显示在设置页

3. **Given** 资料修改失败（网络断开等）
   **When** Supabase 请求失败
   **Then** 显示中文错误提示："保存失败，请稍后重试"
   **And** 输入框内容回退到修改前的值

## Tasks / Subtasks

- [x] Task 1: 设置页 UI (AC: #1)
  - [x] 创建 `src/app/settings/page.tsx`
  - [x] 显示当前用户邮箱、昵称（如有）
  - [x] 昵称编辑输入框（1-20 字符限制）
  - [x] 保存按钮 + 成功/失败提示

- [x] Task 2: 头像上传 (AC: #2)
  - [x] 头像上传按钮（点击选择文件）
  - [x] 文件大小校验（≤ 2MB）
  - [x] 上传到 Supabase Storage + 更新 profiles.avatar_url
  - [x] 头像预览显示

- [x] Task 3: 退出登录 (AC: #3 扩展)
  - [x] 设置页增加"退出登录"按钮
  - [x] 调用 `signOut()` 后清空 Zustand store + 跳转登录页

## Dev Notes

### 前置 Story 依赖

- **Story 8.1**（已完成）：`src/lib/auth.ts` 有 `signOut`、`getCurrentUser`
- **Story 8.2**（已完成）：`src/store/auth.ts` 认证状态管理，`AuthGuard` 路由守卫
- **Story 9.1**（未完成）：profiles 表尚未创建 — 本 Story 需要 profiles 表存在 + avatars storage bucket

### 当前代码库状态

1. **`src/lib/auth.ts`** 已有 `signOut()`、`getCurrentUser()`
2. **`src/store/auth.ts`** 已有 `user` 状态和 `onAuthStateChange` 监听
3. **`src/components/auth-guard.tsx`** 已有路由守卫

### 架构约束

- **文件命名**：页面文件使用 App Router 惯例（`page.tsx`）
- **导入别名**：`@/*` 映射到 `./src/*`
- **UX-DR16 反馈模式**：成功柔绿 `#A8C5A0`，错误暖珊瑚 `#D4856A`

### 注意事项

1. **profiles 表依赖**：Story 9.1 未执行，profiles 表可能不存在。设置页读取 profile 时应 graceful fallback（表不存在时显示邮箱作为昵称）。
2. **Supabase Storage bucket**：avatars bucket 可能需要手动创建或在代码中自动创建（需要 admin 权限）。

### 测试标准

- 本项目不写单元测试，手动验证
- 验证点：
  1. 设置页显示当前用户信息
  2. 昵称修改保存成功
  3. 头像上传成功并显示
  4. 退出登录成功跳转登录页
  5. `npm run dev` 启动无报错
  6. TypeScript 编译通过（`tsc --noEmit` 无报错）

### File List (预期)

- `src/app/settings/page.tsx` — 新增：设置页
- `src/lib/auth.ts` — 可能修改：增加 profile 相关函数

### References

- [Source: epics.md#Epic 8 → Story 8.4]
- [Source: architecture.md#Authentication & Security]
- [Source: ux-design-specification.md#UX-DR16, UX-DR21]

## Dev Agent Record

### Agent Model Used

qwen3.6-plus

### Debug Log References

### Completion Notes List

- `src/app/settings/page.tsx` — 新增：设置页，含昵称编辑、头像上传、退出登录
- `tsc --noEmit` 编译通过
- profiles 表不存在时 graceful fallback 显示邮箱作为昵称
- 头像上传：自动创建 avatars/{userId}/avatar.jpg|png 路径，upsert 覆盖旧头像

### File List

- `src/app/settings/page.tsx` — 新增：设置页

## Change Log

Story 8.4 实现个人资料管理：昵称编辑、头像上传、退出登录。profiles 表不存在时 graceful fallback 显示邮箱。
