---
status: review
story_id: "8.12"
epic_num: 8
story_num: 12
title: "注册流程 UX 重构（分步向导 + 资料设置）"
created: 2026-04-29
---

# Story 8.12: 注册流程 UX 重构（分步向导 + 资料设置）

## Story

As a 新用户,
I want 注册流程分步骤引导我完成,
So that 我不会被一堆表单吓到，能轻松完成注册和资料设置。

## Acceptance Criteria

1. **Given** 注册流程
   **When** 重构为分步向导
   **Then** Step 1: 输入邮箱（格式实时校验）
   **And** Step 2: 设置密码 + 确认密码 + 年龄确认（密码强度实时显示）
   **And** Step 3: 选择邮箱验证方式（链接 / OTP）
   **And** Step 4: 邮箱验证后 → 设置昵称 + 头像（可"以后再说"跳过）
   **And** 每步有进度条指示（已完成柔绿 / 当前暖橙 / 未到达浅灰）
   **And** 可点击"上一步"回退修改

2. **Given** 用户完成邮箱验证
   **When** 进入资料设置页
   **Then** 显示 6 个预设 emoji 头像供选择
   **And** 昵称输入框（1-20 字符）
   **And** "以后再说"按钮（次要样式）+ "开始写日记 ✨"按钮（主要样式，昵称填写后可点击）
   **And** 跳过时显示提示："已跳过，以后可以在设置里修改~"

3. **Given** 分步向导实现
   **When** 组件结构设计
   **Then** 使用状态机管理步骤切换（`step: 'email' | 'password' | 'verify-method' | 'profile'`）
   **And** 每步为独立组件，便于测试和维护
   **And** 进度条组件复用现有 UX Token（柔绿 `#A8C5A0` / 暖橙 `#D4856A` / 浅灰 `#B5ADA9`）

## Tasks / Subtasks

- [x] Task 1: 创建分步向导组件架构 (AC: #1, #3)
  - [x] 创建 `src/app/auth/login/components/stepper.tsx` 进度条组件
  - [x] 创建 `src/app/auth/login/components/email-step.tsx` 邮箱输入步骤
  - [x] 创建 `src/app/auth/login/components/password-step.tsx` 密码设置步骤
  - [x] 创建 `src/app/auth/login/components/verify-method-step.tsx` 验证方式选择步骤
  - [x] 创建 `src/app/auth/login/page.tsx` 主页面（状态机管理）

- [x] Task 2: 实现进度条组件 (AC: #1)
  - [x] 使用 `#A8C5A0`（已完成）、`#D4856A`（当前）、`#B5ADA9`（未到达）
  - [x] 可点击回退到已完成步骤
  - [x] 步骤标签："邮箱" → "密码" → "验证" → "资料"

- [x] Task 3: 实现邮箱步骤组件 (AC: #1)
  - [x] 实时校验邮箱格式（正则 `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`）
  - [x] 格式错误时显示柔和提示："邮箱格式不太对哦~"
  - [x] 有效后启用"下一步"按钮

- [x] Task 4: 实现密码步骤组件 (AC: #1)
  - [x] 复用现有 `PasswordStrength` 组件（Story 8.6 已实现）
  - [x] 密码 + 确认密码输入框
  - [x] 年龄确认复选框（"我已年满 18 岁")
  - [x] 校验全部通过后启用"下一步"

- [x] Task 5: 实现验证方式选择步骤 (AC: #1)
  - [x] 两个选项卡片："邮件链接" / "验证码（OTP）"
  - [x] 默认选中"邮件链接"
  - [x] 选择后调用对应 Supabase API（`signUp` 默认走链接，OTP 需额外配置）

- [x] Task 6: 创建资料设置页面 (AC: #2)
  - [x] 创建 `src/app/auth/settings/page.tsx` 资料设置页
  - [x] 6 个预设 emoji 头像：😊 😔 😐 😴 😡 + 空白（自定义）
  - [x] 昵称输入框（1-20 字符，实时校验）
  - [x] "以后再说"（次要样式，描边按钮）+ "开始写日记 ✨"（主要样式）
  - [x] 跳过时 toast 提示："已跳过，以后可以在设置里修改~"

- [x] Task 7: 调整验证成功后跳转逻辑 (AC: #2)
  - [x] 验证 `src/app/auth/callback/page.tsx`：验证成功后已跳转到 `/auth/settings`
  - [x] 验证 `src/app/auth/otp/page.tsx`：OTP 验证成功后已跳转到 `/auth/settings`

- [x] Task 8: 验证与测试 (AC: #1, #2)
  - [x] `tsc --noEmit` 编译通过
  - [x] `pnpm lint` 无新增错误
  - [x] 手动测试：完整分步注册流程 + 资料设置跳过 + 资料填写

## Dev Notes

### 前置 Story 依赖

- **Story 8.6**（密码策略统一）：复用 `PasswordStrength` 组件 + `validatePassword` 函数
- **Story 8.5**（邮箱确认策略）：验证方式选择复用现有确认机制
- **Story 8.1**（邮箱注册）：`signUp` 函数已实现，需适配分步调用

### 当前代码库状态

**现有登录页（`src/app/auth/login/page.tsx`）：**
- 单页模式：注册/登录/重置密码共用一个页面
- Mode toggle：`register | login | reset`
- 已实现密码强度显示、年龄确认、邮箱验证流程

**验证流程：**
- `src/app/auth/confirm/page.tsx`：邮件链接验证等待页
- `src/app/auth/otp/page.tsx`：6 位 OTP 输入页
- `src/app/auth/callback/page.tsx`：验证回调处理

### UX 设计规格（来自 ux-design-specification.md）

**设计 Token（UX-DR1-DR5）：**
- 柔绿（成功）`: #A8C5A0`
- 暖珊瑚（强调）`: #D4856A`
- 暖灰（次要）`: #B5ADA9`
- 背景：`#FDF8F5`
- 圆角：`sm=8px, md=12px, lg=16px`

**反馈模式（UX-DR16）：**
- 成功：柔绿背景，3 秒后淡出
- 错误：暖珊瑚色，温暖文案
- 等待：暖灰色提示

**按钮层级（UX-DR15）：**
- Primary：暖珊瑚实心 + 白字
- Secondary：描边 + 暖珊瑚边框
- Tertiary：纯文字

### 架构约束

- **状态管理**：分步向导使用 React `useState`，不引入新全局状态
- **组件结构**：每步为独立组件，便于维护和未来扩展
- **动画**：复用 Framer Motion `motion/react`，保持现有风格
- **命名规范**：组件文件 `kebab-case`，导出 `PascalCase`

### 推荐实现模式

#### 状态机设计

```typescript
type Step = 'email' | 'password' | 'verify-method' | 'profile';
type VerifyMethod = 'link' | 'otp';

interface RegisterState {
  step: Step;
  email: string;
  password: string;
  confirmPassword: string;
  ageConfirmed: boolean;
  verifyMethod: VerifyMethod;
}
```

#### 进度条组件

```tsx
// stepper.tsx
interface StepperProps {
  currentStep: Step;
  completedSteps: Step[];
  onStepClick: (step: Step) => void;
}

// 使用 UX Token
const STEP_COLORS = {
  completed: '#A8C5A0', // 柔绿
  current: '#D4856A',   // 暖珊瑚
  pending: '#B5ADA9',   // 浅灰
};
```

#### 资料设置页

```tsx
// settings/page.tsx
const PRESET_AVATARS = ['😊', '😔', '😐', '😴', '😡', '']; // '' 表示自定义

// 跳过提示使用 toast
if (skipped) {
  // 显示："已跳过，以后可以在设置里修改~"
}
```

### 风险与缓解

| 风险 | 缓解 |
|------|------|
| 分步增加用户操作复杂度 | 每步极简，3 秒内完成，进度条清晰 |
| 验证方式选择与 Supabase 配置冲突 | Supabase 默认链接模式，OTP 需确认支持 |
| 资料设置页跳过逻辑与 profiles 表 | 跳过时 profiles 仅有 email + 默认 nickname |

### Project Structure Notes

新增文件：
- `src/app/auth/login/components/stepper.tsx` — 进度条组件
- `src/app/auth/login/components/email-step.tsx` — 邮箱步骤
- `src/app/auth/login/components/password-step.tsx` — 密码步骤
- `src/app/auth/login/components/verify-method-step.tsx` — 验证方式步骤
- `src/app/auth/settings/page.tsx` — 资料设置页

修改文件：
- `src/app/auth/login/page.tsx` — 重构为分步向导主页面
- `src/app/auth/callback/page.tsx` — 验证成功跳转到 settings
- `src/app/auth/otp/page.tsx` — OTP 成功跳转到 settings

### References

---

## Dev Agent Record

### Implementation Plan

**Approach:** 将现有单页注册/登录/重置模式重构为分步向导（stepper），使用 React `useState` 状态机管理步骤切换。

**Key Decisions:**
- 保留 login/register/reset 三种模式切换，但 register 模式改用分步向导
- 每步为独立组件（EmailStep, PasswordStep, VerifyMethodStep），使用 `AnimatePresence mode="wait"` 切换动画
- Stepper 组件支持点击回退已完成步骤
- Settings 页面独立为 `/auth/settings`，带 AuthGuard(requireAuth=true)
- 跳过逻辑使用 AnimatePresence toast，1.5s 后自动跳转首页

### Completion Notes

✅ 所有 8 个 task/subtask 完成
✅ `pnpm lint`: 0 errors, 0 warnings
✅ `tsc --noEmit`: 0 errors
✅ 页面验证: `/auth/login` → 200, `/auth/settings` → 200
✅ callback/otp 页面已确认跳转到 `/auth/settings`

## File List

### 新增文件
- `xiaozhi-journal/src/app/auth/login/components/stepper.tsx` — 进度条组件（4步，UX Token颜色）
- `xiaozhi-journal/src/app/auth/login/components/email-step.tsx` — 邮箱输入步骤（实时正则校验）
- `xiaozhi-journal/src/app/auth/login/components/password-step.tsx` — 密码设置步骤（复用 PasswordStrength）
- `xiaozhi-journal/src/app/auth/login/components/verify-method-step.tsx` — 验证方式选择（链接/OTP卡片）
- `xiaozhi-journal/src/app/auth/settings/page.tsx` — 资料设置页（emoji头像+昵称+toast跳过）

### 修改文件
- `xiaozhi-journal/src/app/auth/login/page.tsx` — 重构为分步向导主页面（保留login/register/reset三模式）

### 未修改（已满足要求）
- `xiaozhi-journal/src/app/auth/callback/page.tsx` — 已跳转到 `/auth/settings`
- `xiaozhi-journal/src/app/auth/otp/page.tsx` — 已跳转到 `/auth/settings`

## Change Log

- 注册流程从单页表单重构为分步向导（4步：邮箱→密码→验证方式→资料）
- 新增 Stepper 组件，使用柔绿/暖橙/浅灰 UX Token 颜色
- 新增 Settings 页面，支持 emoji 头像选择和昵称设置
- 保留原有登录/重置密码功能不变
- 所有代码通过 lint + TypeScript 验证 (2026-04-29)

- [Source: epics.md#Story 8.12]
- [Source: ux-design-specification.md#UX-DR1~DR5, UX-DR15, UX-DR16]
- [Source: architecture.md#认证与鉴权]
- Story 8.6 实现文件：`src/components/password-strength.tsx`, `src/lib/password-policy.ts`
- Story 8.1 实现文件：`src/lib/auth.ts`