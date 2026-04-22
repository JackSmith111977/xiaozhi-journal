# Zustand v5 编码标准

> 本项目：`xiaozhi-journal` (Zustand `^5.0.12`, Next.js `16.2.3`, React `19.2.4`)
>
> 适用范围：`src/store/` 目录下所有状态管理文件

---

## 目录

1. [单 Store + Slice 模式](#1-单-store--slice-模式)
2. [Selector 最佳实践](#2-selector-最佳实践)
3. [异步 Action 与 AbortController](#3-异步-action-与-abortcontroller)
4. [Persist Middleware 与 IndexedDB](#4-persist-middleware-与-indexeddb)
5. [SSR / Next.js 16 安全](#5-ssr--nextjs-16-安全)
6. [TypeScript 模式](#6-typescript-模式)
7. [禁止的反模式](#7-禁止的反模式)
8. [Code Review 检查清单](#8-code-review-检查清单)

---

## 1. 单 Store + Slice 模式

### 规则

- **必须**使用单一 `create()` 调用，通过 slice pattern 组织不同功能域（auth / journal / sync）
- **禁止**创建多个 `create()` 实例后互相 import（当前 `src/store/auth.ts` 和 `src/store/journal.ts` 的问题）
- **必须**使用 `set()` 的函数形式更新依赖先前状态的字段

### 为什么

当前项目存在跨 store 调用问题：`src/store/auth.ts` 第 4 行 import 了 `useJournalStore`，并在 `initialize()` 中调用 `useJournalStore.getState().startRealtimeSubscription()`。这种 cross-store import 在 slice 合并后可以完全消除。

### 正确模式

```typescript
// src/store/index.ts — 单一 root store
import { create } from 'zustand'
import type { StateCreator } from 'zustand'
import type { User } from '@supabase/supabase-js'
import type { Journal, AIResponse } from '@/types'

// ===== Slice Types =====

interface AuthSlice {
  user: User | null
  authLoading: boolean
  isAuthenticated: boolean
  setUser: (user: User | null) => void
  initializeAuth: () => void
}

interface JournalSlice {
  journals: Journal[]
  journalLoading: boolean
  error: string | null
  selectedMood: number | null
  draftContent: string
  fetchJournals: () => Promise<void>
  addJournal: (journal: Journal) => Promise<void>
  setSelectedMood: (mood: number | null) => void
  setDraftContent: (content: string) => void
  setError: (error: string | null) => void
}

interface SyncSlice {
  isOnline: boolean
  isSyncing: boolean
  pendingMessage: string | null
  initOfflineSync: () => void
  stopOfflineSync: () => void
}

// ===== Combined State =====
type AppState = AuthSlice & JournalSlice & SyncSlice

// ===== Slice Creators =====

const createAuthSlice: StateCreator<AppState, [], [], AuthSlice> = (set) => ({
  user: null,
  authLoading: true,
  isAuthenticated: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),

  initializeAuth: () => {
    set({ authLoading: true })
    // auth 逻辑直接调用 set() 更新本 slice 状态
    // journal / sync 操作通过 set() 更新对应 slice
  },
})

const createJournalSlice: StateCreator<AppState, [], [], JournalSlice> = (set) => ({
  journals: [],
  journalLoading: false,
  error: null,
  selectedMood: null,
  draftContent: '',

  fetchJournals: async () => {
    set({ journalLoading: true })
    // 异步逻辑见第 3 节 AbortController 模式
  },

  addJournal: (journal) => {
    set({ error: null })
    set((state) => ({
      journals: [journal, ...state.journals],
      draftContent: '',
      selectedMood: null,
    }))
  },

  setSelectedMood: (mood) => set({ selectedMood: mood }),
  setDraftContent: (content) => set({ draftContent: content }),
  setError: (error) => set({ error }),
})

const createSyncSlice: StateCreator<AppState, [], [], SyncSlice> = (set, get) => ({
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  isSyncing: false,
  pendingMessage: null,

  initOfflineSync: () => {
    const onlineHandler = () => {
      set({ isOnline: true, pendingMessage: null })
      // 触发 pending 同步
    }
    const offlineHandler = () => set({ isOnline: false })
    window.addEventListener('online', onlineHandler)
    window.addEventListener('offline', offlineHandler)
    // 返回值必须在组件 cleanup 中调用
    return () => {
      window.removeEventListener('online', onlineHandler)
      window.removeEventListener('offline', offlineHandler)
    }
  },

  stopOfflineSync: () => {
    set({ pendingMessage: null })
  },
})

// ===== Store Creation =====

export const useAppStore = create<AppState>()((...args) => ({
  ...createAuthSlice(...args),
  ...createJournalSlice(...args),
  ...createSyncSlice(...args),
}))
```

### 错误模式（当前代码中的问题）

```typescript
// ❌ src/store/auth.ts — 跨 store import
import { useJournalStore } from './journal'  // 禁止！

export const useAuthStore = create<AuthState>((set) => ({
  initialize: () => {
    // ❌ 跨 store 调用 getState()
    useJournalStore.getState().startRealtimeSubscription()
    useJournalStore.getState().initOfflineSync()
  },
}))
```

```typescript
// ❌ src/store/journal.ts — 独立 store + module-level 可变状态
let onOnlineHandler: (() => void) | null = null  // 禁止！
let onOfflineHandler: (() => void) | null = null  // 禁止！

export const useJournalStore = create<JournalState & JournalActions>((set) => ({
  // 独立 store 无法与 auth slice 共享状态
}))
```

---

## 2. Selector 最佳实践

### 规则

- **必须**使用内联 selector 时返回基本类型或单个字段
- **必须**在需要多个字段时使用 `useShallow` 避免不必要的重渲染
- **禁止**在 selector 中执行计算 / 派生逻辑（使用 `useMemo` 或在 store 中预计算）
- **禁止**使用匿名对象作为 selector 返回值（每次 render 返回新引用）

### 正确模式

```typescript
import { useShallow } from 'zustand/react/shallow'
import { useAppStore } from '@/store'

// ✅ 单个字段 — 最轻量
const isOnline = useAppStore((state) => state.isOnline)
const user = useAppStore((state) => state.user)

// ✅ 多个字段 — 必须使用 useShallow
const { journals, journalLoading } = useAppStore(
  useShallow((state) => ({
    journals: state.journals,
    journalLoading: state.journalLoading,
  }))
)

// ✅ 带条件的 selector
const journalCount = useAppStore((state) => state.journals.length)
const hasDraft = useAppStore((state) => state.draftContent.length > 0)
```

### 错误模式

```typescript
// ❌ 每次渲染返回新对象引用，导致组件重渲染
const { journals, loading } = useAppStore((state) => ({
  journals: state.journals,
  loading: state.journalLoading,
}))

// ❌ 在 selector 中做计算
const recentJournals = useAppStore((state) =>
  state.journals.filter((j) =>
    new Date(j.timestamp) > Date.now() - 7 * 24 * 60 * 60 * 1000
  )
)

// ❌ 订阅了整个 store，任何 state 变化都触发重渲染
const state = useAppStore()
```

### 订阅过度（Over-subscription）规则

| 场景 | 推荐做法 |
|------|----------|
| 只需要 1-2 个字段 | 内联 selector，不用 `useShallow` |
| 需要 3+ 个字段 | 使用 `useShallow` |
| 需要派生数据 | `useMemo` + 基础 selector，或在 store 中预计算 |
| 需要整份 state | 禁止 — 重构为更细粒度的 selector |

---

## 3. 异步 Action 与 AbortController

### 规则

- **必须**为所有可能被中断的异步 action 添加 `AbortController`
- **必须**在异步操作完成后检查组件是否已卸载 / action 是否已被取消
- **禁止**使用 fire-and-forget 的 `await` 而不处理取消（当前 `fetchJournals` / `addJournal` 的问题）
- **推荐**在 slice 中持有 `abortRef` 引用以支持跨 action 取消

### 为什么

当前 `src/store/journal.ts` 的 `fetchJournals` 和 `addJournal` 都是异步 action，但没有取消机制。用户在页面快速切换或组件卸载时，过期的 `set()` 调用可能导致内存泄漏或状态不一致。

### 正确模式

```typescript
interface AsyncJournalSlice {
  fetchAbortRef: { current: AbortController | null }
  fetchJournals: () => Promise<void>
  cancelFetch: () => void
}

const createAsyncJournalSlice: StateCreator<AppState, [], [], AsyncJournalSlice> = (set, get) => ({
  fetchAbortRef: { current: null },

  fetchJournals: async () => {
    // 取消进行中的请求
    get().cancelFetch()

    const controller = new AbortController()
    set({ fetchAbortRef: { current: controller }, journalLoading: true })

    try {
      const journals = await getJournals({ signal: controller.signal })

      // 检查是否已被取消
      if (controller.signal.aborted) return

      set({ journals, journalLoading: false, fetchAbortRef: { current: null } })
    } catch (err) {
      if (controller.signal.aborted) return
      if (err instanceof DOMException && err.name === 'AbortError') return

      set({
        error: '加载失败',
        journalLoading: false,
        fetchAbortRef: { current: null },
      })
    }
  },

  cancelFetch: () => {
    const current = get().fetchAbortRef.current
    if (current) {
      current.abort()
      set({ fetchAbortRef: { current: null } })
    }
  },
})
```

### 带超时的异步 Action 模式

```typescript
addJournal: async (journal: Journal) => {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), 10000) // 10s 超时

  set({ error: null })

  try {
    const offlineJournal = { ...journal, status: 'pending' as const }
    await dbAdd(offlineJournal, { signal: controller.signal })
    clearTimeout(timeoutId)

    set((state) => ({
      journals: [offlineJournal, ...state.journals],
      draftContent: '',
      selectedMood: null,
    }))
  } catch (err) {
    clearTimeout(timeoutId)
    if (err instanceof DOMException && err.name === 'AbortError') {
      set({ error: '操作超时，请重试' })
      return
    }
    set({ error: '保存失败' })
  }
}
```

### 错误模式（当前代码）

```typescript
// ❌ src/store/journal.ts:59-67 — 无取消机制
fetchJournals: async () => {
  set({ loading: true })
  try {
    const journals = await getJournals()  // 无法取消
    set({ journals, loading: false })
  } catch (err) {
    set({ error: '加载失败', loading: false })
  }
}

// ❌ src/store/journal.ts:88-98 — fire-and-forget 无取消
set({ isSyncing: true })
try {
  await syncToSupabase([offlineJournal])  // 无法取消
  set({ pendingMessage: null })
} catch (err) {
  console.warn('[Store] syncToSupabase failed...')
} finally {
  set({ isSyncing: false })  // 即使组件已卸载也会执行
}
```

---

## 4. Persist Middleware 与 IndexedDB

### 规则

- **必须**使用 `persist` middleware 替代手动 IndexedDB 读写
- **必须**使用 `idb-keyval` 作为 storage 后端（项目已有 `idb` 依赖）
- **必须**配置 `partialize` 仅持久化必要字段
- **必须**在 schema 变更时提供 `migrate` 函数
- **禁止**在 `src/lib/db.ts` 中手动维护 offline / pending 状态

### 为什么

当前项目通过 `src/lib/db.ts` 手动实现 IndexedDB 存取，配合 `status: 'pending'` 字段追踪离线状态。使用 `persist` middleware 可以：
1. 自动序列化 / 反序列化
2. 提供版本迁移机制
3. 与 Zustand 状态管理统一

### 正确模式

```typescript
// src/store/index.ts
import { persist, createJSONStorage } from 'zustand/middleware'
import { get, set, del } from 'idb-keyval'

// idb-keyval 适配 Zustand persist storage 接口
const idbStorage = {
  getItem: async (name: string): Promise<string | null> => {
    const value = await get(name)
    return value ?? null
  },
  setItem: async (name: string, value: string): Promise<void> => {
    await set(name, value)
  },
  removeItem: async (name: string): Promise<void> => {
    await del(name)
  },
}

export const useAppStore = create<AppState>()(
  persist(
    (...args) => ({
      ...createAuthSlice(...args),
      ...createJournalSlice(...args),
      ...createSyncSlice(...args),
    }),
    {
      name: 'xiaozhi-journal-storage',
      storage: createJSONStorage(() => idbStorage),

      // 仅持久化必要数据，排除 loading / error / AI 等待状态
      partialize: (state) => ({
        journals: state.journals,
        draftContent: state.draftContent,
        selectedMood: state.selectedMood,
        user: state.user,
      }),

      // 版本迁移
      version: 1,
      migrate: (persistedState, version) => {
        const state = persistedState as Record<string, unknown>

        if (version === 0) {
          // v0 → v1: 将旧的 pending 状态转换为新格式
          if (Array.isArray(state.journals)) {
            state.journals = (state.journals as any[]).map((j) => ({
              ...j,
              status: j.status ?? 'pending',
              shareCount: j.shareCount ?? 0,
            }))
          }
        }

        return state as AppState
      },

      // 可选：合并 persisted state 与默认 state
      merge: (persistedState, currentState) => {
        const merged = { ...currentState, ...(persistedState as Partial<AppState>) }
        // 确保数组类型安全
        if (!Array.isArray(merged.journals)) merged.journals = []
        return merged
      },
    }
  )
)
```

### 错误模式

```typescript
// ❌ 手动管理 IndexedDB + 手动同步 — 应使用 persist middleware
// src/lib/db.ts 中的 getJournals / addJournal / getPendingJournals 等
// 全部可以被 persist middleware 替代

// ❌ 不 partialize — 把 loading/error 也持久化
// 导致页面刷新后显示 loading: true 的死锁状态
persist(
  (...args) => ({ ... }),
  {
    name: 'my-store',
    // ❌ 缺少 partialize — 所有字段都被持久化
  }
)
```

### Pending 同步的替代方案

使用 `persist` 后，offline pending 同步改为：

```typescript
// 方案 A：在 persist 的 onRehydrateStorage 中触发
persist(
  (...args) => ({ ... }),
  {
    name: 'xiaozhi-journal-storage',
    storage: createJSONStorage(() => idbStorage),
    partialize: (state) => ({ journals: state.journals }),
    onRehydrateStorage: () => (state, error) => {
      if (!error && state?.isOnline) {
        syncPendingJournals(state.journals)
      }
    },
  }
)

// 方案 B：在 online handler 中手动比较 persisted state
initOfflineSync: () => {
  const onlineHandler = () => {
    set({ isOnline: true, pendingMessage: null })
    // 使用 get() 获取最新 journals，筛选 pending 状态
    const { journals } = get()
    const pending = journals.filter((j) => j.status === 'pending')
    if (pending.length > 0) {
      syncToSupabase(pending)
    }
  }
  // ...
}
```

---

## 5. SSR / Next.js 16 安全

### 规则

- **必须**使用 `skipHydration: true` 包裹所有包含浏览器 API 的初始化状态
- **禁止**在 `create()` 初始化时直接访问 `navigator` / `window`（除非用 `typeof` 守卫）
- **必须**将副作用（订阅 / 事件监听）放在 `useEffect` 中，而非 store 初始化
- **推荐**使用 Zustand v5 的 `useStore` 函数式 API 替代 hook 调用

### 为什么

Next.js 16 的服务端渲染在服务端执行时无法访问 `navigator` / `window`。当前代码中 `src/store/journal.ts` 第 56 行：

```typescript
isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
```

虽然有 `typeof` 守卫，但会导致服务端和客户端 hydration 值不一致（服务端是 `true`，客户端可能是 `false`）。

### 正确模式

```typescript
// 方案 A：skipHydration — 跳过 hydration 匹配，直接使用客户端值
import { useStore } from 'zustand'
import { useAppStore } from '@/store'

function MyComponent() {
  const isOnline = useStore(useAppStore, (state) => state.isOnline, {
    skipHydration: true,
  })
  // ...
}

// 方案 B：默认值 + useEffect 修正
const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(true) // 服务端默认

  useEffect(() => {
    setIsOnline(navigator.onLine)
    const onOnline = () => setIsOnline(true)
    const onOffline = () => setIsOnline(false)
    window.addEventListener('online', onOnline)
    window.addEventListener('offline', onOffline)
    return () => {
      window.removeEventListener('online', onOnline)
      window.removeEventListener('offline', onOffline)
    }
  }, [])

  return isOnline
}

// 方案 C：在 store 中使用 skipHydration
const createSyncSlice: StateCreator<AppState, [], [], SyncSlice> = (set, get) => ({
  isOnline: true, // 默认值，hydration 时会被 skip
  // ...
})

// 消费时使用 skipHydration 选项
const isOnline = useStore(useAppStore, (s) => s.isOnline, { skipHydration: true })
```

### 副作用管理

```typescript
// ✅ 副作用放在组件中
function useJournalRealtime() {
  const startRealtime = useAppStore((s) => s.startRealtimeSubscription)
  const stopRealtime = useAppStore((s) => s.stopRealtimeSubscription)

  useEffect(() => {
    startRealtime()
    return () => stopRealtime()
  }, [startRealtime, stopRealtime])
}

function useOfflineSync() {
  const initSync = useAppStore((s) => s.initOfflineSync)
  const stopSync = useAppStore((s) => s.stopOfflineSync)

  useEffect(() => {
    const cleanup = initSync()
    return () => {
      if (typeof cleanup === 'function') cleanup()
      else stopSync()
    }
  }, [initSync, stopSync])
}
```

### 错误模式（当前代码）

```typescript
// ❌ src/store/auth.ts:32-83 — initialize() 在渲染时调用，包含大量副作用
initialize: () => {
  if (initialized) return  // module-level 标志
  initialized = true

  // ❌ 直接调用 supabase.auth.getSession() — 应包裹在 useEffect 中
  const sessionPromise = supabase.auth.getSession()
  // ...

  // ❌ 直接注册 onAuthStateChange — 没有 cleanup 机制
  const { data: { subscription } } = supabase.auth.onAuthStateChange(...)
}
```

---

## 6. TypeScript 模式

### 规则

- **必须**使用 `StateCreator<TState, [], [], TSlice>` 为每个 slice 标注类型
- **必须**在 `create<T>()` 中显式指定泛型参数
- **禁止**使用 `any` 或 `unknown` 绕过类型检查
- **必须**使用 `get()` 函数获取最新 state，而非直接闭包引用

### 正确模式

```typescript
import type { StateCreator } from 'zustand'
import { create } from 'zustand'

interface MySlice {
  count: number
  increment: () => void
}

// ✅ Slice 类型标注
const createMySlice: StateCreator<AppState, [], [], MySlice> = (set, get) => ({
  count: 0,
  increment: () => set((state) => ({ count: state.count + 1 })),
})

// ✅ Store 创建时显式指定泛型
export const useAppStore = create<AppState>()((...args) => ({
  ...createMySlice(...args),
  ...createOtherSlice(...args),
}))

// ✅ middleware 类型组合
type PersistedState = PersistState<AppState, Pick<AppState, 'journals' | 'draftContent'>>
```

### `set()` 的函数形式

```typescript
// ✅ 正确：依赖先前状态时使用函数形式
set((state) => ({
  journals: [newJournal, ...state.journals],
}))

// ❌ 错误：闭包引用可能在批量更新时过期
const currentJournals = get().journals
set({ journals: [newJournal, ...currentJournals] })

// ✅ 正确：不依赖先前状态时可直接传对象
set({ loading: false, error: null })
```

### 错误模式（当前代码）

```typescript
// ❌ src/store/journal.ts:47 — 缺少显式泛型
export const useJournalStore = create<JournalState & JournalActions>((set) => ({
  // 应该写成
}))
// ✅ 应改为
export const useJournalStore = create<JournalState & JournalActions>()((set) => ({

// ❌ src/store/auth.ts:22 — 缺少显式泛型
export const useAuthStore = create<AuthState>((set) => ({
  // 应该写成
}))
// ✅ 应改为
export const useAuthStore = create<AuthState>()((set) => ({
```

---

## 7. 禁止的反模式

### 7.1 循环依赖（Circular Dependencies）

**当前问题**：`src/store/auth.ts` import `src/store/journal.ts`。如果 `journal.ts` 的某个 action 需要 auth 状态，就会形成循环依赖。

**规则**：
- **禁止** store 之间互相 import
- **必须**通过单 store slice pattern 消除跨 store 引用
- **必须**使用 `get()` 在同 store 内访问其他 slice 的状态

### 7.2 Module-level 可变状态

**当前问题文件**：

| 文件 | 变量 | 问题 |
|------|------|------|
| `src/store/auth.ts:18-19` | `activeSubscription`, `initialized` | 签名登出后重置，但 race condition 下 `initialize()` 可能被多次调用 |
| `src/store/journal.ts:13-14` | `onOnlineHandler`, `onOfflineHandler` | 全局可变引用，多实例下互相覆盖 |
| `src/lib/realtime.ts:5` | `channel` | 全局可变引用，多订阅者场景不安全 |
| `src/lib/sync-manager.ts:3` | `syncing` | 全局标志，无法追踪具体哪个操作在同步 |

**规则**：
- **禁止**在 store 文件顶层声明可变 `let` 变量
- **必须**将可变状态放入 store 内部（作为 state 字段）
- **必须**使用 `useEffect` 的 cleanup 函数管理订阅生命周期
- **推荐**使用 `useRef` 持有需要跨 render 保持的引用

```typescript
// ❌ 禁止：module-level 可变状态
let initialized = false
let activeSubscription: Subscription | null = null

export const useAuthStore = create<AuthState>((set) => ({
  initialize: () => {
    if (initialized) return
    initialized = true
    // ...
  },
}))

// ✅ 推荐：状态放在 store 内部
interface AuthSlice {
  isInitialized: boolean
  activeSubscription: Subscription | null
  initialize: () => void
}

const createAuthSlice: StateCreator<AppState, [], [], AuthSlice> = (set, get) => ({
  isInitialized: false,
  activeSubscription: null,

  initialize: () => {
    if (get().isInitialized) return
    set({ isInitialized: true })
    // ...
  },
})
```

### 7.3 跨 Store Import

```typescript
// ❌ 禁止
import { useJournalStore } from './journal'
import { useAuthStore } from './auth'

// ✅ 推荐 — 单 store
import { useAppStore } from '@/store'
const user = useAppStore((s) => s.user)
const journals = useAppStore((s) => s.journals)
```

### 7.4 Debug console.log 残留

**当前问题**：`src/store/journal.ts` 包含 8 行 `console.log` 调试语句（第 2, 4, 6, 8, 10 行的 module loading 日志）。

**规则**：
- **禁止**在提交的代码中保留 `console.log` 调试语句
- **推荐**使用 `console.warn` / `console.error` 记录真正的异常
- **推荐**使用 `process.env.NODE_ENV === 'development'` 守卫开发日志

```typescript
// ❌ 禁止
console.log('[Journal] store module loading')
console.log('[Journal] db imported')

// ✅ 推荐
if (process.env.NODE_ENV === 'development') {
  console.debug('[Journal] store initialized')
}

// ✅ 允许：错误和警告
console.error('[Store] syncToSupabase failed:', err)
console.warn('[Store] offline journal remains pending')
```

### 7.5 在 Action 中调用其他 Store 的 getState

```typescript
// ❌ 禁止 — auth store 调用 journal store 的 action
useJournalStore.getState().startRealtimeSubscription()

// ✅ 推荐 — 单 store 内部通过 get() 访问
const createAuthSlice: StateCreator<AppState, [], [], AuthSlice> = (set, get) => ({
  initialize: () => {
    // 同 store 内通过 get() 访问其他 slice 的方法
    get().startRealtimeSubscription()
  },
})
```

### 7.6 直接修改 State

```typescript
// ❌ 禁止 — 直接修改
const state = useAppStore.getState()
state.journals.push(newJournal)

// ✅ 正确 — 通过 set()
useAppStore.setState((state) => ({
  journals: [...state.journals, newJournal],
}))
```

---

## 8. Code Review 检查清单

在 PR 合并前，逐项检查：

### Store 结构
- [ ] 是否使用单 store + slice pattern？（无多个 `create()` 调用）
- [ ] 是否消除了跨 store import？
- [ ] 每个 slice 是否使用 `StateCreator<TState, [], [], TSlice>` 标注类型？
- [ ] `create<T>()` 是否显式指定了泛型参数？

### 异步操作
- [ ] 所有可能被中断的异步 action 是否都有 `AbortController`？
- [ ] 异步 catch 分支是否区分了 `AbortError` 和业务错误？
- [ ] 是否有 fire-and-forget 的 `await`（无取消机制）？
- [ ] 超时场景是否有明确处理？

### 状态更新
- [ ] 依赖先前状态的更新是否使用 `set((state) => ...)` 函数形式？
- [ ] 是否有直接修改 state 对象的行为？
- [ ] `set()` 调用是否在 `finally` 中清理了 loading 状态？

### 副作用管理
- [ ] 订阅 / 事件监听是否在 `useEffect` 中注册和清理？
- [ ] 是否有 module-level 的 `let` 可变变量？（必须移入 store）
- [ ] 事件监听器是否有对应的 `removeEventListener` cleanup？

### SSR 安全
- [ ] 浏览器 API 访问是否使用 `typeof` 守卫或 `skipHydration`？
- [ ] 服务端和客户端初始值是否一致（避免 hydration mismatch）？
- [ ] `navigator` / `window` 访问是否包裹在 `useEffect` 中？

### Selector
- [ ] 多字段 selector 是否使用 `useShallow`？
- [ ] selector 中是否避免了计算 / 过滤逻辑？
- [ ] 是否有订阅整个 store 的 `useAppStore()` 调用？

### Persist
- [ ] 是否配置了 `partialize`（不持久化 loading/error 状态）？
- [ ] 是否使用 `idb-keyval` 作为 IndexedDB storage 后端？
- [ ] schema 变更是否有对应的 `migrate` 函数？
- [ ] `version` 字段是否递增？

### 代码质量
- [ ] 是否移除了所有 `console.log` 调试语句？
- [ ] `console.error` / `console.warn` 是否包含足够的错误上下文？
- [ ] TypeScript 是否零 `any`？

---

## 附录：Store 迁移路线图

当前代码需要进行的迁移步骤（按依赖顺序）：

1. **清理 debug 日志** — 移除 `src/store/journal.ts` 中的 `console.log` 调试语句
2. **合并 Store** — 将 `auth.ts` + `journal.ts` 合并为单 store `src/store/index.ts`
3. **消除 Module-level 状态** — 将 `activeSubscription`、`initialized`、`onOnlineHandler` 移入 store state
4. **添加 AbortController** — 为 `fetchJournals`、`addJournal`、`updateJournal` 添加取消机制
5. **引入 Persist Middleware** — 替换 `src/lib/db.ts` 的手动 IndexedDB 管理
6. **SSR 安全修复** — 为浏览器 API 访问添加 `skipHydration` 或 `useEffect` 包裹
7. **Selector 优化** — 审查所有 `useAppStore` 调用点，添加 `useShallow` 和细粒度 selector
