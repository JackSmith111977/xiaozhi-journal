# React 19 编码规范 — Xiaozhi Journal

> 适用于 Xiaozhi Journal 项目（Next.js 16.2.3 + React 19.2.4 + Zustand v5 + Supabase + framer-motion 12）。
> 所有规则使用以下术语等级：
> - **必须** — 违反将导致 bug 或安全风险，Code Review 中必须指出
> - **推荐** — 最佳实践，偏离需给出理由
> - **禁止** — 绝对不可使用的模式
> - **允许** — 可接受但不优先的做法

---

## 目录

1. [Server Components vs Client Components 边界规则](#1-server-components-vs-client-components-边界规则)
2. [新 Hooks：use()、useActionState、useOptimistic、useFormStatus](#2-新-hooks)
3. [Server Actions（use server）模式与安全](#3-server-actionsuse-server模式与安全)
4. [Suspense 与 Error Boundary 放置策略](#4-suspense-与-error-boundary-放置策略)
5. [性能优化（React Compiler、useMemo/useCallback 策略）](#5-性能优化)
6. [状态管理（Zustand v5 + React 19 集成）](#6-状态管理zustand-v5--react-19-集成)
7. [表单处理模式](#7-表单处理模式)
8. [Breaking Changes 与迁移指南](#8-breaking-changes-与迁移指南)
9. [TypeScript 集成](#9-typescript-集成)
10. [Code Review 检查清单](#10-code-review-检查清单)

---

## 1. Server Components vs Client Components 边界规则

### 1.1 默认 Server Component，明确需要交互时才加 `"use client"`

**规则：** 文件中只要有一个组件需要 `useState`、`useEffect`、`useRef`、事件处理、浏览器 API 或任何 Hook，该文件顶部必须加 `"use client"`。

Xiaozhi Journal 中所有页面页面目前都是 SPA 模式（客户端渲染），但新增功能必须遵守此规则：

```tsx
// ✅ 正确 — 需要交互的文件顶部声明
// src/components/journal-input.tsx
'use client';

import { useState, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export function JournalInput() {
  const [content, setContent] = useState('');
  // ...
}
```

```tsx
// ❌ 错误 — 用了 useState 却没有 "use client"
// 编译时报错：React 19 不允许在 Server Component 中使用 Hooks
export function MoodSelector() {
  const [selected, setSelected] = useState(null); // 崩溃
}
```

### 1.2 Server/Client 边界必须尽量靠近组件树根部

**推荐：** 将 `"use client"` 组件尽量放在组件树深处，让父级保持为 Server Component 以获取服务端数据。

```tsx
// ✅ 推荐 — 页面是 Server Component，只把需要交互的部分包裹为 Client Component
// app/settings/page.tsx
export default async function SettingsPage() {
  // Server Component：可以直接读取数据库/环境变量
  const profile = await supabase.from('profiles').select('*').single();

  return (
    <AuthGuard>
      <SettingsContent initialProfile={profile} />
    </AuthGuard>
  );
}
```

```tsx
// ❌ 错误 — 整个页面标记为 "use client"，失去 SSR 能力
'use client';
export default function SettingsPage() {
  // 客户端必须发起额外 fetch 才能获取数据
}
```

### 1.3 Props 序列化规则

**禁止：** 从 Server Component 向 Client Component 传递函数、`Date` 对象、`Map`/`Set`、Class 实例、Supabase Client 等不可序列化值。

```tsx
// ❌ 错误 — 传递了 supabase 客户端实例（包含方法）
// <SettingsContent supabase={supabase} />

// ✅ 正确 — 仅传递纯数据
// <SettingsContent profile={profile} />
```

### 1.4 项目当前架构说明

Xiaozhi Journal 当前所有页面（`page.tsx`）均使用了 `"use client"` 和 `AuthGuard`，属于客户端 SPA 模式。在引入新页面时，**必须** 评估是否真的需要整个页面为 Client Component，优先采用 Server + Client 混合架构。

---

## 2. 新 Hooks

### 2.1 `use()` — 读取 Promise 和 Context

**推荐：** 条件性地读取 Context 时使用 `use()`，替代 `useContext()`。

```tsx
import { use } from 'react';
import { ThemeContext } from '@/contexts/theme';

function ThemedButton() {
  // ✅ 可以放在条件语句中 — useContext 做不到
  const theme = use(ThemeContext);
  return <button style={{ color: theme.primary }}>提交</button>;
}
```

**禁止：** 在 `try-catch` 中调用 `use(promise)`。

```tsx
// ❌ 错误 — 会破坏 Suspense 错误处理机制
try {
  const data = use(fetchData());
} catch (e) {
  // Suspense 无法正确捕获此错误
}

// ✅ 正确 — 用 Error Boundary 包裹
<ErrorBoundary fallback={<p>加载失败</p>}>
  <Suspense fallback={<p>加载中...</p>}>
    <DataDisplay dataPromise={fetchData()} />
  </Suspense>
</ErrorBoundary>
```

### 2.2 `useActionState` — 带状态的表单操作

**推荐：** 在 Settings 页面的昵称保存、头像上传等场景中使用 `useActionState` 替代手动 `useState` + `onSubmit`。

```tsx
'use client';
import { useActionState } from 'react';

// Server Action
'use server';
export async function updateNickname(prevState: State, formData: FormData) {
  const nickname = formData.get('nickname') as string;
  try {
    const { error } = await supabase
      .from('profiles')
      .update({ nickname })
      .eq('id', userId);
    if (error) throw error;
    return { success: true, message: '已保存' };
  } catch (err) {
    return { success: false, message: err instanceof Error ? err.message : '保存失败' };
  }
}

interface State {
  success: boolean;
  message: string;
}

function NicknameForm() {
  const [state, submitAction, isPending] = useActionState(updateNickname, {
    success: false,
    message: '',
  });

  return (
    <form action={submitAction}>
      <input name="nickname" defaultValue={initialNickname} />
      <button type="submit" disabled={isPending}>
        {isPending ? '保存中...' : '保存'}
      </button>
      {state.message && (
        <p className={state.success ? 'text-[#A8C5A0]' : 'text-[#D4856A]'}>
          {state.message}
        </p>
      )}
    </form>
  );
}
```

**禁止：** `useActionState` 的 reducer 中抛出异常（应返回错误状态）。

```tsx
// ❌ 错误 — 抛出异常会取消所有排队中的 Action
async function reducer(prevState, formData) {
  const result = await api.update(formData);
  return result; // 如果 API 报错，整个队列被取消
}

// ✅ 正确 — 返回错误状态，不抛异常
async function reducer(prevState, formData) {
  try {
    const result = await api.update(formData);
    return { success: true, data: result };
  } catch (err) {
    return { success: false, error: err.message }; // 队列继续
  }
}
```

### 2.3 `useOptimistic` — 乐观更新

**推荐：** 在日记列表添加、情绪图表更新等场景中使用，提供即时 UI 反馈。

```tsx
'use client';
import { useOptimistic, startTransition } from 'react';

function JournalList({ journals, onAdd }) {
  const [optimisticJournals, addOptimistic] = useOptimistic(
    journals,
    (current, newJournal) => [{ ...newJournal, pending: true }, ...current]
  );

  async function handleAdd(content: string, mood: number) {
    const newJournal = {
      id: crypto.randomUUID(),
      content,
      mood,
      timestamp: new Date().toISOString(),
    };
    startTransition(async () => {
      addOptimistic(newJournal);     // 立刻显示
      await onAdd(newJournal);       // 后台保存
      // 保存完成后自动收敛到真实数据
    });
  }

  return optimisticJournals.map(j => (
    <JournalCard
      key={j.id}
      journal={j}
      opacity={j.pending ? 0.6 : 1}
    />
  ));
}
```

### 2.4 `useFormStatus` — 读取父表单状态

**必须：** 在表单内部创建独立子组件来调用 `useFormStatus()`，不可在渲染 form 的同一组件中调用。

```tsx
'use client';
import { useFormStatus } from 'react-dom';

// ✅ 正确 — 提取为独立子组件
function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <button type="submit" disabled={pending} className="...">
      {pending ? '处理中...' : '保存'}
    </button>
  );
}

function AuthForm() {
  return (
    <form action={submitAuth}>
      <input name="email" type="email" />
      <input name="password" type="password" />
      <SubmitButton />  {/* useFormStatus 在此子组件内调用 */}
    </form>
  );
}

// ❌ 错误 — 在渲染 form 的同一组件中调用
function AuthForm() {
  const { pending } = useFormStatus(); // pending 永远为 false！
  return (
    <form action={submitAuth}>
      <button type="submit" disabled={pending}>...</button>
    </form>
  );
}
```

---

## 3. Server Actions（`use server`）模式与安全

### 3.1 安全规则

**必须：** 所有 Server Actions 必须进行输入验证和权限检查。

```tsx
'use server';
import { revalidatePath } from 'next/cache';
import { supabase } from '@/lib/supabase';

export async function deleteJournal(id: string) {
  // 1. 验证当前用户
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('未登录');

  // 2. 验证数据归属权
  const { data: journal } = await supabase
    .from('journals')
    .select('user_id')
    .eq('id', id)
    .single();

  if (journal?.user_id !== user.id) throw new Error('无权操作');

  // 3. 执行操作
  await supabase.from('journals').delete().eq('id', id);
  revalidatePath('/history');
}
```

**禁止：** 在 Server Actions 中信任客户端传入的 `userId`、`role` 等敏感字段。

```tsx
// ❌ 错误 — 信任客户端传入的 userId
export async function updateProfile(userId: string, nickname: string) {
  await supabase.from('profiles').update({ nickname }).eq('id', userId);
}

// ✅ 正确 — 从服务端 session 获取 userId
export async function updateProfile(nickname: string) {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('未登录');
  await supabase.from('profiles').update({ nickname }).eq('id', user.id);
}
```

### 3.2 错误处理

**必须：** Server Action 必须捕获异常并返回可序列化的错误状态，禁止让异常直接冒泡到客户端。

```tsx
'use server';

export async function submitForm(prevState: State, formData: FormData) {
  try {
    // ... 业务逻辑
    return { success: true };
  } catch (err) {
    // 返回错误信息，不抛异常
    return {
      success: false,
      error: err instanceof Error ? err.message : '操作失败',
    };
  }
}
```

### 3.3 当前项目适配

Xiaozhi Journal 当前使用 `/api/journal` Route Handler 处理 AI 分析请求。未来迁移到 Server Actions 时，应保持相同的错误处理模式。

---

## 4. Suspense 与 Error Boundary 放置策略

### 4.1 Suspense 边界

**推荐：** Suspense 边界应围绕**独立的加载单元**，而非整个页面。

```tsx
// ✅ 推荐 — 针对非关键数据使用 Suspense
<Suspense fallback={<Skeleton className="h-40 w-full" />}>
  <EmotionChart journalsPromise={fetchJournals()} />
</Suspense>

// ❌ 错误 — 整个页面被 Suspense 包裹，用户体验差
<Suspense fallback={<LoadingPage />}>
  <HomePage />
</Suspense>
```

### 4.2 Error Boundary

**必须：** Error Boundary（类组件）必须包裹可能发生渲染错误的组件树，且必须提供有意义的 fallback UI。

```tsx
import { Component, type ReactNode } from 'react';

class ErrorBoundary extends Component<
  { fallback: ReactNode; children: ReactNode },
  { hasError: boolean; error: Error | null }
> {
  constructor(props: { fallback: ReactNode; children: ReactNode }) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ComponentInfo) {
    // 可选：上报到错误监控服务
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }
    return this.props.children;
  }
}

// 使用：包裹情绪图表等复杂可视化组件
<ErrorBoundary fallback={<p className="text-[#D4856A]">情绪图表加载失败</p>}>
  <EmotionChart journals={journals} />
</ErrorBoundary>
```

### 4.3 Suspense + Error Boundary 嵌套

**推荐：** Error Boundary 在外层，Suspense 在内层。

```tsx
<ErrorBoundary fallback={<ErrorCard />}>
  <Suspense fallback={<ChartSkeleton />}>
    <EmotionChart journalsPromise={dataPromise} />
  </Suspense>
</ErrorBoundary>
```

---

## 5. 性能优化

### 5.1 React Compiler

项目使用 Next.js 16.2.3，内置 React Compiler 支持。

**规则：** 启用 React Compiler 后，**不需要**再手动写 `useMemo` / `useCallback` 来优化子组件重渲染。

```tsx
// React Compiler 开启后，以下 useMemo 不再必要（但保留也不报错）
const avatarUrl = useMemo(() => {
  if (!profile?.avatar_url) return null;
  return supabase.storage.from('avatars').getPublicUrl(profile.avatar_url).data.publicUrl;
}, [profile?.avatar_url]);
```

### 5.2 何时仍需手动 useMemo/useCallback

**必须：** 以下场景仍需手动优化：

1. **传递给外部库的回调**（如 `useEffect` 依赖、事件监听器）
2. **作为 Zustand store selector 的引用**（避免 store 重渲染）
3. **高频计算**（如情绪图表数据转换）

```tsx
// ✅ 推荐 — useEffect 依赖中的回调必须用 useCallback
const saveDraft = useCallback(async (text: string) => {
  const { setMeta } = await import('@/lib/db');
  await setMeta('journal-draft', text);
}, []);

useEffect(() => {
  if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
  draftTimerRef.current = setTimeout(async () => {
    await saveDraft(content);
  }, 300);
  return () => { if (draftTimerRef.current) clearTimeout(draftTimerRef.current); };
}, [content, saveDraft]); // saveDraft 引用稳定，不会导致 effect 重复执行
```

### 5.3 动态 import 懒加载

**推荐：** 对不常用的重型库使用动态 import。

```tsx
// ✅ JournalInput 中的 db 操作使用动态 import
const saveDraft = useCallback(async (text: string) => {
  try {
    const { setMeta } = await import('@/lib/db'); // 按需加载
    await setMeta(DRAFT_KEY, text);
  } catch { /* best-effort */ }
}, []);
```

### 5.4 framer-motion 减少动画

**必须：** 尊重用户的 `prefers-reduced-motion` 设置。

```tsx
const shouldReduceMotion = useReducedMotion();

// ✅ 正确 — 当用户偏好减少动画时，禁用动画
<motion.div
  initial={shouldReduceMotion ? undefined : { opacity: 0, y: 20 }}
  animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
  exit={shouldReduceMotion ? undefined : { opacity: 0, y: 20 }}
>
```

Xiaozhi Journal 的 `MoodSelector` 和 `JournalInput` 已正确使用 `useReducedMotion()`，新增组件必须遵循。

---

## 6. 状态管理（Zustand v5 + React 19 集成）

### 6.1 Store 定义

**必须：** Store 接口必须明确 TypeScript 类型，禁止使用 `any`。

```tsx
// ✅ 正确 — 完整类型定义
interface JournalState {
  journals: Journal[];
  loading: boolean;
  error: string | null;
  selectedMood: number | null;
}

interface JournalActions {
  fetchJournals: () => Promise<void>;
  addJournal: (journal: Journal) => Promise<void>;
  setSelectedMood: (mood: number | null) => void;
}

export const useJournalStore = create<JournalState & JournalActions>((set) => ({
  // ...
}));
```

### 6.2 选择器性能

**推荐：** 只选择需要的字段，避免订阅整个 store。

```tsx
// ✅ 推荐 — 精确选择
const { selectedMood, addJournal } = useJournalStore();

// 也可以使用 shallow 比较（Zustand v5 内置）
const selectedMood = useJournalStore((state) => state.selectedMood);
```

### 6.3 服务端/客户端隔离

**禁止：** 在 Server Components 中调用 Zustand store。

```tsx
// ❌ 错误 — Server Component 无法使用 useState/create 等
async function ServerPage() {
  const journals = useJournalStore.getState().journals; // 运行时错误
}
```

### 6.4 清理与生命周期

**必须：** 在组件卸载时清理事件监听器和定时器。

```tsx
// ✅ 正确 — JournalInput 卸载时清理所有定时器
useEffect(() => {
  return () => {
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    if (successTimerRef.current) clearTimeout(successTimerRef.current);
    if (offlineTimerRef.current) clearTimeout(offlineTimerRef.current);
  };
}, [content]);
```

**必须：** 模块级事件监听必须实现幂等注册和清理（参考 `initOfflineSync` / `stopOfflineSync` 模式）。

```tsx
// ✅ 正确 — 先移除旧监听，再添加新监听（幂等）
initOfflineSync: () => {
  if (onOnlineHandler) window.removeEventListener('online', onOnlineHandler);
  if (onOfflineHandler) window.removeEventListener('offline', onOfflineHandler);
  onOnlineHandler = () => { set({ isOnline: true }); syncPending(); };
  onOfflineHandler = () => set({ isOnline: false });
  window.addEventListener('online', onOnlineHandler);
  window.addEventListener('offline', onOfflineHandler);
},
```

### 6.5 React 19 Actions 与 Zustand 集成

**推荐：** Server Action 成功后通过 Zustand 更新 UI 状态。

```tsx
// Server Action 完成后的乐观更新
const [optimisticJournals, addOptimistic] = useOptimistic(journals);

async function handleSave(formData: FormData) {
  startTransition(async () => {
    addOptimistic({ ...newJournal, pending: true });
    const result = await saveJournalAction(formData);
    // Action 完成后更新 Zustand
    useJournalStore.getState().fetchJournals();
  });
}
```

---

## 7. 表单处理模式

### 7.1 受控 vs 非受控

**推荐：** 简单表单使用非受控 + `formData.get()`，需要实时验证的表单使用受控。

```tsx
// ✅ 非受控 — 适用于 Auth 页面简单表单
<form action={submitAction}>
  <input name="email" type="email" defaultValue={user?.email} />
  <input name="nickname" defaultValue={profile?.nickname} />
  <SubmitButton />
</form>

// ✅ 受控 — 适用于需要实时验证的场景（如密码强度检查）
const [password, setPassword] = useState('');
const isPasswordValid = password.length >= 8;
```

### 7.2 表单重置

**必须：** 表单提交成功后调用 `form.reset()` 或使用 React 19 的自动重置机制。

```tsx
// React 19 的 form action 会自动重置表单
// 但需要手动重置 state 时：
function AuthForm() {
  const formRef = useRef<HTMLFormElement>(null);

  async function handleSubmit(formData: FormData) {
    try {
      await signIn(formData.get('email'), formData.get('password'));
      formRef.current?.reset(); // 手动重置
    } catch {
      // 保留用户输入
    }
  }

  return <form ref={formRef} action={handleSubmit}>...</form>;
}
```

### 7.3 当前项目适配

Xiaozhi Journal 的登录/注册页面使用 `onSubmit` + 受控组件模式。迁移到 Server Actions 后，可改为 `<form action={serverAction}>` + 非受控模式，简化状态管理。

---

## 8. Breaking Changes 与迁移指南

### 8.1 已移除的 API

| 已移除 | 替代方案 | 项目状态 |
|--------|---------|---------|
| `forwardRef` | `ref` 直接作为 prop | 当前未使用 forwardRef，无需迁移 |
| `propTypes` / `defaultProps`（函数组件） | TypeScript / 默认参数 | 已使用 TypeScript |
| `ReactDOM.render` | `createRoot` | Next.js 内部管理 |
| String Refs（`ref="name"`） | Callback refs 或 `useRef` | 已使用 `useRef` |
| `act` from `react-dom/test-utils` | `import { act } from 'react'` | 暂无测试文件 |

### 8.2 `ref` 作为 Prop

**必须：** 新组件直接使用 `ref` prop，不再使用 `forwardRef`。

```tsx
// ✅ React 19 — 直接接收 ref
function CustomInput({ ref, placeholder }: { ref: React.RefObject<HTMLInputElement>; placeholder: string }) {
  return <input ref={ref} placeholder={placeholder} />;
}

// ❌ 过时 — 不再需要 forwardRef
const CustomInput = forwardRef<HTMLInputElement, Props>((props, ref) => {
  return <input ref={ref} {...props} />;
});
```

### 8.3 Context Provider 简化

**推荐：** 使用简化语法。

```tsx
// React 19
<ThemeContext value="dark">{children}</ThemeContext>

// 旧语法（仍可用但不推荐）
<ThemeContext.Provider value="dark">{children}</ThemeContext.Provider>
```

### 8.4 Ref 回调清理

**推荐：** 在 ref 回调中返回清理函数。

```tsx
<input
  ref={(ref) => {
    if (ref) {
      // 元素创建时
      observer.observe(ref);
    }
    return () => {
      // 元素卸载时
      observer.unobserve(ref);
    };
  }}
/>
```

### 8.5 `useRef` 必须传参数

**必须：** TypeScript 下 `useRef` 必须传递初始值。

```ts
// ❌ 错误
const ref = useRef<HTMLInputElement>();

// ✅ 正确
const ref = useRef<HTMLInputElement>(null);
const ref = useRef<string>(undefined);
```

### 8.6 JSX 类型

**必须：** 确保 `tsconfig.json` 中 `"jsx": "react-jsx"`。

```json
{
  "compilerOptions": {
    "jsx": "react-jsx"
  }
}
```

---

## 9. TypeScript 集成

### 9.1 类型定义

**必须：** 所有 Store 状态、Props、API 响应必须有明确的 TypeScript 类型定义。

```tsx
// src/types/index.ts
export type MoodLevel = 1 | 2 | 3 | 4 | 5;

export interface Journal {
  id: string;
  content: string;
  mood: MoodLevel;
  moodEmoji: string;
  aiResponse: string | null;
  goldenQuote: string | null;
  moodLabel: string | null;
  timestamp: string;
  status: 'pending' | 'synced' | 'ai_done';
  shareCount: number;
}

export interface AIResponse {
  response: string;
  goldenQuote: string;
  moodLabel: string;
}
```

### 9.2 事件处理类型

**必须：** 事件处理函数必须使用正确的 React 事件类型。

```tsx
// ✅ 正确
const handleKeyDown = (e: React.KeyboardEvent) => {
  if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
    e.preventDefault();
    handleSave();
  }
};

const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
  const file = e.target.files?.[0];
  // ...
};
```

### 9.3 错误处理类型

**必须：** `catch` 块中的错误必须使用 `unknown` 类型并做类型守卫。

```tsx
// ✅ 正确
try {
  await signUp(email, password);
} catch (err: unknown) {
  const message = err instanceof Error ? err.message : '注册失败';
  setError(message);
}

// ❌ 错误 — 假设 err 一定有 message 属性
catch (err) {
  setError(err.message); // TypeScript 19 报错
}
```

### 9.4 泛型 Props

**推荐：** 对可复用的 UI 组件使用泛型。

```tsx
interface CardProps<T> {
  data: T;
  render: (item: T) => React.ReactNode;
}

function Card<T>({ data, render }: CardProps<T>) {
  return <div className="card">{render(data)}</div>;
}
```

---

## 10. Code Review 检查清单

在提交 Pull Request 前，逐项检查：

### Server/Client 边界
- [ ] 使用 Hooks 的文件是否包含 `"use client"` 指令？
- [ ] Server Component 是否没有使用 `useState`/`useEffect`/`useRef`？
- [ ] Server → Client 传递的 Props 是否全部可序列化？
- [ ] `"use client"` 组件是否尽量靠近组件树底部？

### 新 Hooks
- [ ] `useFormStatus()` 是否在 form 内部的**子组件**中调用？
- [ ] `useActionState` 的 reducer 是否返回错误状态而非抛出异常？
- [ ] `use()` 是否没有在 `try-catch` 中调用？
- [ ] `useOptimistic` 的 set 函数是否只在 Action 或 `startTransition` 中调用？

### Server Actions 安全
- [ ] 每个 Server Action 是否验证用户身份？
- [ ] 是否验证数据归属权？
- [ ] 是否没有信任客户端传入的敏感字段（userId、role）？
- [ ] 错误是否以可序列化状态返回而非抛出？

### Suspense & Error Boundary
- [ ] Suspense 边界是否围绕独立加载单元而非整个页面？
- [ ] Error Boundary 是否提供了有意义的 fallback UI？
- [ ] Suspense 是否在 Error Boundary 内部（而非外部）？

### 性能
- [ ] framer-motion 动画是否检查了 `useReducedMotion()`？
- [ ] `useEffect` 依赖中的回调是否使用 `useCallback`？
- [ ] 不常用的重型库是否使用动态 `import()`？
- [ ] `useMemo` 缓存是否只在真正需要时使用（非过度缓存）？

### Zustand Store
- [ ] Store 是否有完整的 TypeScript 类型定义？
- [ ] 是否在 Server Component 中调用了 Zustand store？
- [ ] 组件卸载时是否清理了事件监听器和定时器？
- [ ] 模块级事件监听是否幂等注册/清理？

### 表单
- [ ] 表单提交后是否正确重置？
- [ ] 受控组件的 `value` 和 `onChange` 是否配对？
- [ ] 验证逻辑是否在提交前执行？

### TypeScript
- [ ] `catch` 块是否使用 `unknown` 类型 + 类型守卫？
- [ ] `useRef` 是否传递了初始值？
- [ ] 所有 Props 是否有明确的接口定义？
- [ ] 是否没有使用 `any` 类型？

### Breaking Changes
- [ ] 新组件是否直接使用 `ref` prop 而非 `forwardRef`？
- [ ] Context Provider 是否优先使用简化语法 `<Context value={}>`？
- [ ] `tsconfig.json` 是否配置了 `"jsx": "react-jsx"`？
