# Story 2.2: 日记输入框 + 保存到缓存

Status: review

Epic: 2 — 3 秒心情打卡
Story ID: 2.2
Created: 2026-04-22

---

## Story

As a 选择了心情的用户,
I want 一个温和无压力的输入框写日记,
So that 我可以自由表达今天的感受。

## Acceptance Criteria

**Given** 用户已选择心情表情
**When** 输入框出现
**Then** 输入框为聊天气泡风格：无外框，底部 2px 暖灰线，圆角底部（UX-DR17）
**And** placeholder 为 "随便写点什么吧，哪怕只有一句话"
**And** 高度自动增长，最多 200px，超出可滚动
**And** 不显示字数提示

**Given** 用户在输入框中输入内容
**When** 点击 Primary 按钮或按 Ctrl/Cmd + Enter
**Then** 日记内容 + 心情写入 IndexedDB 缓存层（`addJournal()`），status 标记为 `pending`
**And** 触发后台 `syncToSupabase()` 异步同步
**And** 输入框淡出
**And** 显示 "记下了 ✨" 成功提示（柔绿背景，3 秒后淡出，符合 UX-DR16）

**Given** 用户输入了内容但刷新页面
**When** 页面重新加载
**Then** 输入框中的草稿不丢失（自动保存到 IndexedDB，刷新后可恢复）

## Tasks / Subtasks

- [x] Task 1: 创建 `journal-input.tsx` 组件 (AC: 输入框 UI + 保存)
  - [x] textarea 无外框，底部 2px 暖灰线，圆角底部
  - [x] placeholder "随便写点什么吧，哪怕只有一句话"
  - [x] 高度自动增长，最多 200px
  - [x] 保存按钮：Primary 暖珊瑚色实心，禁用态 opacity-50
  - [x] Ctrl/Cmd + Enter 快捷键保存
  - [x] 保存时写入 IndexedDB（`addJournal()`），status `pending`
  - [x] 成功后显示 "记下了 ✨" 柔绿提示，3 秒淡出
  - [x] 离线时显示 "日记已保存，小知在路上~" 暖灰提示

- [x] Task 2: 草稿自动保存 + 恢复 (AC: 草稿不丢失)
  - [x] 输入内容 debounce 300ms 自动保存到 IndexedDB `appMeta.journal-draft`
  - [x] 组件挂载时恢复草稿
  - [x] 保存成功后清除草稿

- [x] Task 3: 集成到首页 `page.tsx` (AC: AnimatePresence 动画)
  - [x] `AnimatePresence mode="wait"` 包裹 `JournalInput`
  - [x] 组件自带 enter/exit 动画（opacity + y 位移）
  - [x] 使用 `key={selectedMood}` 确保切换心情时动画正确触发

- [x] Review Follow-ups (AI) — Round 1
  - [x] 修复 AnimatePresence exit 动画：删除 `journal-input.tsx` 中 `if (!selectedMood) return null;` 早期返回
  - [x] 修复切换心情时动画偶发失效：移除 `showInput` 中间状态 + useEffect 同步，直接使用 `selectedMood &&` 条件

- [x] Review Follow-ups (AI) — Round 2 (Code Review)
  - [x] [AI-Review] [H1] `MOOD_MAP[selectedMood as MoodLevel].emoji` 添加 `?.emoji ?? ''` 守卫
  - [x] [AI-Review] [M2] 成功提示不可见 → 延迟 setSelectedMood(null) 至 exit 动画完成
  - [x] [AI-Review] [M3] 快速切心情草稿丢失 → unmount 时同步保存草稿
  - [x] [AI-Review] [M4] 草稿恢复覆盖新输入 → restore 仅在 content 为空时写入
  - [x] [AI-Review] [M5] JournalInput 未应用 useReducedMotion → AnimatePresence 条件跳过动画
  - [x] [AI-Review] [L1] setTimeout 无清理 → saveTimerRef 清理成功/离线消息定时器

## Dev Notes

### 当前实现状态 — 已完成

**此 Story 已通过 2.1 的集成工作间接完成。** `journal-input.tsx` 和 `page.tsx` 中的相关代码已在 Story 2.1 开发过程中实现并修复。

### 关键实现细节

#### 1. 输入框 UI

- `textarea` 元素使用 `border-0 border-b-2 border-[#E8E0D8]` 实现底部线
- `rounded-b-md` 圆角底部
- `resize-none` 禁用手动拖拽调整大小
- `maxHeight: 200px` + `overflow-y-auto` 限制最大高度
- `fontFamily: var(--font-noto-sans)` 正文用 Noto Sans SC

#### 2. 保存逻辑（`handleSave`）

```ts
const handleSave = useCallback(async () => {
  if (!content.trim() || !selectedMood) return;

  const journal: Journal = {
    id: crypto.randomUUID(),
    content: content.trim(),
    mood: selectedMood,
    moodEmoji: MOOD_MAP[selectedMood].emoji,
    aiResponse: null,
    goldenQuote: null,
    moodLabel: null,
    timestamp: new Date().toISOString(),
    status: 'pending',
    shareCount: 0,
  };

  await addJournal(journal); // 写入 IndexedDB
  await setMeta(DRAFT_KEY, ''); // 清除草稿

  // 在线时立即调用 AI
  if (navigator.onLine) {
    setAIWaiting(true);
    const res = await fetch('/api/journal', { ... });
    const data = await res.json();
    if (data?.response) {
      updateAIResponse(journal.id, data);
    }
  }
}, [...]);
```

#### 3. 草稿机制

- **Key**: `journal-draft` 存储在 IndexedDB `appMeta` 表
- **保存**: debounce 300ms，每次内容变化后延迟写入
- **恢复**: 组件挂载时从 IndexedDB 读取
- **清除**: 保存成功后立即清除

#### 4. 动画配置

- Enter: `initial={{ opacity: 0, y: 20 }}` → `animate={{ opacity: 1, y: 0 }}`
- Exit: `exit={{ opacity: 0, y: 20 }}`
- `AnimatePresence mode="wait"` 确保先退出再进入
- `key={selectedMood}` 确保切换心情时 React 识别为不同元素

#### 5. 离线处理

- 保存时检查 `navigator.onLine`
- 无论在线/离线都先写 IndexedDB
- 在线时立即调用 `/api/journal` 获取 AI 回应
- 离线时显示暖灰提示 "日记已保存，小知在路上~"
- 在线状态恢复时，`page.tsx` 中的 `useEffect` 自动处理 `pending` 状态的日记

### 架构合规

- **Source**: [architecture.md](file:///D:/WorkPlace/VibeCoding/Xiaozhi%20Journal/_bmad-output/planning-artifacts/architecture.md) — IndexedDB 缓存层 + Zustand store
- **Source**: [epics.md](file:///D:/WorkPlace/VibeCoding/Xiaozhi%20Journal/_bmad-output/planning-artifacts/epics.md) — Epic 2 Story 2.2 完整 AC
- **Source**: [ux-design-specification.md](file:///D:/WorkPlace/VibeCoding/Xiaozhi%20Journal/_bmad-output/planning-artifacts/ux-design-specification.md) — UX-DR16（反馈模式）, UX-DR17（表单模式）

### 已修复的问题

1. **AnimatePresence exit 动画不触发** — `journal-input.tsx` 中 `if (!selectedMood) return null;` 导致组件在 motion.div 有机会执行退出动画前就返回 null。已删除该早期返回。
2. **切换心情时动画偶发失效** — `page.tsx` 中 `showInput` 中间状态 + useEffect 同步在 `onExitComplete` 和 useEffect 同批次触发时产生竞态。已移除中间状态，直接使用 `selectedMood &&` 条件。

### File List

- `src/components/journal-input.tsx` — 输入框 UI + 保存 + 草稿 + H1/M2/M3/M4/M5/L1 修复
- `src/app/page.tsx` — AnimatePresence 集成（移除 mode="wait" 阻塞）
- `src/components/mood-selector.tsx` — 心情选择器（Story 2.1，触发输入框显示）
- `src/store/journal.ts` — Zustand store（addJournal, setAIWaiting, updateAIResponse, setSelectedMood）
- `src/lib/db.ts` — IndexedDB 操作（addJournal, setMeta, getMeta, getPendingJournals）

## Dev Agent Record

### Agent Model Used

qwen3.6-plus

### Debug Log References

- TypeScript 编译：零错误
- Next.js MCP `get_errors`：无编译/运行时错误

### Completion Notes List

1. **输入框 UI** — 无外框，底部 2px 暖灰线，圆角底部，自适应高度（max 200px）
2. **保存逻辑** — 先写 IndexedDB，在线时立即调用 AI，离线时标记 pending
3. **草稿机制** — debounce 300ms 自动保存 + unmount 同步保存，挂载时恢复（空内容才恢复），保存后清除
4. **动画修复** — 删除早期返回 + 移除 showInput 中间状态 + AnimatePresence 添加 useReducedMotion 条件 + 移除 mode="wait" 阻塞
5. **成功反馈** — "记下了 ✨" 柔绿背景，延迟 setSelectedMood(null) 600ms 确保可见，3 秒淡出；离线时 "小知在路上~" 暖灰提示
6. **定时器清理** — 成功/离线消息 setTimeout 通过 ref 追踪，组件 unmount 时清理
7. **MOOD_MAP 安全访问** — `?.emoji ?? ''` 防御性访问，避免运行时崩溃

## Senior Developer Review (AI)

### Review 2 — 2026-04-22 (Code Review Findings)

**Outcome:** Changes Requested → Resolved
**Reviewer:** Adversarial + Edge Case Hunter (parallel)

#### Action Items

- [x] **[H1]** `MOOD_MAP[selectedMood as MoodLevel].emoji` 无 null 保护 → 添加 `?.emoji ?? ''` 守卫
- [x] **[M2]** 成功提示随组件一起退出 → 延迟 `setSelectedMood(null)` 至 exit 动画完成 → 后续 Round 3 发现 store 已处理，删除组件内调用
- [x] **[M3]** 快速切心情时草稿丢失 → unmount 时同步保存草稿（不再仅 debounce）
- [x] **[M4]** 草稿恢复覆盖用户新输入 → restore 仅在 content 为空时写入
- [x] **[M5]** JournalInput 未应用 useReducedMotion → AnimatePresence 添加 `useReducedMotion` 条件
- [x] **[L1]** setTimeout 无清理 → 添加 saveTimerRef 清理

### Review 3 — 2026-04-22 (Second Code Review)

**Outcome:** Changes Requested → Resolved
**Reviewer:** Adversarial + Edge Case Hunter (parallel)

#### Action Items

- [x] **[H]** 600ms `setSelectedMood(null)` timer 覆盖新 mood 选择 → 删除，store 已处理
- [x] **[M]** 快速双击 Ctrl+Enter 创建重复日记 → 添加 `savingRef` 同步 gate
- [x] **[M]** Unmount 时 draft save 与 handleSave 竞争 → `!savingRef.current` 守卫
