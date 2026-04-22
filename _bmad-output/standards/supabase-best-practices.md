# Supabase JS SDK v2 最佳实践标准

> 适用于本项目 (xiaozhi-journal)，基于 @supabase/supabase-js v2 + @supabase/ssr

## 目录

1. [客户端创建模式 (Client vs Server/Admin)](#1-客户端创建模式)
2. [RLS 行级安全策略](#2-rls-行级安全策略)
3. [实时订阅管理](#3-实时订阅管理)
4. [Auth Session 处理](#4-auth-session-处理)
5. [服务端 vs 客户端分离](#5-服务端-vs-客户端分离)
6. [Service Role Key 安全](#6-service-role-key-安全)
7. [查询模式 (过滤/分页/关联)](#7-查询模式)
8. [离线优先与 IndexedDB 同步](#8-离线优先与-indexeddb-同步)
9. [TypeScript 类型生成](#9-typescript-类型生成)
10. [常见陷阱与反模式](#10-常见陷阱与反模式)

---

## 1. 客户端创建模式

### 1.1 浏览器客户端 (Browser Client)

用于 Client Components，通过 `createBrowserClient` 创建：

```typescript
// src/lib/supabase/client.ts
import { createBrowserClient } from '@supabase/ssr'

export function createClient() {
  return createBrowserClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  )
}
```

```tsx
// 在 Client Component 中使用
'use client'
import { createClient } from '@/lib/supabase/client'

function MyComponent() {
  const supabase = createClient()
  // 使用 supabase 进行查询、auth 等操作
}
```

### 1.2 服务端客户端 (Server Client)

用于 Server Components、Server Actions、Route Handlers，通过 `createServerClient` 创建：

```typescript
// src/lib/supabase/server.ts
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function createClient() {
  const cookieStore = await cookies()

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // 在 Server Component 中 setAll 可能失败，这是正常的
            // 因为 Server Component 不能在请求生命周期中间设置 cookies
          }
        },
      },
    }
  )
}
```

### 1.3 客户端使用原则

| 场景 | 客户端类型 | 说明 |
|------|-----------|------|
| Client Component (`'use client'`) | `createBrowserClient` | 浏览器端操作，依赖 cookie |
| Server Component | `createServerClient` | 服务端渲染，读取 cookie |
| Server Actions | `createServerClient` | 服务端执行，可读写 cookie |
| Route Handlers (API) | `createServerClient` | 服务端执行，可读写 cookie |
| Middleware | `createServerClient` | 请求拦截，可读写 cookie |

**关键规则**:
- 永远不要在客户端使用 service role key
- 服务端客户端使用 anon key（不是 service role），RLS 仍然生效
- 两个客户端使用相同的环境变量（anon key），但行为不同

---

## 2. RLS 行级安全策略

### 2.1 基本原则

- **所有暴露给客户端的表必须启用 RLS**: `ALTER TABLE xxx ENABLE ROW LEVEL SECURITY`
- **默认拒绝**: 启用 RLS 后，没有任何策略的表对所有用户都是不可访问的
- **最小权限**: 从最严格的策略开始，按需放宽

### 2.2 常见策略模式

```sql
-- 用户只能访问自己的数据
CREATE POLICY "用户查看自己的记录"
ON journal_entries FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "用户创建自己的记录"
ON journal_entries FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户更新自己的记录"
ON journal_entries FOR UPDATE
USING (auth.uid() = user_id)
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "用户删除自己的记录"
ON journal_entries FOR DELETE
USING (auth.uid() = user_id);
```

### 2.3 策略优化

```sql
-- 在 RLS 策略使用的列上添加索引
CREATE INDEX idx_journal_entries_user_id ON journal_entries(user_id);

-- 多租户场景：通过关联表控制访问
CREATE POLICY "团队成员可访问"
ON shared_entries FOR SELECT
USING (
  entry_id IN (
    SELECT entry_id FROM entry_shares
    WHERE user_id = auth.uid()
  )
);

-- 使用 SECURITY DEFINER 函数简化复杂策略
CREATE OR REPLACE FUNCTION is_team_member(entry_uuid UUID)
RETURNS BOOLEAN AS $$
  SELECT EXISTS (
    SELECT 1 FROM entry_shares
    WHERE entry_id = entry_uuid AND user_id = auth.uid()
  )
$$ LANGUAGE SQL SECURITY DEFINER;
```

### 2.4 RLS 性能最佳实践

- 在策略过滤列上添加索引
- 避免在策略中使用子查询（尽量用 JOIN 或 EXISTS）
- 使用 `auth.uid()` 而不是子查询获取当前用户
- 定期使用 Supabase Security Advisor 审计策略

### 2.5 RLS 测试

```sql
-- 使用 set_config 模拟用户进行测试
SET request.jwt.claims.sub = 'test-user-uuid';
SET ROLE authenticated;
SELECT * FROM journal_entries; -- 应该只看到自己的记录
RESET ROLE;
```

---

## 3. 实时订阅管理

### 3.1 订阅模式

```typescript
// 正确的订阅与清理模式
useEffect(() => {
  const channel = supabase
    .channel(`journal-changes:${userId}`)
    .on(
      'postgres_changes',
      {
        event: '*',
        schema: 'public',
        table: 'journal_entries',
        filter: `user_id=eq.${userId}`,
      },
      (payload) => {
        handleRealtimeChange(payload)
      }
    )
    .subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        console.log('Realtime subscription active')
      }
      if (status === 'CHANNEL_ERROR') {
        console.error('Subscription error')
      }
    })

  // 清理函数 — 防止内存泄漏
  return () => {
    supabase.removeChannel(channel)
  }
}, [userId])
```

### 3.2 清理规则

| 场景 | 清理方式 |
|------|---------|
| React `useEffect` | 在 cleanup 函数中调用 `supabase.removeChannel(channel)` |
| 组件卸载 | 在 `useEffect` cleanup 中清理 |
| 页面切换 | 在路由变化时调用 `supabase.removeAllSubscriptions()` |
| 用户登出 | 调用 `supabase.removeAllSubscriptions()` 再登出 |
| 应用关闭 | `beforeunload` 事件中调用 `supabase.removeAllSubscriptions()` |

### 3.3 防止泄漏的关键规则

- **永远不要在没有 cleanup 的情况下创建订阅**
- **使用稳定的 channel 名称**: 避免每次渲染创建新 channel
- **避免重复订阅**: 先检查是否已有活跃订阅
- **监听错误状态**: 处理 `CHANNEL_ERROR` 和 `TIMED_OUT` 状态
- **限制订阅数量**: 免费版有 channel 数量限制，注意 TooManyChannels 错误

### 3.4 实时优化

```typescript
// 使用 broadcast 代替 postgres_changes 减少数据库压力
const channel = supabase.channel('ui-sync')
  .on('broadcast', { event: 'cursor-move' }, handleCursorMove)
  .subscribe()

// 使用 filter 缩小订阅范围
const channel = supabase
  .channel('entries')
  .on('postgres_changes',
    { event: 'INSERT', table: 'journal_entries', filter: 'user_id=eq.' + userId },
    handleInsert
  )
  .subscribe()
```

---

## 4. Auth Session 处理

### 4.1 获取 Session

```typescript
// Server Component — 从 cookie 获取
export async function createClient() {
  const cookieStore = await cookies()
  return createServerClient(url, anonKey, { cookies: { getAll() { ... }, setAll() { ... } } })
}

// Client Component — 使用 browser client
const supabase = createBrowserClient(url, anonKey)
const { data: { session } } = await supabase.auth.getSession()
```

### 4.2 Auth 状态监听

```typescript
'use client'
import { useEffect } from 'react'
import { createClient } from '@/lib/supabase/client'

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const supabase = createClient()

  useEffect(() => {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      // event: 'SIGNED_IN' | 'SIGNED_OUT' | 'TOKEN_REFRESHED' | 'PASSWORD_RECOVERY' | 'USER_UPDATED'
      if (event === 'SIGNED_IN') {
        // 用户登录，更新状态
      }
      if (event === 'SIGNED_OUT') {
        // 用户登出，清理状态
      }
    })

    // 必须清理！这是常见的内存泄漏来源
    return () => {
      subscription.unsubscribe()
    }
  }, [supabase])

  return children
}
```

### 4.3 Session 刷新

```typescript
// 手动刷新 session（token 即将过期时）
const { data, error } = await supabase.auth.refreshSession()

// 在服务端中间件中自动刷新
// middleware.ts
export async function middleware(request: NextRequest) {
  const supabase = createServerClient(url, anonKey, {
    cookies: { getAll() { ... }, setAll() { ... } }
  })

  // 这将自动检查并刷新 token
  const { data: { session } } = await supabase.auth.getSession()

  // 如果没有 session，重定向到登录页
  if (!session) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  return NextResponse.next()
}
```

### 4.4 关键注意事项

- `getSession()` 在 Server Component 中通过 cookie 自动获取 session
- `onAuthStateChange` 必须在 cleanup 中 unsubscribe
- Server Component 中不要使用 `onAuthStateChange`（服务端不支持事件监听）
- Token 过期时 Supabase 会自动刷新，无需手动处理
- SSR 场景下 cookie 是 session 的唯一来源

---

## 5. 服务端 vs 客户端分离

### 5.1 架构分离

```
src/lib/supabase/
├── client.ts     — createBrowserClient (Client Components)
├── server.ts     — createServerClient (Server Components/Actions)
├── middleware.ts — createServerClient (middleware)
└── types.ts      — 生成的 TypeScript 类型
```

### 5.2 各自的限制

| 特性 | 服务端客户端 | 浏览器客户端 |
|------|------------|------------|
| 读取 session | 通过 cookie | 通过 localStorage + cookie |
| 写入 cookie | 可以（在 route handler/middleware 中） | 自动处理 |
| 实时订阅 | 不支持 | 支持 |
| `onAuthStateChange` | 不支持 | 支持 |
| RLS 保护 | 是（基于 cookie 中的用户） | 是（基于 auth token） |

### 5.3 中间件中的客户端

```typescript
// middleware.ts
import { createServerClient } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(request: NextRequest) {
  let response = NextResponse.next({ request: { headers: request.headers } })

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll()
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => {
            request.cookies.set(name, value)
            response.cookies.set(name, value)
          })
        },
      },
    }
  )

  const { data: { session } } = await supabase.auth.getSession()

  // 保护路由
  if (!session && request.nextUrl.pathname.startsWith('/dashboard')) {
    return NextResponse.redirect(new URL('/auth/login', request.url))
  }

  return response
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)'],
}
```

---

## 6. Service Role Key 安全

### 6.1 绝对规则

- **永远不要将 `SERVICE_ROLE_KEY` 暴露给客户端**
- **永远不要在前端代码、bundle 或浏览器中引用它**
- **仅在服务端受控环境中使用（Edge Functions、受信任的后端）**

### 6.2 危险对比

| Key 类型 | 绕过 RLS | 客户端安全 | 用途 |
|---------|---------|-----------|------|
| `anon` / `public` key | 否 | 可以暴露 | 客户端/服务端通用 |
| `service_role` key | **是** | **绝对不能** | 服务端管理操作 |

### 6.3 环境变量命名规范

```env
# 安全 - 可以在客户端使用 (NEXT_PUBLIC_ 前缀)
NEXT_PUBLIC_SUPABASE_URL=https://xxx.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ...

# 危险 - 仅服务端 (无 NEXT_PUBLIC_ 前缀)
SUPABASE_SERVICE_ROLE_KEY=eyJ...
```

**命名规则**: `NEXT_PUBLIC_` 前缀的变量会暴露到客户端 bundle 中。`SERVICE_ROLE_KEY` 绝对不能有这个前缀。

### 6.4 何时使用 Service Role Key

```typescript
// 仅在 Edge Function 或 Server Action 中使用
// supabase/functions/admin-operation/index.ts
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

Deno.serve(async (req) => {
  const supabaseAdmin = createClient(
    Deno.env.get('SUPABASE_URL')!,
    Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
  )

  // 执行需要绕过 RLS 的管理操作
  const { data, error } = await supabaseAdmin
    .from('journal_entries')
    .delete()
    .eq('user_id', userId)

  return new Response(JSON.stringify({ data, error }))
})
```

**适用场景**:
- 批量管理操作
- 系统级数据清理
- 跨用户数据迁移
- Edge Functions 中的管理端点

### 6.5 如果泄露了怎么办

1. 立即在 Supabase Dashboard 重新生成 key
2. 检查访问日志，确认是否有未授权访问
3. 更新所有服务端环境变量
4. 不要在 Git 历史中留下 service role key（使用 `.gitignore` + `.env`）

---

## 7. 查询模式

### 7.1 基础查询

```typescript
// 基础查询
const { data, error } = await supabase
  .from('journal_entries')
  .select('id, title, content, mood, created_at')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })

// 链式过滤
const { data } = await supabase
  .from('journal_entries')
  .select('*')
  .eq('user_id', userId)
  .gte('created_at', '2025-01-01')
  .lt('created_at', '2025-04-01')
  .ilike('title', '%关键词%')
  .in('mood', ['happy', 'excited'])
  .is('deleted_at', null)
  .order('created_at', { ascending: false })
  .range(0, 19)
```

### 7.2 关联查询 (Joins)

```typescript
// 一对多：获取日记及其评论
const { data } = await supabase
  .from('journal_entries')
  .select(`
    id,
    title,
    content,
    comments (
      id,
      content,
      created_at,
      profiles (display_name, avatar_url)
    )
  `)
  .eq('user_id', userId)

// 多对一：通过外键获取关联数据
const { data } = await supabase
  .from('comments')
  .select(`
    id,
    content,
    journal_entries (title, created_at),
    profiles (display_name)
  `)
  .eq('user_id', userId)
```

### 7.3 分页

```typescript
// 推荐：基于游标的分页 (Cursor-based)
const PAGE_SIZE = 20
const { data } = await supabase
  .from('journal_entries')
  .select('id, title, created_at')
  .eq('user_id', userId)
  .order('created_at', { ascending: false })
  .limit(PAGE_SIZE)

// 下一页 — 使用最后一条记录的 created_at 作为游标
const { data: nextPage } = await supabase
  .from('journal_entries')
  .select('id, title, created_at')
  .eq('user_id', userId)
  .lt('created_at', lastItem.created_at)
  .order('created_at', { ascending: false })
  .limit(PAGE_SIZE)

// 避免使用 OFFSET 分页（深层页性能差）
// .range(offset, offset + PAGE_SIZE - 1) // 不推荐用于大数据集
```

### 7.4 计数与聚合

```typescript
// 获取总数（与数据一起）
const { data, count, error } = await supabase
  .from('journal_entries')
  .select('*', { count: 'exact', head: false })
  .eq('user_id', userId)

// 仅获取计数
const { count } = await supabase
  .from('journal_entries')
  .select('*', { count: 'exact', head: true })
  .eq('user_id', userId)
```

### 7.5 Upsert 模式

```typescript
// 存在则更新，不存在则插入
const { data, error } = await supabase
  .from('journal_entries')
  .upsert(
    { id: entryId, title, content, user_id: userId },
    { onConflict: 'id', ignoreDuplicates: false }
  )
  .select()
  .single()
```

### 7.6 查询性能要点

- 在常用过滤列上添加索引
- 只选择需要的列（不要总是 `select('*')`）
- 使用游标分页代替 OFFSET
- 关联查询会增加查询复杂度，避免嵌套过深
- 使用 `.single()` 或 `.maybeSingle()` 当预期只有一条记录时

---

## 8. 离线优先与 IndexedDB 同步

### 8.1 架构概览

```
┌─────────────────────────────────────────┐
│              Client (Browser)            │
│  ┌──────────────┐    ┌────────────────┐  │
│  │  UI Layer    │◄──►│  IndexedDB     │  │
│  │  (React)     │    │  (localforage) │  │
│  └──────────────┘    └───────┬────────┘  │
│                              │           │
│                    ┌─────────▼────────┐  │
│                    │  Sync Manager    │  │
│                    │  - Queue         │  │
│                    │  - Retry logic   │  │
│                    │  - Conflict res. │  │
│                    └─────────┬────────┘  │
└──────────────────────────────┼──────────┘
                               │
                    ┌──────────▼──────────┐
                    │   Supabase (Cloud)   │
                    │   PostgreSQL + RLS   │
                    └─────────────────────┘
```

### 8.2 本地存储模式

```typescript
// src/lib/sync-manager.ts
import { createClient } from '@/lib/supabase/client'

interface SyncQueueItem {
  id: string
  operation: 'INSERT' | 'UPDATE' | 'DELETE'
  table: string
  data: Record<string, unknown>
  timestamp: number
  retryCount: number
}

class SyncManager {
  private queue: SyncQueueItem[] = []
  private syncing = false

  // 离线时加入队列
  async queueOperation(item: Omit<SyncQueueItem, 'id' | 'timestamp' | 'retryCount'>) {
    const queueItem: SyncQueueItem = {
      ...item,
      id: crypto.randomUUID(),
      timestamp: Date.now(),
      retryCount: 0,
    }

    // 持久化到 IndexedDB
    await this.saveToIndexedDB(queueItem)
    this.queue.push(queueItem)

    // 尝试同步
    this.trySync()
  }

  // 在线时同步
  async trySync() {
    if (this.syncing || this.queue.length === 0 || !navigator.onLine) return

    this.syncing = true
    const supabase = createClient()

    while (this.queue.length > 0) {
      const item = this.queue[0]

      try {
        const { error } = await this.executeOperation(supabase, item)

        if (error) throw error

        // 成功 — 从队列移除
        this.queue.shift()
        await this.removeFromIndexedDB(item.id)
      } catch (err) {
        // 失败 — 增加重试计数
        item.retryCount++
        if (item.retryCount >= 3) {
          // 超过最大重试次数，标记为失败
          item.status = 'FAILED'
          await this.saveToIndexedDB(item)
          this.queue.shift()
        }
        break // 停止同步，等待下次尝试
      }
    }

    this.syncing = false
  }

  private async executeOperation(supabase: any, item: SyncQueueItem) {
    switch (item.operation) {
      case 'INSERT':
        return await supabase.from(item.table).insert(item.data)
      case 'UPDATE':
        return await supabase.from(item.table).update(item.data).eq('id', item.data.id)
      case 'DELETE':
        return await supabase.from(item.table).delete().eq('id', item.data.id)
    }
  }
}
```

### 8.3 网络状态监听

```typescript
// 监听网络变化
useEffect(() => {
  const handleOnline = () => syncManager.trySync()
  const handleOffline = () => console.log('App is offline, queuing operations')

  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)

  return () => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  }
}, [])
```

### 8.4 冲突解决策略

```typescript
// 策略 1: 最后写入胜出 (LWW) — 使用 updated_at 时间戳
const conflictResolution = (local: Record, remote: Record) => {
  return local.updated_at > remote.updated_at ? local : remote
}

// 策略 2: 合并字段
const mergeConflict = (local: Record, remote: Record) => {
  return {
    ...remote,
    ...local,
    // 特殊处理冲突字段
    content: local.content !== remote.content
      ? `${local.content}\n---\n[Conflict resolved: ${new Date().toISOString()}]`
      : local.content,
  }
}
```

### 8.5 实时同步 + 离线队列

```typescript
// 结合实时订阅和离线队列
useEffect(() => {
  const channel = supabase
    .channel('journal-sync')
    .on('postgres_changes',
      { event: '*', schema: 'public', table: 'journal_entries' },
      async (payload) => {
        if (!navigator.onLine) {
          // 离线时收到的变更 — 存入 IndexedDB
          await saveToIndexedDB(payload.new)
          return
        }

        // 在线时直接更新本地状态
        if (payload.eventType === 'DELETE') {
          store.deleteEntry(payload.old.id)
        } else {
          store.upsertEntry(payload.new)
        }
      }
    )
    .subscribe()

  return () => {
    supabase.removeChannel(channel)
  }
}, [])
```

### 8.6 推荐工具

| 工具 | 用途 | 说明 |
|------|------|------|
| `idb` | IndexedDB 封装 | 轻量 Promise-based API |
| `localforage` | IndexedDB 简单存储 | 类似 localStorage 的 API |
| `RxDB` | 完整的离线优先数据库 | 内置 Supabase 复制插件 |
| 自定义 SyncManager | 灵活控制 | 适合项目特定需求 |

---

## 9. TypeScript 类型生成

### 9.1 生成类型

```bash
# 从远程项目生成
npx supabase gen types typescript --project-id <your-project-id> > src/lib/supabase/types.ts

# 从本地数据库生成 (本地开发)
npx supabase gen types typescript --local > src/lib/supabase/types.ts
```

### 9.2 CI/CD 自动化

```yaml
# .github/workflows/generate-types.yml
name: Generate Supabase Types
on:
  push:
    paths:
      - 'supabase/migrations/**'

jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: supabase/setup-cli@v1
      - run: supabase db start
      - run: supabase gen types typescript --local > src/lib/supabase/types.ts
      - uses: stefanzweifel/git-auto-commit-action@v5
        with:
          commit_message: 'chore: regenerate Supabase types'
          file_pattern: 'src/lib/supabase/types.ts'
```

### 9.3 在项目中使用

```typescript
import type { Database } from '@/lib/supabase/types'

// 带类型约束的查询
const { data, error } = await supabase
  .from('journal_entries')
  .select('id, title, mood')
  .eq('user_id', userId)
  .returns<Database['public']['Tables']['journal_entries']['Row']>()

// 插入类型
type NewEntry = Database['public']['Tables']['journal_entries']['Insert']
const newEntry: NewEntry = {
  title: 'My Entry',
  content: 'Hello world',
  user_id: userId,
  mood: 'happy',
}
```

### 9.4 类型生成最佳实践

- **每次迁移后重新生成类型**: 将类型生成纳入开发流程
- **提交生成的类型文件**: 确保团队成员使用一致的类型
- **CI 自动更新**: 使用 GitHub Actions 在迁移推送后自动重新生成
- **不要手动修改生成的类型文件**: 所有更改应通过迁移完成
- **使用 `returns<>()` 指定返回类型**: 让查询结果有完整的类型推断

---

## 10. 常见陷阱与反模式

### 10.1 内存泄漏

```typescript
// 错误 — 没有清理订阅
useEffect(() => {
  supabase.channel('my-channel').on('postgres_changes', handler).subscribe()
}, [])

// 正确 — 清理订阅
useEffect(() => {
  const channel = supabase.channel('my-channel').on('postgres_changes', handler).subscribe()
  return () => {
    supabase.removeChannel(channel)
  }
}, [])

// 错误 — Auth 状态监听没有清理
const { data } = supabase.auth.onAuthStateChange(callback)
// 缺少: return () => { data.subscription.unsubscribe() }
```

### 10.2 客户端反模式

```typescript
// 错误 — 在组件内创建客户端实例（每次渲染都创建新实例）
function MyComponent() {
  const supabase = createClient() // 每次渲染都创建新的！
  // ...
}

// 正确 — 使用工厂函数或模块级单例
const supabase = createClient() // 模块级，只创建一次
export { supabase }

// 或在工厂函数中（推荐用于 SSR）
export function createClient() {
  return createBrowserClient(url, anonKey)
}
```

### 10.3 查询反模式

```typescript
// 错误 — 在循环中查询
for (const id of ids) {
  const { data } = await supabase.from('entries').select().eq('id', id)
}

// 正确 — 使用 in
const { data } = await supabase
  .from('entries')
  .select()
  .in('id', ids)

// 错误 — 总是 select('*')
const { data } = await supabase.from('entries').select('*')

// 正确 — 只选择需要的列
const { data } = await supabase.from('entries').select('id, title, created_at')
```

### 10.4 Auth 反模式

```typescript
// 错误 — 在 Server Component 中使用 onAuthStateChange
export default async function Page() {
  const supabase = await createClient()
  supabase.auth.onAuthStateChange(...) // 不支持！
}

// 错误 — 在客户端硬编码 service role key
const supabase = createClient(url, process.env.SUPABASE_SERVICE_ROLE_KEY) // 危险！

// 正确 — Server Component 中使用 getUser
export default async function Page() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
}
```

### 10.5 RLS 反模式

```sql
-- 错误 — 完全禁用 RLS
ALTER TABLE journal_entries DISABLE ROW LEVEL SECURITY;

-- 错误 — 允许所有人访问
CREATE POLICY "allow all" ON journal_entries FOR ALL USING (true);

-- 错误 — 策略中缺少 auth.uid() 检查
CREATE POLICY "view entries" ON journal_entries FOR SELECT USING (true);

-- 正确 — 限制用户只能访问自己的数据
CREATE POLICY "view own entries" ON journal_entries
  FOR SELECT USING (auth.uid() = user_id);
```

### 10.6 错误处理反模式

```typescript
// 错误 — 不检查 error
const { data } = await supabase.from('entries').select()
console.log(data.title) // 如果出错，data 可能是 undefined

// 正确 — 总是检查 error
const { data, error } = await supabase.from('entries').select()
if (error) {
  console.error('Supabase query failed:', error.message, error.code)
  throw error
}
```

### 10.7 其他常见陷阱

| 陷阱 | 后果 | 解决方案 |
|------|------|---------|
| 不使用 RLS | 数据泄露 | 所有表启用 RLS |
| 在客户端使用 service role key | 完全绕过 RLS | 永远只用 anon key |
| 不清理订阅 | 内存泄漏、TooManyChannels 错误 | useEffect cleanup |
| 不生成 TypeScript 类型 | 运行时错误、失去类型安全 | 每次迁移后重新生成 |
| OFFSET 分页深层页 | 性能急剧下降 | 使用游标分页 |
| 不在过滤列上加索引 | 慢查询、RLS 性能差 | 添加适当索引 |
| 忽略网络状态 | 离线时操作失败 | 实现离线队列 |

---

## 参考资源

- [Supabase SSR 指南](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
- [RLS 官方文档](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [RLS 性能最佳实践](https://supabase.com/docs/guides/troubleshooting/rls-performance-and-best-practices-Z5Jjwv)
- [实时订阅文档](https://supabase.com/docs/guides/realtime)
- [TypeScript 类型生成](https://supabase.com/docs/guides/api/rest/generating-types)
- [查询优化文档](https://supabase.com/docs/guides/database/query-optimization)
- [API Keys 安全](https://supabase.com/docs/guides/api/api-keys)
- [安全最佳实践](https://supaexplorer.com/guides/supabase-security-best-practices)
- [Supabase Security Retro 2025](https://supabase.com/blog/supabase-security-2025-retro)
- [Next.js Auth 2025 指南](https://mohamedkadi.com/blog/nextjs-supabase-auth-2025)
- [RLS 生产模式](https://makerkit.dev/blog/tutorials/supabase-rls-best-practices)
- [Offline-First PWA with IndexedDB](https://oluwadaprof.medium.com/building-an-offline-first-pwa-notes-app-with-next-js-indexeddb-and-supabase-f861aa3a06f9)
