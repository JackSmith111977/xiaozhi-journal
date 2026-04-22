# Next.js 16 编码标准

> **项目**: Xiaozhi Journal
> **版本**: Next.js 16.2.3 + React 19.2.4 + TypeScript 5.x
> **最后更新**: 2026-04-22
> **适用范围**: 所有 AI 生成的代码及人工审查

---

## 目录

1. [Server Components vs Client Components](#1-server-components-vs-client-components)
2. [异步 Request APIs (params, searchParams, cookies, headers)](#2-异步-request-apis)
3. [路由保护 — proxy.ts](#3-路由保护---proxyts)
4. [Route Handlers (API Routes)](#4-route-handlers-api-routes)
5. [Server Actions 数据变更](#5-server-actions-数据变更)
6. [Cache Components (`use cache`)](#6-cache-components-use-cache)
7. [错误边界 (Error Boundaries)](#7-错误边界-error-boundaries)
8. [文件结构与命名约定](#8-文件结构与命名约定)
9. [配置与废弃 API](#9-配置与废弃-api)
10. [状态管理与数据流 (Zustand + IndexedDB + Supabase)](#10-状态管理与数据流)
11. [认证与授权 (Supabase Auth)](#11-认证与授权-supabase-auth)
12. [离线优先与同步](#12-离线优先与同步)
13. [动画与 UI (framer-motion)](#13-动画与-ui-framer-motion)
14. [样式 (Tailwind CSS v4)](#14-样式-tailwind-css-v4)
15. [安全规范](#15-安全规范)
16. [代码审查检查清单](#16-代码审查检查清单)

---

## 1. Server Components vs Client Components

### 规则 1.1: 默认 Server Component，仅在必要时标记 `'use client'`

**必须**: 文件顶部无 `'use client'` 指令的组件默认为 Server Component。

**必须**: 仅在组件需要以下功能时才添加 `'use client'`:
- `useState`, `useEffect`, `useRef`, `useCallback`, `useMemo` 等 React Hooks
- 浏览器 API (`window`, `navigator`, `localStorage`, `document`)
- 事件处理器 (`onClick`, `onChange`, `onSubmit`)
- 使用了其他 Client Component

```tsx
// ✅ Server Component — 无交互, 纯展示
export default async function JournalDetail({ params }: PageProps<'/history/[id]'>) {
  const { id } = await params
  const journal = await getJournalFromDB(id)
  if (!journal) notFound()
  return <div>{journal.content}</div>
}

// ✅ Client Component — 需要交互
'use client'

export function MoodSelector() {
  const [selected, setSelected] = useState<number | null>(null)
  return (
    <div>
      {moods.map((m) => (
        <button key={m.value} onClick={() => setSelected(m.value)}>
          {m.emoji}
        </button>
      ))}
    </div>
  )
}

// ❌ 错误：不需要交互却标记了 'use client'
'use client'
export function StaticHeader() {
  return <h1>Xiaozhi Journal</h1>
}
```

### 规则 1.2: Client Component 必须放在组件树尽可能底层

**必须**: 将 `'use client'` 限制在最小范围的组件内，而非整个页面。

```tsx
// ✅ 正确：Server Component 包裹 Client Component
// app/history/page.tsx (Server Component)
import { JournalList } from '@/components/journal-list'

export default async function HistoryPage() {
  const journals = await getJournalsFromDB()
  return <JournalList initialJournals={journals} />
}

// components/journal-list.tsx (Client Component)
'use client'
export function JournalList({ initialJournals }: { initialJournals: Journal[] }) {
  const [journals, setJournals] = useState(initialJournals)
  // ... 交互逻辑
}

// ❌ 错误：整个页面都是 Client Component 仅仅因为一个交互元素
'use client'
export default function HistoryPage() {
  // 整个页面的渲染都在客户端，浪费 bundle 体积
}
```

### 规则 1.3: Server Component 可以向 Client Component 传递 props，但不能反向

**必须**: Server Component 不能作为 Client Component 的子组件。

```tsx
// ✅ 正确
// Server Component
import { ClientForm } from '@/components/client-form'

export default function Page() {
  const data = await fetchData()
  // Server Component 作为 Client Component 的 children — 允许
  return <ClientForm initialData={data}><StaticNote /></ClientForm>
}

// ❌ 错误：Client Component 的子组件不能是 Server Component
// 'use client'
export function ClientForm({ children }: { children: React.ReactNode }) {
  // children 中包含 Server Component — 报错
  return <form>{children}</form>
}
```

### 规则 1.4: Xiaozhi Journal 项目现状说明

本项目当前大部分页面已经是 `'use client'`（因为使用了 IndexedDB 客户端存储 + Zustand 状态管理），这符合离线优先架构的需要。但以下情况**必须**使用 Server Component:

- 新增的公开页面（如关于页、帮助页）
- 不涉及用户数据的静态内容
- 不涉及 Supabase 实时订阅的展示页面

**禁止**: 在 `'use client'` 组件中直接使用 `supabase` client 做数据获取。必须通过 `@/lib/db` 模块操作 IndexedDB。

---

## 2. 异步 Request APIs

### 规则 2.1: `params` 和 `searchParams` 必须使用 `await` 访问

Next.js 16 中，`params` 和 `searchParams` 现在是 Promise 类型，**必须** await。

```tsx
// ✅ 正确
export default async function Page(props: PageProps<'/history/[id]'>) {
  const { id } = await props.params
  const searchParams = await props.searchParams
  const filter = searchParams.get('filter')
  return <div>{id}</div>
}

// ❌ 错误 — 同步访问（Next.js 15 及更早的写法）
export default function Page({ params }: { params: { id: string } }) {
  const { id } = params  // 运行时警告/错误
}
```

### 规则 2.2: 在 Route Handlers 中也必须使用异步 API

```tsx
// ✅ 正确 — route handler
export async function GET(request: Request, context: RouteContext<'/api/journal/[id]'>) {
  const { id } = await context.params
  return NextResponse.json({ id })
}
```

### 规则 2.3: 必须使用 `PageProps` 和 `RouteContext` 类型助手

**必须**: 从 `next` 导入 `PageProps`, `LayoutProps`, `RouteContext` 获取完整的类型安全。

```tsx
import type { PageProps, RouteContext } from 'next'

// Page component
export default async function Page(props: PageProps<'/history/[id]'>) {
  const { id } = await props.params
}

// Route handler
export async function GET(_request: Request, context: RouteContext<'/api/journal/[id]'>) {
  const { id } = await context.params
}
```

---

## 3. 路由保护 — proxy.ts

### 规则 3.1: 必须使用 `proxy.ts`（不再使用 `middleware.ts`）

`middleware.ts` 已在 Next.js 16 废弃。路由保护**必须**放在项目根目录的 `proxy.ts`。

```ts
// proxy.ts (项目根目录，不是 app/ 下)
import { NextRequest } from 'next/server'

const PROTECTED_PATHS = ['/settings', '/history']

export function proxy(request: NextRequest) {
  const { pathname } = new URL(request.url)

  if (PROTECTED_PATHS.some((p) => pathname.startsWith(p))) {
    const sessionCookie = request.cookies.get('sb-session-token')
    if (!sessionCookie) {
      return Response.redirect(new URL('/auth/login', request.url))
    }
  }
}
```

### 规则 3.2: proxy.ts 中必须注意

- `proxy` 运行在 `nodejs` 运行时，不支持 `edge` runtime
- 不要执行数据库查询等重操作，仅做 cookie/session 校验
- 重定向必须使用 `Response.redirect()` 而非 `redirect()` from `next/navigation`

---

## 4. Route Handlers (API Routes)

### 规则 4.1: 每个 Route Handler 必须验证认证

**必须**: 所有处理用户数据的 API route **必须**在入口处验证 Supabase session。

```tsx
// app/api/journal/route.ts
import { NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: Request) {
  // 1. 验证 session
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) {
    return NextResponse.json({ error: '未登录' }, { status: 401 })
  }

  // 2. 解析并验证请求体
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: '无效的请求体' }, { status: 400 })
  }

  // 3. 处理业务逻辑
  // ...

  return NextResponse.json({ success: true })
}
```

### 规则 4.2: 错误信息不得泄露内部细节

**必须**: 返回给客户端的错误信息必须是用户友好的通用描述，不能包含堆栈跟踪、SQL 语句、内部路径等。

```tsx
// ✅ 正确
return NextResponse.json({ error: '保存失败，请稍后再试' }, { status: 500 })

// ❌ 错误
return NextResponse.json({ error: err.message, stack: err.stack }, { status: 500 })
```

### 规则 4.3: 所有 Route Handlers 必须包含 try/catch

**必须**: 每个 HTTP method handler 必须包含顶层 try/catch，且 catch 块必须记录日志并返回通用错误响应。

```tsx
export async function DELETE(request: Request) {
  try {
    // ... 业务逻辑
  } catch (error) {
    console.error('[API] DELETE error:', error)
    return NextResponse.json(
      { error: '操作失败，请稍后再试' },
      { status: 500 }
    )
  }
}
```

### 规则 4.4: Xiaozhi Journal 项目 API 路由清单

| 路径 | 方法 | 说明 |
|------|------|------|
| `/api/journal` | POST | AI 回应生成 (DashScope) |
| `/api/account/delete` | DELETE | 账户删除 (Supabase Admin API) |

**禁止**: 绕过上述路由规范创建新的 API 端点，除非经过架构审查。

---

## 5. Server Actions 数据变更

### 规则 5.1: 优先使用 Server Actions 做数据变更

**推荐**: 对于表单提交等场景，优先使用 `'use server'` Server Actions 而非 API routes。

```tsx
// app/actions/journal-actions.ts
'use server'

import { revalidateTag } from 'next/cache'
import { supabase } from '@/lib/supabase'

export async function saveJournal(content: string, mood: number) {
  const { data: { session } } = await supabase.auth.getSession()
  if (!session) throw new Error('未登录')

  const { data, error } = await supabase
    .from('journals')
    .insert({ content, mood, user_id: session.user.id })
    .select()
    .single()

  if (error) throw new Error(error.message)

  revalidateTag('journals')
  return data
}
```

```tsx
// 客户端组件调用
'use client'
import { saveJournal } from '@/app/actions/journal-actions'
import { useActionState } from 'react'

export function JournalForm() {
  const [state, formAction] = useActionState(
    async (_prev: unknown, formData: FormData) => {
      try {
        await saveJournal(formData.get('content') as string, Number(formData.get('mood')))
        return { success: true, error: null }
      } catch (err) {
        return { success: false, error: err instanceof Error ? err.message : '保存失败' }
      }
    },
    null
  )

  return (
    <form action={formAction}>
      <textarea name="content" />
      <input type="number" name="mood" />
      <button type="submit">保存</button>
      {state?.error && <p className="text-red-500">{state.error}</p>}
    </form>
  )
}
```

### 规则 5.2: Server Actions 必须处理错误并返回结构化结果

**必须**: Server Action 的返回值必须是结构化的（包含 `success`/`error` 字段），不能仅抛出异常。

---

## 6. Cache Components (`use cache`)

### 规则 6.1: 静态内容使用 `'use cache'`

**必须**: 对于不随用户变化的静态数据查询，使用 `'use cache'` 标记函数以启用服务端缓存。

```tsx
// ✅ 静态内容缓存
'use cache'
export async function getGoldenQuote(): Promise<Quote> {
  // 这个查询结果对所有用户相同
  return db.queries.getDailyQuote()
}
```

### 规则 6.2: 用户专属数据使用 `'use cache: private'`

**必须**: 包含用户个性化信息的查询**必须**使用 `'use cache: private'`，防止数据泄露。

```tsx
// ✅ 私有缓存 — 每个用户独立缓存
'use cache: private'
export async function getUserJournals(userId: string) {
  return supabase.from('journals').select('*').eq('user_id', userId)
}
```

### 规则 6.3: 缓存标签用于主动失效

**必须**: 当数据更新时，使用 `revalidateTag()` 清除相关缓存。

```tsx
import { revalidateTag } from 'next/cache'

export async function updateJournal(id: string, data: Partial<Journal>) {
  await db.journals.update(id, data)
  revalidateTag('journals')
  revalidateTag(`journal:${id}`)
}
```

### 规则 6.4: 配置必须启用 `cacheComponents`

**必须**: `next.config.ts` 中必须设置 `cacheComponents: true`。

```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  cacheComponents: true,
  // ...
}
```

### 规则 6.5: 本项目离线优先架构的缓存策略说明

由于 Xiaozhi Journal 采用 **IndexedDB 离线优先** 架构，大部分数据读取不走服务端缓存。`use cache` 主要用于:
- 新增的 Server Component 页面中的数据获取
- 公开页面的静态内容
- AI 回应生成后的结果缓存（配合 Supabase RLS）

---

## 7. 错误边界 (Error Boundaries)

### 规则 7.1: 必须提供以下错误边界文件

| 文件 | 作用 | 范围 |
|------|------|------|
| `app/error.tsx` | 段级错误边界 | 当前段及其子段 |
| `app/not-found.tsx` | 404 页面 | 所有未匹配路由 |
| `app/global-error.tsx` | 根级错误 | 整个应用（包裹 `<html>`） |

### 规则 7.2: `error.tsx` 必须是 Client Component

**必须**: `error.tsx` 和 `global-error.tsx` 必须在文件顶部标记 `'use client'`。

```tsx
// app/error.tsx
'use client'

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <div className="min-h-screen bg-[#FDF8F5] flex items-center justify-center px-6">
      <div className="text-center">
        <h1 className="text-2xl text-[#3D3D3D] mb-2" style={{ fontFamily: 'var(--font-noto-serif)' }}>
          出错了
        </h1>
        <p className="text-[#8A817C] mb-4">抱歉，发生了意外错误</p>
        <button
          onClick={() => reset()}
          className="px-4 py-2 rounded-xl text-white text-sm font-medium"
          style={{ backgroundColor: '#D4856A' }}
        >
          重试
        </button>
      </div>
    </div>
  )
}
```

```tsx
// app/not-found.tsx
import Link from 'next/link'

export default function NotFound() {
  return (
    <div className="min-h-screen bg-[#FDF8F5] flex items-center justify-center px-6">
      <div className="text-center">
        <h1 className="text-2xl text-[#3D3D3D] mb-2" style={{ fontFamily: 'var(--font-noto-serif)' }}>
          404
        </h1>
        <p className="text-[#8A817C] mb-4">页面未找到</p>
        <Link href="/" className="text-[#D4856A] hover:underline">
          返回首页
        </Link>
      </div>
    </div>
  )
}
```

```tsx
// app/global-error.tsx
'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  return (
    <html lang="zh-CN">
      <body>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <h1>应用出错了</h1>
          <button onClick={() => reset()}>重试</button>
        </div>
      </body>
    </html>
  )
}
```

### 规则 7.3: 使用 `notFound()` 函数处理资源未找到

**必须**: 在 Server Component 中资源不存在时调用 `notFound()`，而非返回自定义文本。

```tsx
import { notFound } from 'next/navigation'

export default async function JournalDetail(props: PageProps<'/history/[id]'>) {
  const { id } = await props.params
  const journal = await getJournal(id)
  if (!journal) notFound()  // 触发 app/not-found.tsx
  return <div>{journal.content}</div>
}
```

---

## 8. 文件结构与命名约定

### 规则 8.1: App Router 文件结构

```
xiaozhi-journal/
├── proxy.ts                          # 路由保护（不再叫 middleware.ts）
├── next.config.ts                    # Next.js 配置
├── tsconfig.json
├── postcss.config.mjs
├── src/
│   ├── app/
│   │   ├── layout.tsx                # 根布局（Server Component）
│   │   ├── page.tsx                  # 首页
│   │   ├── error.tsx                 # 段级错误边界（Client Component）
│   │   ├── not-found.tsx             # 404 页面
│   │   ├── global-error.tsx          # 根级错误（Client Component）
│   │   ├── loading.tsx               # 段级加载 fallback
│   │   ├── globals.css               # 全局样式
│   │   ├── auth/
│   │   │   ├── login/
│   │   │   │   └── page.tsx
│   │   │   └── callback/
│   │   │       └── route.ts
│   │   ├── settings/
│   │   │   └── page.tsx
│   │   ├── history/
│   │   │   ├── page.tsx
│   │   │   └── [id]/
│   │   │       └── page.tsx
│   │   └── api/
│   │       ├── journal/
│   │       │   └── route.ts
│   │       └── account/
│   │           └── delete/
│   │               └── route.ts
│   ├── components/
│   │   ├── auth-guard.tsx
│   │   ├── journal-input.tsx
│   │   ├── mood-selector.tsx
│   │   └── ...
│   ├── lib/
│   │   ├── auth.ts                   # Supabase Auth 封装
│   │   ├── db.ts                     # IndexedDB 操作
│   │   ├── supabase.ts               # Supabase Client
│   │   ├── realtime.ts               # Supabase Realtime 订阅
│   │   ├── sync-manager.ts           # 离线同步管理器
│   │   ├── export.ts                 # 数据导出
│   │   └── account.ts                # 账户管理
│   ├── store/
│   │   ├── auth.ts                   # Zustand Auth Store
│   │   └── journal.ts                # Zustand Journal Store
│   └── types/
│       └── index.ts                  # TypeScript 类型定义
└── supabase/
    └── migrations/
```

### 规则 8.2: 文件命名约定

**必须**:
- 页面组件: `page.tsx`（App Router 约定）
- 路由 handler: `route.ts`（App Router 约定）
- 布局组件: `layout.tsx`
- 错误边界: `error.tsx`
- 404 页面: `not-found.tsx`
- 动态路由段: 使用 `[slug]` 目录名
- 组件文件: kebab-case（如 `journal-input.tsx`）
- lib 文件: kebab-case（如 `sync-manager.ts`）
- store 文件: kebab-case（如 `auth.ts`）

**禁止**: 使用 PascalCase 作为文件名（如 `JournalInput.tsx`），统一使用 kebab-case。

### 规则 8.3: 组件导出约定

**必须**: 页面组件使用 `export default`，可复用组件使用具名导出。

```tsx
// ✅ 页面 - 默认导出
export default function HistoryPage() { ... }

// ✅ 可复用组件 - 具名导出
export function JournalCard({ journal }: JournalCardProps) { ... }

// ✅ 工具函数 - 具名导出
export function formatDate(date: Date): string { ... }
```

---

## 9. 配置与废弃 API

### 规则 9.1: 必须在 `next.config.ts` 中配置的项目

```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Cache Components 支持
  cacheComponents: true,

  // React Compiler（自动 memoization）
  reactCompiler: true,

  // 图片远程域名白名单
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'api.qrserver.com',
      },
    ],
  },
}

export default nextConfig
```

### 规则 9.2: 已废弃/移除 API 列表（禁止使用）

| API | 状态 | 替代方案 |
|-----|------|----------|
| `middleware.ts` | 已废弃 | `proxy.ts` |
| `next lint` | 已移除 | 直接用 `eslint` |
| `serverRuntimeConfig` / `publicRuntimeConfig` | 已移除 | `process.env` |
| `experimental_ppr` | 已移除 | `cacheComponents: true` |
| `experimental.turbopack` | 已移除 | 顶层 `turbopack` 配置 |
| `unstable_cache` | 已稳定 | `cacheLife` / `cacheTag` (无前缀) |
| `unstable_cacheLife` | 已稳定 | `cacheLife` |
| `unstable_cacheTag` | 已稳定 | `cacheTag` |
| `images.domains` | 已废弃 | `images.remotePatterns` |
| `getStaticProps` / `getServerSideProps` | 已废弃 | Server Components + `use cache` |
| `pages/` 目录 | 已废弃 | `app/` 目录 |

### 规则 9.3: npm scripts 约定

**禁止**: 在 npm scripts 中使用 `--turbopack` flag（Next.js 16 默认启用）。

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "eslint"
  }
}
```

### 规则 9.4: ESLint Flat Config

**必须**: 使用 ESLint Flat Config 格式 (`eslint.config.js` 或 `eslint.config.mjs`)。

```js
// eslint.config.mjs
import nextPlugin from '@next/eslint-plugin-next'

export default [
  {
    plugins: { '@next/next': nextPlugin },
    rules: nextPlugin.configs.recommended.rules,
  },
]
```

### 规则 9.5: 环境变量命名规范

**必须**:
- 客户端可访问的变量必须以 `NEXT_PUBLIC_` 前缀开头
- 服务端专用变量不加前缀（如 `SUPABASE_SERVICE_ROLE_KEY`、`DASHSCOPE_API_KEY`）

```ts
// ✅ 客户端可用（会暴露给浏览器）
const url = process.env.NEXT_PUBLIC_SUPABASE_URL!

// ✅ 仅服务端可用（不会暴露给浏览器）
const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// ❌ 错误：API Key 用了 NEXT_PUBLIC_ 前缀，会泄露
const apiKey = process.env.NEXT_PUBLIC_DASHSCOPE_API_KEY
```

---

## 10. 状态管理与数据流

### 规则 10.1: Zustand Store 使用规范

**必须**:
- Store 文件放在 `src/store/` 目录下
- 使用 `create<State & Actions>()` 模式
- 状态类型必须明确定义

```tsx
// store/journal.ts
import { create } from 'zustand'
import type { Journal } from '@/types'

interface JournalState {
  journals: Journal[]
  loading: boolean
  error: string | null
}

interface JournalActions {
  fetchJournals: () => Promise<void>
  addJournal: (journal: Journal) => Promise<void>
}

export const useJournalStore = create<JournalState & JournalActions>((set) => ({
  journals: [],
  loading: false,
  error: null,

  fetchJournals: async () => {
    set({ loading: true })
    try {
      const journals = await getJournals()
      set({ journals, loading: false })
    } catch {
      set({ error: '加载失败', loading: false })
    }
  },
  // ...
}))
```

### 规则 10.2: 数据读写必须通过 IndexedDB

**必须**: 所有 journal 数据的读写操作必须通过 `@/lib/db` 模块（IndexedDB），不能直接访问 Zustand store 中的数组来做持久化。

```tsx
// ✅ 正确
import { getJournals, addJournal } from '@/lib/db'

const journals = await getJournals()
await addJournal(journal)

// ❌ 错误：绕过 IndexedDB 直接操作
useJournalStore.setState({ journals: [...journals, newJournal] })
```

### 规则 10.3: 离线状态必须同步

**必须**: 在网络状态变化时，必须更新 Zustand store 中的 `isOnline` 状态。

```tsx
// 在 store 中初始化 online/offline 监听
initOfflineSync: () => {
  window.addEventListener('online', () => set({ isOnline: true }))
  window.addEventListener('offline', () => set({ isOnline: false }))
}
```

---

## 11. 认证与授权 (Supabase Auth)

### 规则 11.1: 认证状态必须通过 Zustand Store 管理

**必须**: 使用 `@/store/auth` store 统一管理认证状态，不在组件中直接使用 `supabase.auth` 的状态。

```tsx
// ✅ 正确
const { user, loading } = useAuthStore()

// ❌ 错误：在组件中直接获取 Supabase session
const { data: { session } } = await supabase.auth.getSession()
```

### 规则 11.2: 受保护页面必须使用 AuthGuard

**必须**: 所有需要登录的页面必须用 `<AuthGuard>` 包裹。

```tsx
export default function SettingsPage() {
  return (
    <AuthGuard>
      <SettingsContent />
    </AuthGuard>
  )
}
```

### 规则 11.3: 登录/注册页面必须使用 AuthGuard(requireAuth={false})

**必须**: 已登录用户访问登录页时，自动跳转到首页。

```tsx
export default function AuthPage() {
  return (
    <AuthGuard requireAuth={false}>
      <AuthPageContent />
    </AuthGuard>
  )
}
```

### 规则 11.4: Supabase Client 必须在模块级别单例化

**必须**: Supabase client 必须在 `@/lib/supabase.ts` 中创建并导出单例，不在每个文件中重复创建。

```tsx
// lib/supabase.ts
import { createClient } from '@supabase/supabase-js'

export const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)
```

---

## 12. 离线优先与同步

### 规则 12.1: 写入顺序 — 先 IndexedDB，后 Supabase

**必须**: 所有数据变更必须先写入 IndexedDB（确保离线可用），然后异步同步到 Supabase。

```tsx
// ✅ 正确：先写 IndexedDB，再异步同步到 Supabase
async function addJournal(journal: Journal) {
  // 1. 立即保存到 IndexedDB
  const offlineJournal = { ...journal, status: 'pending' }
  await dbAdd(offlineJournal)

  // 2. 异步同步到 Supabase（不阻塞用户）
  if (navigator.onLine) {
    try {
      await syncToSupabase([offlineJournal])
    } catch (err) {
      // 失败不阻塞，journal 保持 pending 状态
      console.warn('Sync failed, journal remains pending:', err)
    }
  }
}
```

### 规则 12.2: 数据状态必须标记

**必须**: 每条 journal 记录必须有 `status` 字段:
- `'pending'`: 已保存到 IndexedDB 但尚未同步到 Supabase
- `'synced'`: 已同步到 Supabase
- `'ai_done'`: AI 回应已生成并同步

### 规则 12.3: 网络恢复后必须自动重试

**必须**: 当浏览器从离线变为在线时，必须自动处理所有 `status === 'pending'` 的记录。

---

## 13. 动画与 UI (framer-motion)

### 规则 13.1: 使用 framer-motion 必须导入 `motion`

**必须**: 使用 `motion` 组件替代原生 HTML 元素来添加动画。

```tsx
import { motion, AnimatePresence } from 'framer-motion'

// ✅ 正确
<motion.div
  initial={{ opacity: 0, y: 20 }}
  animate={{ opacity: 1, y: 0 }}
  exit={{ opacity: 0 }}
  transition={{ duration: 0.3 }}
>
  内容
</motion.div>

// 列表动画必须使用 AnimatePresence + key
<AnimatePresence>
  {items.map((item) => (
    <motion.div key={item.id} exit={{ opacity: 0 }}>
      {item.content}
    </motion.div>
  ))}
</AnimatePresence>
```

### 规则 13.2: AnimatePresence 必须搭配唯一的 key

**必须**: `AnimatePresence` 包裹的每个子组件必须有唯一的 `key` prop。

```tsx
// ✅ 正确
<AnimatePresence>
  {selectedMood && <JournalInput key={selectedMood} />}
</AnimatePresence>

// ❌ 错误：没有 key，exit 动画不会触发
<AnimatePresence>
  {selectedMood && <JournalInput />}
</AnimatePresence>
```

### 规则 13.3: 动画时长建议

**推荐**: 进入/退出动画时长 0.3s，避免过慢影响交互响应速度。

---

## 14. 样式 (Tailwind CSS v4)

### 规则 14.1: 必须使用 Tailwind CSS v4 语法

**必须**:
- 使用 `@import "tailwindcss"` 替代旧的 `@tailwind` 指令
- 使用 `@theme` 块定义自定义 CSS 变量
- 不再需要 `tailwind.config.js`（已移除）

### 规则 14.2: 本项目颜色系统

**必须**: 使用项目定义的颜色变量，不随意使用 Tailwind 内置颜色。

| 用途 | 色值 | Tailwind 类 |
|------|------|-------------|
| 背景 | `#FDF8F5` | `bg-[#FDF8F5]` |
| 主文字 | `#3D3D3D` | `text-[#3D3D3D]` |
| 次要文字 | `#8A817C` | `text-[#8A817C]` |
| 强调色 | `#D4856A` | `text-[#D4856A]` / `border-[#D4856A]` |
| 按钮底色 | `#E8C4A0` | `bg-[#E8C4A0]` |
| 成功色 | `#A8C5A0` | `text-[#A8C5A0]` |
| 边框 | `#E8E0D8` | `border-[#E8E0D8]` |

### 规则 14.3: 字体使用

**必须**: 使用 `layout.tsx` 中定义的 CSS 变量。

```tsx
// 中文衬底
style={{ fontFamily: 'var(--font-noto-serif)' }}

// 中文无衬底
style={{ fontFamily: 'var(--font-noto-sans)' }}
```

### 规则 14.4: 自定义颜色必须使用方括号语法

```tsx
// ✅ 正确
<div className="bg-[#FDF8F5] text-[#3D3D3D]">

// ❌ 错误：使用 Tailwind v3 语义颜色
<div className="bg-stone-50 text-gray-800">
```

---

## 15. 安全规范

### 规则 15.1: Service Role Key 绝对不能暴露给客户端

**必须**: `SUPABASE_SERVICE_ROLE_KEY` 只能在 Route Handler 和 Server Actions 中使用，绝对不能出现在 `'use client'` 标记的文件中。

```tsx
// ❌ 严重安全漏洞 — 'use client' 文件中使用了 Service Role Key
'use client'
import { createClient } from '@supabase/supabase-js'
const supabase = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY!)
```

### 规则 15.2: 所有用户输入必须验证

**必须**: 所有表单提交和 API 请求必须验证输入格式和范围。

```tsx
// 前端验证
if (!email || !email.includes('@')) {
  setError('邮箱格式不正确')
  return
}

// 服务端验证（API Route）
if (!content || typeof content !== 'string' || content.trim().length === 0) {
  return NextResponse.json({ error: 'content is required' }, { status: 400 })
}
```

### 规则 15.3: 文件上传必须验证大小和类型

**必须**: 所有文件上传操作必须验证文件大小（本项目上限 2MB）和 MIME 类型。

```tsx
if (file.size > 2 * 1024 * 1024) {
  setMessage({ type: 'error', text: '头像大小不能超过 2MB' })
  return
}

const allowedTypes = ['image/jpeg', 'image/png']
if (!allowedTypes.includes(file.type)) {
  setMessage({ type: 'error', text: '仅支持 JPG/PNG 格式' })
  return
}
```

### 规则 15.4: 密码最小长度 8 位

**必须**: 注册和重置密码时，密码最小长度为 8 位。

---

## 16. 代码审查检查清单

在提交代码审查之前，逐项检查:

### Server/Client Components
- [ ] 不需要交互的组件没有标记 `'use client'`
- [ ] `'use client'` 组件位于组件树尽可能深的层级
- [ ] Server Component 没有尝试使用 `useState`/`useEffect`
- [ ] Client Component 的子组件中不包含 Server Component 逻辑

### 异步 API
- [ ] `params` 和 `searchParams` 使用了 `await`
- [ ] 使用了 `PageProps` 或 `RouteContext` 类型

### 路由保护
- [ ] 路由保护逻辑在 `proxy.ts` 中，不在 `middleware.ts`
- [ ] proxy 中没有使用数据库查询等重操作

### API Routes
- [ ] 每个 Route Handler 验证了 Supabase session
- [ ] 错误信息不泄露内部细节
- [ ] 所有方法包含 try/catch

### 错误边界
- [ ] `app/error.tsx` 存在且标记了 `'use client'`
- [ ] `app/not-found.tsx` 存在
- [ ] `app/global-error.tsx` 存在且标记了 `'use client'`

### 安全
- [ ] `SUPABASE_SERVICE_ROLE_KEY` 没有出现在 `'use client'` 文件中
- [ ] `NEXT_PUBLIC_` 前缀仅用于需要在浏览器中访问的变量
- [ ] 所有用户输入经过验证
- [ ] 文件上传验证了大小和类型

### 数据流
- [ ] 数据写入先 IndexedDB 后 Supabase
- [ ] 离线状态变化时自动重试 pending 记录
- [ ] Zustand store 中的状态更新没有绕过 IndexedDB

### 动画
- [ ] `AnimatePresence` 的子组件都有唯一 `key`
- [ ] 动画时长不超过 0.3s

### 样式
- [ ] 使用项目定义的颜色变量（`#FDF8F5` 等）
- [ ] 字体使用 `var(--font-noto-serif)` 或 `var(--font-noto-sans)`

---

> 本文档为 **Xiaozhi Journal** 项目的 Next.js 16 编码标准。所有 AI 生成的代码必须遵守本规范。
> 如有特殊情况需要偏离规范，必须在代码审查中说明理由。
