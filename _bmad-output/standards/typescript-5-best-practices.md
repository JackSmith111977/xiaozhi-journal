# TypeScript 5.x 编码规范

> 适用于 **Xiaozhi Journal** 项目：TypeScript 5.x + React 19 + Next.js 16 + Supabase + Zustand v5

---

## 1. tsconfig strict mode 设置

本项目 `tsconfig.json` 必须启用 `strict: true`。在此基础上，**推荐**逐步开启以下更严格的选项。

### 1.1 必须启用的核心选项

| 选项 | 值 | 说明 |
|------|-----|------|
| `strict` | `true` | 包含 `strictNullChecks`、`noImplicitAny`、`strictFunctionTypes` 等 |
| `noUncheckedIndexedAccess` | `true` | 索引访问返回 `T \| undefined`，防止越界假设 |
| `verbatimModuleSyntax` | `true` | 禁止非类型值的类型导入（替代 `isolatedModules` + `importsNotUsedAsValues`） |

### 1.2 推荐启用的选项

| 选项 | 值 | 说明 |
|------|-----|------|
| `exactOptionalPropertyTypes` | `true` | `{}` 缺少可选属性时不允许显式传 `undefined` |
| `noPropertyAccessFromIndexSignature` | `true` | 区分点访问和索引访问 |

### 1.3 当前项目状态

项目 `tsconfig.json` 当前已开启 `strict: true`，但**尚未开启** `noUncheckedIndexedAccess` 和 `verbatimModuleSyntax`。**推荐**在下一个 Sprint 中开启并修复所有编译错误。

```jsonc
// tsconfig.json — 推荐追加
{
  "compilerOptions": {
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "verbatimModuleSyntax": true,
    "exactOptionalPropertyTypes": true
  }
}
```

---

## 2. 类型守卫与类型收窄

### 2.1 `satisfies` 运算符

**推荐**使用 `satisfies` 验证对象符合接口，同时保留字面量类型推断。

```ts
// ✅ 正确：保留字面量类型，同时验证接口约束
export const MOOD_MAP: Record<MoodLevel, { emoji: string; label: string }> = {
  1: { emoji: '😡', label: '烦躁' },
  2: { emoji: '😔', label: '难过' },
  3: { emoji: '😐', label: '平静' },
  4: { emoji: '😊', label: '开心' },
  5: { emoji: '😴', label: '疲惫' },
} satisfies Record<MoodLevel, { emoji: string; label: string }>;

// ❌ 错误：丢失字面量类型推断
const config: Record<string, unknown> = { key: 'value' };
```

### 2.2 自定义类型守卫

**推荐**为复杂类型编写自定义类型守卫函数。

```ts
// ✅ 正确：自定义类型守卫
function isMoodLevel(value: unknown): value is MoodLevel {
  return typeof value === 'number' && value >= 1 && value <= 5;
}

// ✅ 正确：在业务逻辑中使用
function handleMood(mood: unknown) {
  if (isMoodLevel(mood)) {
    // mood 在这里被收窄为 MoodLevel
    return MOOD_MAP[mood];
  }
  return null;
}
```

### 2.3 模板字面量类型

**推荐**使用模板字面量类型约束字符串格式。

```ts
// ✅ 正确：模板字面量类型约束日期格式
type ISODateString = `${number}-${number}-${number}T${number}:${number}:${number}Z`;

// ✅ 正确：约束 Supabase 表名
type TableName = 'profiles' | 'journals' | 'ai_usage' | 'subscriptions';
```

### 2.4 可选链与空值合并

**必须**使用 `?.` 和 `??` 替代冗长的空值检查。

```ts
// ✅ 正确
const nickname = profile?.nickname ?? user.email?.split('@')[0] ?? '用户';

// ❌ 错误：冗长且容易遗漏
const nickname = profile && profile.nickname
  ? profile.nickname
  : user && user.email
    ? user.email.split('@')[0]
    : '用户';
```

---

## 3. React 19 类型约定

### 3.1 `ref` 作为普通 prop

React 19 中 `ref` 可以直接作为组件 prop 传递，**禁止**使用 `forwardRef`。

```tsx
// ✅ 正确：ref 作为普通 prop（React 19）
function JournalInput({ ref, value, onChange }: JournalInputProps) {
  return <textarea ref={ref} value={value} onChange={onChange} />;
}

// ❌ 错误：React 19 已弃用 forwardRef
const JournalInput = React.forwardRef<HTMLTextAreaElement, JournalInputProps>(
  ({ value, onChange }, ref) => { ... }
);
```

### 3.2 `ReactNode` 的变化

React 19 的 `ReactNode` 不再包含 `undefined`。**推荐**使用 `React.ReactNode` 作为 children 类型。

```tsx
// ✅ 正确
interface CardProps {
  children: React.ReactNode;
  title?: string;
}

// ❌ 错误：不再需要 ReactElement 联合
interface OldCardProps {
  children: ReactElement | string | null;
}
```

### 3.3 Hooks 类型推断

React 19 支持更好的 Hooks 类型推断。**推荐**让 TypeScript 自动推断 Hook 返回值类型。

```tsx
// ✅ 正确：自动推断
const [state, setState] = useState<string | null>(null);

// ✅ 正确：useReducer 自动推断 action 类型
const [state, dispatch] = useReducer(reducer, initialState);

// ❌ 错误：多余的泛型标注
const [count, setCount] = useState<number>(0);
```

### 3.4 服务端/客户端组件分离

**必须**明确区分 Server Component（默认）和 Client Component（`'use client'`）。

```tsx
// ✅ 正确：客户端交互组件必须标注 'use client'
'use client';
import { useState } from 'react';

export function JournalInput() {
  const [content, setContent] = useState('');
  return <textarea value={content} onChange={e => setContent(e.target.value)} />;
}
```

---

## 4. Next.js 16 类型约定

### 4.1 异步 `params` 和 `searchParams`

Next.js 16 中 `params` 和 `searchParams` **必须**声明为 `Promise` 类型，且**必须** `await`。

```ts
// ✅ 正确：Next.js 16 异步 params
interface PageProps {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ page?: string; limit?: string }>;
}

export default async function JournalPage({ params, searchParams }: PageProps) {
  const { id } = await params;
  const { page, limit } = await searchParams;
  // ...
}

// ❌ 错误：旧版同步类型（Next.js 16 不再支持）
interface OldPageProps {
  params: { id: string };
  searchParams: { page?: string };
}
```

### 4.2 Route Handlers

Route Handler **必须**显式标注请求和响应类型。

```ts
// ✅ 正确：src/app/api/journal/route.ts — 显式类型标注
import { NextResponse } from 'next/server';
import type { MoodLevel } from '@/types';

export async function POST(request: Request) {
  const body = await request.json();
  const { content, mood } = body;

  // 手动校验 + 类型收窄
  if (!content || typeof content !== 'string' || content.trim().length === 0) {
    return NextResponse.json({ error: 'content is required' }, { status: 400 });
  }
  if (!mood || typeof mood !== 'number' || mood < 1 || mood > 5) {
    return NextResponse.json({ error: 'mood must be a number 1-5' }, { status: 400 });
  }

  const result = await callAI(content.trim(), mood as MoodLevel);
  return NextResponse.json(result);
}

// ❌ 错误：缺少输入校验，直接使用未验证数据
export async function POST(request: Request) {
  const body = await request.json();
  const result = await callAI(body.content, body.mood);
  return NextResponse.json(result);
}
```

### 4.3 Server Actions

**必须**使用 Zod 或同等方案验证 Server Actions 输入。本项目当前无 Server Actions，**新增时必须遵守**。

```ts
// ✅ 正确：Server Action + Zod 验证（未来新增时必须遵守）
'use server';
import { z } from 'zod';

const schema = z.object({
  content: z.string().min(1).max(5000),
  mood: z.number().int().min(1).max(5),
});

export async function saveJournal(formData: FormData) {
  const parsed = schema.safeParse({
    content: formData.get('content'),
    mood: Number(formData.get('mood')),
  });
  if (!parsed.success) {
    return { error: parsed.error.flatten() };
  }
  // ...
}
```

---

## 5. Supabase 类型安全

### 5.1 生成类型

**必须**定期运行 `supabase gen types` 生成数据库类型。

```bash
# 本地开发环境
npm run db:gen-types
# 等同于：supabase gen types typescript --local

# 连接远程数据库
supabase gen types typescript --project-id <project-ref> --schema public > src/lib/database.types.ts
```

### 5.2 使用生成的 Database 类型

**必须**将 `Database` 类型传入 `createClient` 泛型，确保所有查询类型安全。

```ts
// ✅ 正确：supabase.ts — 带 Database 泛型的客户端
import { createClient } from '@supabase/supabase-js';
import type { Database } from '@/lib/database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey);

// 使用后：所有查询自动推断返回类型
const { data } = await supabase.from('journals').select('*');
// data 类型为：Database['public']['Tables']['journals']['Row'][] | null
```

### 5.3 环境变量非空断言

**允许**对 `process.env` 使用非空断言 `!`，但必须紧随运行时检查。

```ts
// ✅ 正确：supabase.ts — 非空断言 + 运行时检查
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

// ❌ 错误：仅有断言，无运行时检查
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
export const supabase = createClient(supabaseUrl, supabaseAnonKey);
```

---

## 6. Zustand v5 类型约定

### 6.1 State 与 Actions 分离

**推荐**将 Zustand store 的 state 和 actions 拆分为独立接口。

```ts
// ✅ 正确：src/store/auth.ts — 接口分离
interface AuthState {
  user: User | null;
  loading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setLoading: (loading: boolean) => void;
  initialize: () => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  isAuthenticated: false,
  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setLoading: (loading) => set({ loading }),
  initialize: () => { /* ... */ },
}));
```

### 6.2 StateCreator 类型

**推荐**在 store 逻辑复杂时显式使用 `StateCreator` 类型提取。

```ts
// ✅ 正确：提取 StateCreator 用于独立测试
import type { StateCreator } from 'zustand';

type JournalSlice = StateCreator<
  JournalState & JournalActions,
  [],
  [],
  JournalState & JournalActions
>;

const createJournalSlice: JournalSlice = (set) => ({
  journals: [],
  loading: false,
  // ...
});
```

### 6.3 中间件类型组合（curried 语法）

**必须**使用 curried 语法声明中间件泛型，确保类型推导正确。

```ts
// ✅ 正确：curried 泛型语法
import { devtools, persist } from 'zustand/middleware';

interface MyState {
  count: number;
  increment: () => void;
}

export const useStore = create<MyState>()(
  devtools(
    persist(
      (set) => ({
        count: 0,
        increment: () => set((state) => ({ count: state.count + 1 })),
      }),
      { name: 'my-store' }
    )
  )
);

// ❌ 错误：缺少泛型，中间件类型丢失
export const useStore = create(
  devtools(
    persist(
      (set) => ({ count: 0, increment: () => set((s) => ({ count: s.count + 1 })) }),
      { name: 'my-store' }
    )
  )
);
```

### 6.4 immer 中间件（如使用）

**推荐**在使用 immer 时确保 `StateCreator` 的 `set` 函数类型正确。

```ts
import { immer } from 'zustand/middleware/immer';

interface State {
  items: Array<{ id: string; done: boolean }>;
}

export const useStore = create<State>()(
  immer((set) => ({
    items: [],
    toggleItem: (id: string) =>
      set((state) => {
        const item = state.items.find((i) => i.id === id);
        if (item) item.done = !item.done;
      }),
  }))
);
```

---

## 7. 反模式（Anti-patterns）

### 7.1 `as` 断言滥用

**禁止**使用 `as` 断言绕过类型检查，除非在以下受控场景：

| 场景 | 示例 | 说明 |
|------|------|------|
| 已知 Supabase 下划线转驼峰字段 | `j.mood_emoji as string \| null` | 数据库字段 `mood_emoji` 映射为 `moodEmoji` |
| 已知 Route Handler 中的安全类型收窄 | `mood as MoodLevel` | 已通过 `typeof` + 范围检查验证 |
| DOM 操作已知非空 | `document.getElementById('x') as HTMLElement` | 已知 DOM 结构存在 |

```ts
// ✅ 可接受：src/lib/export.ts — 已知字段映射的断言
journals: mergedJournals.map((j) => ({
  id: j.id as string,
  content: (j.content as string) || '',
  mood: j.mood as number | null,
  moodEmoji: j.mood_emoji as string | null,
  createdAt: j.created_at as string,
})),

// ✅ 可接受：src/app/api/journal/route.ts — 校验后的类型收窄
if (!mood || typeof mood !== 'number' || mood < 1 || mood > 5) {
  return NextResponse.json({ error: 'mood must be a number 1-5' }, { status: 400 });
}
const result = await callAI(content.trim(), mood as MoodLevel);

// ❌ 禁止：盲目断言绕过类型检查
const value = something as any;
const data = response.data as { id: string };  // 未验证 response 结构
```

### 7.2 `any` 使用

**禁止**使用 `any`。如确实无法确定类型，**必须**使用 `unknown` 并配合类型守卫。

```ts
// ✅ 正确：使用 unknown + 类型守卫
function handleResponse(data: unknown) {
  if (typeof data === 'object' && data !== null && 'id' in data) {
    const id = (data as { id: string }).id;
  }
}

// ❌ 错误：使用 any
function handleResponse(data: any) {
  const id = data.id;
}
```

### 7.3 过度复杂的泛型

**禁止**编写超过 3 层嵌套的泛型。超过时必须拆分为独立类型别名。

```ts
// ❌ 禁止：过度复杂的泛型嵌套
type Complex<T> = T extends infer U ? U extends Record<string, infer V>
  ? V extends Array<infer W> ? W extends object ? Partial<W> : W
  : never : never : never;

// ✅ 正确：拆分为可读的独立类型
type InnerValue<T> = T extends Record<string, infer V> ? V : never;
type ArrayElement<T> = T extends Array<infer W> ? W : never;
type Unwrap<T> = ArrayElement<InnerValue<T>>;
```

### 7.4 循环类型引用

**禁止**类型之间互相引用形成循环依赖。

```ts
// ❌ 禁止：循环引用
interface Journal {
  aiResponse: AIResponse;
}
interface AIResponse {
  sourceJournal: Journal;
}

// ✅ 正确：使用 ID 引用代替循环引用
interface Journal {
  aiResponseId: string | null;
}
interface AIResponse {
  journalId: string;
}
```

### 7.5 `Record<string, unknown>` 替代方案

**推荐**定义具体接口而非使用 `Record<string, unknown>`。

```ts
// ✅ 正确：src/lib/export.ts 中的具体接口
export interface ExportData {
  version: '1.0';
  profile: {
    nickname: string;
    email: string;
    registeredAt: string;
  };
  journals: Array<{
    id: string;
    content: string;
    mood: number | null;
    createdAt: string;
  }>;
  exportedAt: string;
}

// ⚠️ 可接受：在合并未知来源数据时临时使用
const allJournals: Record<string, unknown>[] = [];  // export.ts 分页合并场景
```

---

## 8. 工具类型与自定义类型定义

### 8.1 内置工具类型

**优先**使用 TypeScript 内置工具类型，而非手动实现。

| 工具类型 | 用途 | 示例 |
|----------|------|------|
| `Partial<T>` | 所有属性可选 | `Partial<Journal>` |
| `Required<T>` | 所有属性必填 | `Required<Journal>` |
| `Pick<T, K>` | 选取部分属性 | `Pick<Journal, 'id' \| 'content'>` |
| `Omit<T, K>` | 排除部分属性 | `Omit<Journal, 'timestamp'>` |
| `Record<K, V>` | 键值映射 | `Record<MoodLevel, { emoji: string; label: string }>` |
| `ReturnType<T>` | 函数返回类型 | `ReturnType<typeof useAuthStore>` |
| `Parameters<T>` | 函数参数类型 | `Parameters<typeof callAI>` |
| `NonNullable<T>` | 排除 null/undefined | `NonNullable<User \| null>` → `User` |
| `satisfies` | 类型验证保留字面量 | `obj satisfies Type` |

### 8.2 项目自定义类型

**必须**在 `src/types/index.ts` 中集中定义共享类型。

```ts
// ✅ 正确：src/types/index.ts — 字面量联合类型 + 接口
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
  status: 'pending' | 'ai_ready' | 'ai_done';
  shareCount: number;
}

export interface AIResponse {
  response: string;
  goldenQuote: string;
  moodLabel: string;
  fromFallback: boolean;
}
```

### 8.3 const 断言

**推荐**对常量对象使用 `as const` 获取精确字面量类型。

```ts
// ✅ 正确：const 断言获取精确类型
const STATUS_LABELS = {
  pending: '待同步',
  ai_ready: 'AI 处理中',
  ai_done: '已完成',
} as const;

// STATUS_LABELS['pending'] 类型为 '待同步'，而非 string
```

---

## 9. Decorators（装饰器）

### 9.1 本项目不使用装饰器

**禁止**在本项目中使用 TypeScript Decorators，原因：

- Next.js 编译管道对 Decorators 支持不稳定
- 与服务端组件（RSC）不兼容
- 增加编译复杂性和 bundle 体积

```ts
// ❌ 禁止：装饰器
@observable
class MyStore {
  @action toggle() { ... }
}

// ✅ 替代：使用 Zustand
const useStore = create<MyState>((set) => ({
  value: false,
  toggle: () => set((state) => ({ value: !state.value })),
}));
```

---

## 10. 代码审查清单（Code Review Checklist）

在 PR 合并前，审查者**必须**逐项检查：

### tsconfig 与严格模式
- [ ] 新增代码在 `strict: true` 下零编译错误
- [ ] 未使用 `@ts-ignore` / `@ts-expect-error` 绕过检查（特殊情况需在 PR 描述中说明理由）

### 类型安全
- [ ] 未使用 `any`（如确需使用 `unknown` + 类型守卫）
- [ ] `as` 断言仅用于已知安全的场景（Supabase 字段映射、已验证的输入、已知 DOM 结构）
- [ ] 索引访问考虑了 `undefined` 情况（或在 `noUncheckedIndexedAccess` 下正确处理）
- [ ] 可选属性访问使用了 `?.` 或 `??`

### React 19
- [ ] 未使用 `forwardRef`（React 19 中 `ref` 为普通 prop）
- [ ] `children` 类型为 `React.ReactNode`
- [ ] Client Component 正确标注 `'use client'`
- [ ] Hooks 类型推断未被多余泛型标注干扰

### Next.js 16
- [ ] Page 组件 `params` / `searchParams` 类型为 `Promise<...>` 且已 `await`
- [ ] Route Handler 对请求体进行了手动校验 + 类型收窄
- [ ] Server Actions（如有）使用 Zod 或等价方案验证输入

### Supabase
- [ ] `createClient` 使用了 `Database` 泛型
- [ ] 环境变量使用了 `!` 断言后有运行时检查
- [ ] 查询结果正确处理了 `null` / `error` 分支

### Zustand v5
- [ ] store 使用 `create<State>()` curried 泛型语法
- [ ] state 和 actions 分离为独立接口
- [ ] 中间件类型推导正确

### 架构约定
- [ ] 未使用 Decorators
- [ ] 共享类型定义在 `src/types/index.ts` 中
- [ ] 无循环类型引用
- [ ] 泛型嵌套不超过 3 层
