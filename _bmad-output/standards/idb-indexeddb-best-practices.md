# idb / IndexedDB 编码标准

> 本项目使用 `idb` 库（v7+）封装 IndexedDB 操作，支撑 offline-first 架构。
> 所有涉及 IndexedDB 的代码必须遵循本标准。

---

## 1. SSR / Next.js 安全

### 1.1 必须进行 `typeof window` 检查

IndexedDB 仅在浏览器环境可用。Next.js App Router 中 SSR 阶段会执行服务端代码，直接调用 IndexedDB 将抛出异常。

```typescript
// CORRECT — 在模块顶层做环境守卫
function getDB() {
  if (typeof window === 'undefined') {
    throw new Error('[DB] IndexedDB is not available in SSR context');
  }
  // ...openDB call
}
```

```typescript
// WRONG — 无守卫，SSR 时崩溃
import { openDB } from 'idb';
const db = await openDB('mydb', 1); // SSR 直接报错
```

### 1.2 推荐懒初始化，禁止顶层 `await openDB`

```typescript
// CORRECT — 懒初始化 + Promise 单例
let dbPromise: Promise<IDBPDatabase> | null = null;
let dbInstance: IDBPDatabase | null = null;

function getDB() {
  if (dbInstance) return Promise.resolve(dbInstance);
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, { upgrade, blocked, blocking, terminated })
      .then((db) => { dbInstance = db; return db; })
      .catch((err) => { dbPromise = null; throw err; });
  }
  return dbPromise;
}
```

```typescript
// WRONG — 模块顶层 await，SSR / import 时就打开数据库
const db = await openDB('xiaozhi-journal', 1);
```

### 1.3 Next.js 客户端组件中使用

必须在 `'use client'` 组件中或通过 `useEffect` 触发数据库操作。Server Component 中禁止直接调用 `getDB()`。

---

## 2. 数据库 Schema 设计

### 2.1 必须使用 TypeScript DBSchema 接口

```typescript
import type { DBSchema } from 'idb';
import type { Journal, AppMeta } from '@/types';

interface XiaozhiDB extends DBSchema {
  journals: {
    key: string;               // keyPath: 'id'
    value: Journal;
    indexes: { timestamp: string; status: string };
  };
  'app-meta': {               // 注意：DB 中实际名称为 'appMeta'，见下文
    key: string;               // keyPath: 'key'
    value: AppMeta;
    indexes: {};
  };
}

// 使用方式
const db = await openDB<XiaozhiDB>(DB_NAME, DB_VERSION, { upgrade(db) { ... } });
```

> **当前项目状态**：`src/lib/db.ts` 尚未使用 `DBSchema` 泛型，所有返回值依赖隐式推断。推荐在下次重构时补上类型定义。

### 2.2 必须指定 keyPath

```typescript
// CORRECT — journals 使用 id 作为主键
db.createObjectStore('journals', { keyPath: 'id' });

// CORRECT — appMeta 使用 key 作为主键
db.createObjectStore('appMeta', { keyPath: 'key' });
```

```typescript
// WRONG — 无 keyPath，只能用 autoIncrement，失去业务语义主键
db.createObjectStore('journals');
```

### 2.3 仅对查询字段创建索引

当前 `journals` store 的索引：

| 索引名 | 路径 | 用途 |
|---|---|---|
| `timestamp` | `timestamp` | 按时间排序查询 |
| `status` | `status` | 筛选待同步记录 (`pending`) |

```typescript
// CORRECT — 仅索引被实际查询的字段
journalStore.createIndex('timestamp', 'timestamp');
journalStore.createIndex('status', 'status');
```

```typescript
// WRONG — 对 `mood` 等仅用于 UI 展示的字段建索引，浪费空间
journalStore.createIndex('mood', 'mood');
journalStore.createIndex('moodEmoji', 'moodEmoji');
```

### 2.4 禁止过度索引

每增加一个索引都会增加写入成本和存储占用。只有满足以下条件时才创建索引：

- 该字段作为查询条件出现（`getAllFromIndex`、`openCursor`）
- 查询频率高且数据量预计超过 100 条

---

## 3. Transaction 模式

### 3.1 理解 idb 事务生命周期

idb 的事务在 microtask 队列为空时自动提交。**禁止在事务中间执行 `await`（非 IndexedDB Promise）**，否则事务会在 await 期间被提交。

```typescript
// WRONG — 中间 await 了一个非 IndexedDB Promise，事务已提交
const tx = db.transaction('journals', 'readwrite');
const store = tx.objectStore('journals');
store.put(journal);          // 入队
await fetch('/api/notify');  // 事务在此 await 期间已自动提交！
await tx.done;               // 仅等待上面的 put，但逻辑有误导风险
```

```typescript
// CORRECT — 同一事务内的操作连续调用，await tx.done 在末尾
const tx = db.transaction('journals', 'readwrite');
const store = tx.objectStore('journals');
store.put(journal1);
store.put(journal2);
await tx.done;
```

### 3.2 使用 `idb` 快捷方法优先

idb 在 `IDBPDatabase` 上提供了快捷方法，自动创建事务并等待完成。

```typescript
// CORRECT — 快捷方法，自动管理事务
await db.put('journals', journal);    // readwrite
await db.get('journals', id);         // readonly
await db.getAll('journals');          // readonly
await db.getAllFromIndex('journals', 'status', 'pending');
await db.delete('journals', id);      // readwrite
```

```typescript
// 仅当需要多操作同事务时才手动创建
const tx = db.transaction('journals', 'readwrite');
await Promise.all([
  tx.store.put(journal1),
  tx.store.put(journal2),
]);
await tx.done;
```

### 3.3 读写分离

- 纯查询必须使用 `readonly` 事务（快捷方法自动选择）
- 涉及写操作使用 `readwrite`
- 禁止对只读查询使用 `readwrite`（阻塞其他写入）

### 3.4 必须等待 `tx.done`

手动创建事务时，必须 `await tx.done` 确认提交成功。

```typescript
// CORRECT
const tx = db.transaction('journals', 'readwrite');
tx.store.put(journal);
await tx.done;  // 捕获提交失败
```

---

## 4. Offline-First 同步架构

### 4.1 状态机

Journal 记录的 `status` 字段驱动同步流程：

```
pending → ai_ready → ai_done → synced
  ↑         |          |
  └─────────┴──────────┘ (冲突/重试回退)
```

| 状态 | 含义 | 触发 |
|---|---|---|
| `pending` | 本地新建/修改，待 AI 处理 | 用户提交日记 |
| `ai_ready` | 已发送给 AI，等待响应 | AI 请求发出 |
| `ai_done` | AI 已返回，待上传云端 | AI 响应写入 |
| `synced` | 已同步到 Supabase | `syncToSupabase` 成功 |

> **注意**：当前 `markSynced` 函数将状态设置为 `'ai_done'` 而非 `'synced'`，存在命名不一致问题。推荐修复为 `'synced'` 并在 SyncManager 中过滤 `status !== 'synced'`。

### 4.2 同步队列模式

```typescript
// src/lib/sync-manager.ts 当前模式
export async function syncPending() {
  if (syncing) return;   // 防重入守卫
  syncing = true;
  try {
    const pending = await getPendingJournals();  // getAllFromIndex('status', 'pending')
    if (pending.length === 0) return;
    await syncToSupabase(pending);               // upsert to Supabase
  } catch (err) {
    // 保持本地 pending 状态，等待下次重试
  } finally {
    syncing = false;
  }
}
```

### 4.3 乐观 UI

```typescript
// CORRECT — 先写本地 IndexedDB 立即反映到 UI，再后台同步
async function handleSubmit(content: string) {
  const journal: Journal = createJournal(content);
  await addJournal(journal);        // 写 IndexedDB，Zustand 订阅触发 UI 更新
  setSyncing(true);                 // UI 显示 "同步中"
  syncPending().catch(() => {       // 后台异步同步，不阻塞 UI
    setSyncing(false);              // 失败时提示
  });
}
```

### 4.4 冲突解决策略

- **本地优先**：以 IndexedDB 数据为准，Supabase upsert 时使用 `id` 作为唯一键
- **last-write-wins**：比较 `timestamp`，新的覆盖旧的
- 禁止在冲突时静默丢弃用户数据，必须保留 `timestamp` 较大者

### 4.5 推荐实现 backoff 重试

```typescript
// 推荐：SyncManager 中加入指数退避
const BACKOFF_MS = [1000, 2000, 5000, 10000, 30000];
let attempt = 0;

async function syncWithRetry(pending: Journal[]) {
  for (const delay of BACKOFF_MS) {
    try {
      await syncToSupabase(pending);
      attempt = 0;
      return;
    } catch {
      await new Promise(r => setTimeout(r, delay));
      attempt++;
    }
  }
  throw new Error('Sync failed after 5 attempts');
}
```

---

## 5. Version Migration

### 5.1 必须使用 `oldVersion` 守卫

```typescript
upgrade(db, oldVersion, newVersion) {
  // 模式：每个版本独立守卫
  if (oldVersion < 1) {
    db.createObjectStore('journals', { keyPath: 'id' });
  }
  if (oldVersion < 2) {
    db.createObjectStore('appMeta', { keyPath: 'key' });
  }
  if (oldVersion < 3) {
    const store = db.transaction.objectStore('journals');
    store.createIndex('mood', 'mood');
  }
}
```

```typescript
// WRONG — 不使用 oldVersion 检查，重复执行
upgrade(db) {
  db.createObjectStore('journals', { keyPath: 'id' }); // 已存在则报错
}
```

### 5.2 数据迁移必须使用 cursor

```typescript
// CORRECT — 跨版本数据迁移使用 cursor 遍历
if (oldVersion < 2) {
  const tx = db.transaction('journals', 'readwrite');
  const store = tx.objectStore('journals');
  const cursor = await store.openCursor();
  while (cursor) {
    const record = cursor.value;
    // 添加新字段
    record.status = record.status ?? 'synced';
    cursor.update(record);
    await cursor.continue();
  }
  await tx.done;
}
```

### 5.3 阻塞处理

项目当前实现正确使用了 `blocked`、`blocking`、`terminated` 回调：

```typescript
// 已有实现 — 保持
blocked(currentVersion, blockedVersion) {
  console.warn(`[DB] Blocked upgrading from v${currentVersion} to v${blockedVersion}`);
},
blocking(currentVersion, blockedVersion) {
  if (dbInstance) {
    dbInstance.close();
    dbInstance = null;
    dbPromise = null;
  }
},
terminated() {
  dbInstance = null;
  dbPromise = null;
},
```

- `blocked`：其他标签页阻止升级，记录警告
- `blocking`：当前页面阻止升级，主动关闭连接让升级进行
- `terminated`：浏览器强制关闭连接，清理引用

### 5.4 版本号管理

- `DB_VERSION` 定义在 `src/lib/db.ts` 顶层常量
- 修改 schema 时必须递增版本号（整数）
- 禁止跳过版本号（1 -> 3 会跳过 v2 的迁移逻辑）
- 推荐在注释中记录每个版本的变更内容

---

## 6. 性能优化

### 6.1 批量操作使用 `getAll`，避免 cursor

```typescript
// CORRECT — 获取全部记录，使用 getAll（内部优化，比 cursor 快 2-10 倍）
const all = await db.getAll('journals');

// WRONG — 手动 cursor 遍历获取全部（慢）
const result: Journal[] = [];
let cursor = await store.openCursor();
while (cursor) {
  result.push(cursor.value);
  await cursor.continue();
}
```

### 6.2 使用索引查询替代全表扫描

```typescript
// CORRECT — 使用 status 索引直接筛选
const pending = await db.getAllFromIndex('journals', 'status', 'pending');

// WRONG — 全表获取后 JS 过滤
const all = await db.getAll('journals');
const pending = all.filter(j => j.status === 'pending');
```

### 6.3 批量写入使用同一事务

```typescript
// CORRECT — 单事务批量写入
const tx = db.transaction('journals', 'readwrite');
for (const journal of journals) {
  tx.store.put(journal);
}
await tx.done;

// WRONG — 逐条创建独立事务
for (const journal of journals) {
  await db.put('journals', journal);  // 每条一个事务，N 次事务开销
}
```

### 6.4 排序在 JS 层进行

IndexedDB 索引排序仅适用于 cursor 遍历。使用 `getAll` 后数据已脱离数据库，必须在 JS 层排序。

```typescript
// CORRECT — getAll 后 JS sort
const all = await db.getAll('journals');
return all.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
```

### 6.5 存储体积控制

- 禁止在 IndexedDB 中存储 Base64 图片（使用 Blob / File 对象，IndexedDB 原生支持）
- `aiResponse` 字段过长时考虑截断或单独建表
- 定期清理 `synced` 状态且超过 N 天的旧数据（TTL 策略）

---

## 7. 错误处理

### 7.1 QuotaExceededError

```typescript
import { openDB } from 'idb';

try {
  await db.put('journals', journal);
} catch (err) {
  if (err.name === 'QuotaExceededError') {
    // 存储空间已满
    console.error('[DB] Storage quota exceeded');
    // 推荐：清理旧 synced 数据后重试
    await cleanupOldSyncedData();
    await db.put('journals', journal);
  }
  throw err;
}
```

### 7.2 持久化存储

推荐在首次打开数据库时请求持久化：

```typescript
if (navigator.storage?.persist) {
  const persisted = await navigator.storage.persist();
  if (persisted) {
    console.log('[DB] Persistent storage granted');
  }
}
```

### 7.3 连接终止处理

浏览器可能在后台标签页中回收 IndexedDB 连接。必须处理 `terminated` 回调（项目已实现），并在下次操作时自动重连（懒初始化模式天然支持）。

### 7.4 错误必须向上抛或明确吞掉

```typescript
// CORRECT — 明确处理
export async function addJournal(journal: Journal) {
  const db = await getDB();
  await db.put('journals', journal);  // 错误向上传播，调用方决定如何处理
}

// WRONG — 空 catch 吞掉错误
try {
  await db.put('journals', journal);
} catch (e) {
  // 吞掉错误，调用方不知道写入失败
}
```

---

## 8. Anti-patterns 反模式清单

### 8.1 事务生命周期陷阱

```typescript
// WRONG — await 非 IndexedDB Promise 导致事务提交
const tx = db.transaction('journals', 'readwrite');
await tx.store.put(journal);
const user = await supabase.auth.getUser();  // 事务在此提交！
await tx.store.put(journal2);                // 新事务，不是同一个
```

### 8.2 全局引用陷阱

禁止在模块顶层保存 `IDBPDatabase` 实例作为长期引用。

```typescript
// WRONG — 顶层实例引用，terminated 后变成 stale
const db = await openDB('xiaozhi-journal', 1);
export { db };
```

项目使用 `getDB()` 函数返回 Promise 模式，正确处理了实例生命周期。

### 8.3 过度使用索引

每个索引约增加 10-30% 的写入开销和存储空间。

```typescript
// WRONG — shareCount 等数值字段建索引，查询收益极低
store.createIndex('shareCount', 'shareCount');
store.createIndex('aiResponse', 'aiResponse');
```

### 8.4 同步阻塞主线程

禁止在事务回调中执行 CPU 密集操作。

```typescript
// WRONG — cursor 同步中做 JSON 解析/正则匹配等重操作
const cursor = await store.openCursor();
while (cursor) {
  const parsed = JSON.parse(cursor.value.content);  // CPU 密集
  // ...大量处理
  await cursor.continue();
}
```

推荐：先用 `getAll` 取出数据，再用 Web Worker 或 requestIdleCallback 处理。

---

## 9. Testing

### 9.1 使用 `fake-indexeddb` + Vitest

```bash
npm install -D fake-indexeddb
```

### 9.2 Vitest 全局 Setup

```typescript
// vitest.setup.ts
import 'fake-indexeddb/auto';
```

或在每个测试文件顶部：

```typescript
import 'fake-indexeddb/auto';
```

### 9.3 测试示例

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import 'fake-indexeddb/auto';
import { addJournal, getJournals, getPendingJournals } from '@/lib/db';
import type { Journal } from '@/types';

describe('Journal DB operations', () => {
  beforeEach(async () => {
    // 清理数据库
    const { deleteDB } = await import('idb');
    await deleteDB('xiaozhi-journal');
  });

  it('should add and retrieve a journal', async () => {
    const journal: Journal = {
      id: 'test-1',
      content: 'Today was good',
      mood: 4,
      moodEmoji: '😊',
      aiResponse: null,
      goldenQuote: null,
      moodLabel: '开心',
      timestamp: '2026-04-22T10:00:00Z',
      status: 'pending',
      shareCount: 0,
    };

    await addJournal(journal);
    const all = await getJournals();
    expect(all).toHaveLength(1);
    expect(all[0].id).toBe('test-1');
  });

  it('should filter pending journals by status index', async () => {
    const pending: Journal = { ...createMock(), id: '1', status: 'pending' };
    const synced: Journal = { ...createMock(), id: '2', status: 'ai_done' };

    await addJournal(pending);
    await addJournal(synced);

    const result = await getPendingJournals();
    expect(result).toHaveLength(1);
    expect(result[0].id).toBe('1');
  });
});
```

### 9.4 测试事务原子性

```typescript
it('should not leave partial data on error', async () => {
  // 模拟写入失败，验证事务回滚
});
```

### 9.5 测试版本迁移

```typescript
it('should migrate from v1 to v2', async () => {
  // 1. 用 v1 打开，写入旧格式数据
  const v1db = await openDB('xiaozhi-journal', 1, { upgrade(db) { ... } });
  await v1db.put('journals', oldFormat);
  v1db.close();

  // 2. 用 v2 打开，触发 upgrade
  const v2db = await openDB('xiaozhi-journal', 2, { upgrade(db, oldVersion) { ... } });

  // 3. 验证数据已迁移
  const migrated = await v2db.get('journals', 'test-1');
  expect(migrated.status).toBe('synced');
});
```

---

## 10. 项目现状与技术债务

### 10.1 当前 Schema

| Store | keyPath | Indexes |
|---|---|---|
| `journals` | `id` | `timestamp`, `status` |
| `appMeta` | `key` | (none) |

### 10.2 已知问题

| 问题 | 位置 | 严重度 | 建议 |
|---|---|---|---|
| 缺少 `DBSchema` TypeScript 类型 | `src/lib/db.ts` | 低 | 下次重构时补上 |
| `markSynced` 设置为 `'ai_done'` 而非 `'synced'` | `src/lib/db.ts:97` | 中 | 修复状态值，增加 `'synced'` 到类型 |
| `syncToSupabase` 逐条调用 `markSynced` 而非批量更新 | `src/lib/db.ts:133-135` | 低 | 使用单事务批量 `put` |
| 缺少 QuotaExceededError 处理 | `src/lib/db.ts` | 中 | 增加 quota 错误处理 |
| 缺少持久化存储请求 | `src/lib/db.ts` | 低 | 打开 DB 时请求 `navigator.storage.persist()` |
| SyncManager 缺少 backoff 重试 | `src/lib/sync-manager.ts` | 中 | 增加指数退避 |
| `Journal` 类型缺少 `'synced'` 状态 | `src/types/index.ts:12` | 中 | 扩展 status 联合类型 |

### 10.3 状态值完整定义

```typescript
// 当前 src/types/index.ts
status: 'pending' | 'ai_ready' | 'ai_done';

// 推荐补充为
status: 'pending' | 'ai_ready' | 'ai_done' | 'synced';
```

---

## 11. Code Review 检查清单

在合并任何涉及 IndexedDB 的 PR 前，必须逐项确认：

### Schema & 类型
- [ ] 使用了 `DBSchema` 接口定义数据库结构
- [ ] keyPath 已正确指定
- [ ] 索引仅用于被查询的字段
- [ ] 版本号已递增且 oldVersion 守卫正确

### Transaction
- [ ] 事务内无 await 非 IndexedDB Promise
- [ ] 手动创建的事务有 `await tx.done`
- [ ] 读写事务不用于只读查询
- [ ] 批量写入使用同一事务

### Offline-First
- [ ] 状态机流转正确（pending -> ai_ready -> ai_done -> synced）
- [ ] 同步失败时本地数据不丢失
- [ ] 乐观 UI 不阻塞用户操作
- [ ] 冲突解决策略为 last-write-wins

### SSR Safety
- [ ] 有 `typeof window` 或同等级环境守卫
- [ ] 懒初始化，无顶层 await openDB
- [ ] Next.js Server Component 中不直接调用 DB 函数

### Error Handling
- [ ] QuotaExceededError 有处理路径
- [ ] blocked / blocking / terminated 回调已注册
- [ ] 错误不被静默吞掉（除非有明确理由）

### Performance
- [ ] 全表查询使用 `getAll` 而非 cursor
- [ ] 条件查询使用 `getAllFromIndex` 而非全表过滤
- [ ] 批量写入合并为单事务
- [ ] 无不必要的索引

### Testing
- [ ] 使用 `fake-indexeddb` 有单元测试
- [ ] 版本迁移有独立测试用例
- [ ] beforeEach 清理数据库避免测试间污染
