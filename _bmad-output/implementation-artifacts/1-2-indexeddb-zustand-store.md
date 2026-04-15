Status: review

# Story 1.2: IndexedDB 数据层 + Zustand Store

## Story

As a 开发者,
I want 创建 IndexedDB 数据层和状态管理 Store,
so that 日记的读写有可靠的本地数据源。

## Acceptance Criteria

1. **Given** 项目已初始化
   **When** 在 `lib/db.ts` 中创建 IndexedDB 数据库 `xiaozhi-journal`
   **Then** 包含 `journals` store（字段：id, content, mood, moodEmoji, aiResponse, goldenQuote, moodLabel, timestamp, status, shareCount）
   **And** 包含 `appMeta` store（字段：key, value）
   **And** 提供 CRUD 函数：`addJournal()`, `getJournals()`, `getJournalById()`, `updateJournal()`, `setMeta()`, `getMeta()`

2. **Given** IndexedDB 已初始化
   **When** 在 `store/journal.ts` 创建 Zustand store
   **Then** 包含 state：`journals: Journal[]`, `loading: boolean`, `error: string | null`
   **And** 包含 actions：`fetchJournals()`, `addJournal()`, `updateAIResponse()`
   **And** 所有更新使用不可变模式

3. **Given** store 创建完毕
   **When** 在页面中使用 `useJournalStore()` 读取数据
   **Then** 页面刷新后数据可从 IndexedDB 恢复

## Tasks / Subtasks

- [x] Task 1: 创建类型定义 (AC: #1)
  - [x] 在 `types/index.ts` 定义 Journal, AIResponse, MoodLevel, AppMeta 等类型
- [x] Task 2: 实现 IndexedDB 数据层 (AC: #1)
  - [x] 在 `lib/db.ts` 初始化数据库（journals + appMeta 两表）
  - [x] 实现 addJournal(), getJournals(), getJournalById(), updateJournal()
  - [x] 实现 setMeta(), getMeta()
- [x] Task 3: 创建 Zustand Store (AC: #2, #3)
  - [x] 在 `store/journal.ts` 创建单一 store
  - [x] 实现 fetchJournals() 从 IndexedDB 读取
  - [x] 实现 addJournal() 写入 DB + 更新 state
  - [x] 实现 updateAIResponse() 更新 AI 回应

## Dev Notes

### 数据模型
**Journal 表：**
| 字段 | 类型 | 说明 |
|------|------|------|
| id | string | UUID |
| content | string | 日记正文 |
| mood | number | 1-5（对应 😡 😔 😐 😊 😴） |
| moodEmoji | string | 表情符号文本 |
| aiResponse | string \| null | AI 回应文本 |
| goldenQuote | string \| null | 今日金句 |
| moodLabel | string \| null | AI 识别的情绪标签 |
| timestamp | string | ISO 时间字符串 |
| status | 'pending' \| 'ai_ready' \| 'ai_done' | AI 处理状态 |
| shareCount | number | 金句被分享次数 |

**AppMeta 表：**
| 字段 | 类型 | 说明 |
|------|------|------|
| key | string | 元数据键 |
| value | any | 元数据值 |

### 命名规范
- 文件命名：kebab-case
- 函数命名：camelCase
- 类型命名：PascalCase
- IndexedDB store：camelCase（复数）— `journals`, `appMeta`

### State 更新模式
```ts
// ✅ 正确的不可变更新
addJournal: (journal) => set((state) => ({
  journals: [...state.journals, journal]
}))
```

### References
- [Source: architecture.md#Data Architecture]
- [Source: architecture.md#State Management Patterns]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
