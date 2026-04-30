# Story 5.1: 历史日记列表

Status: done

Epic: 5 — 日记历史与详情
Story ID: 5.1
Created: 2026-04-30

---

## Story

As a 想回顾过去的用户,
I want 按时间顺序查看我的所有日记,
So that 我能回顾自己的心路历程。

## Acceptance Criteria

**Given** 用户在首页
**When** 点击底部 Tertiary 文字按钮 "查看过往记录"
**Then** 页面淡入淡出切换到历史列表（0.3s Framer Motion）
**And** 按时间倒序显示所有日记条目
**And** 每条显示：日期、心情表情、日记摘要（前 50 字）、AI 金句（如果有）

**Given** 日记数量较多（>10 条）
**When** 查看列表
**Then** 列表可滚动，每条之间有 16px 间距
**And** 支持分页加载（从 Supabase 查询，每页 20 条）

## Tasks / Subtasks

- [ ] Task 1: 创建 `/history` 路由页面 (AC: 全部)
  - [ ] 新建 `src/app/history/page.tsx`（Server Component，数据从 Supabase 查询）
  - [ ] 查询当前用户的日记列表，按 `created_at` 倒序
  - [ ] 实现分页逻辑（每页 20 条，支持加载更多）
  - [ ] 无日记时显示 EmptyState 组件
  - [ ] 加载时显示 Skeleton 骨架屏

- [ ] Task 2: 创建历史列表项组件 (AC: 全部)
  - [ ] 新建 `src/components/journal-list-item.tsx`
  - [ ] 每条显示：日期（格式化中文如"3 天前"）、心情表情 emoji、日记摘要（前 50 字截断）、AI 金句（如有，小字灰色）
  - [ ] 点击跳转到 `/history/[id]` 详情页

- [ ] Task 3: 首页入口按钮 (AC: 全部)
  - [ ] 在首页底部添加 "查看过往记录" Tertiary 文字按钮
  - [ ] 点击跳转到 `/history` 页面，使用 Framer Motion 淡入淡出过渡

- [ ] Task 4: API 路由 — 分页获取日记 (AC: 分页)
  - [ ] 新建 `src/app/api/journals/route.ts`（GET，需用户鉴权）
  - [ ] 查询参数：`page`（默认 1）、`limit`（默认 20）
  - [ ] 返回格式：`{ data: Journal[], meta: { page, total, hasMore } }`

## Dev Notes

### 技术约束

- **框架**: Next.js 16.2.3 App Router（Server Components 默认）
- **此页面**: `src/app/history/page.tsx` 作为 Server Component，直接从 Supabase 查询数据
- **React 19.2.4** — Server Components 不支持 `useState`/`useEffect`
- **需要用户已登录** — 通过 `middleware.ts` 鉴权，未登录重定向到 `/auth/login`

### 样式约束

- **TailwindCSS v4** — 使用 `@theme` 指令
- **「暖日」色板**:
  - `bg-background` / `#FDF8F5` — 页面背景
  - `--primary` / `#E8C4A0` — 主色
  - `--accent` / `#D4856A` — 强调色
  - `--secondary` / `#F5EDE4` — 卡片背景
  - `--text-primary` / `#3D3D3D` — 主文字
  - `--text-secondary` / `#8A817C` — 次要文字
- **圆角**: `rounded-lg`（16px），列表项卡片 `rounded-md`（12px）
- **字体**: Noto Serif SC（标题）, Noto Sans SC（正文）
- **间距**: 列表项之间 16px (`gap-4`)

### 动画约束

- **Framer Motion 12.38.0** — 页面过渡使用淡入淡出（0.3s）
- 列表项入场：从上往下依次 fade-in + slide-up（stagger 动画）
- 尊重 `prefers-reduced-motion`：跳过动画直接显示

### 类型约束

- 使用 `Journal` 类型（`types/index.ts` 中已定义）
- 使用 `MoodLevel = 1 | 2 | 3 | 4 | 5`
- 使用 `MOOD_MAP` 作为表情 → emoji/label 映射源
- 数据库 `journals` 表字段: `id`, `user_id`, `content`, `mood`, `mood_emoji`, `ai_response`, `golden_quote`, `mood_label`, `created_at`, `status`

### 架构合规

- **API 路由**: `/api/journals` GET — 需用户鉴权（复用 `middleware.ts` 模式）
- **分页查询**: Supabase `.range()` 实现分页，返回 `{ data, meta: { page, total, hasMore } }`
- **错误处理**: 查询失败 → 显示中文错误提示，不抛异常阻断
- **加载状态**: 骨架屏浅米色 `#F5EDE4` 闪烁（shadcn Skeleton）
- **空状态**: 复用 `empty-state.tsx`，文案："还没有记录，写下第一篇吧 ✨"

### 复用现有组件

- `empty-state.tsx` — 无日记空状态
- `mood-selector.tsx` 中的 `MOOD_MAP` — 表情映射
- shadcn `skeleton.tsx` — 加载骨架屏
- shadcn `button.tsx` — "查看过往记录" 按钮

### Architecture Compliance

- **Source**: [architecture.md](file:///D:/WorkPlace/VibeCoding/Xiaozhi%20Journal/_bmad-output/planning-artifacts/architecture.md) — `/api/journals` GET 端点已定义，分页格式已指定
- **Source**: [architecture.md](file:///D:/WorkPlace/VibeCoding/Xiaozhi%20Journal/_bmad-output/planning-artifacts/architecture.md) — 路由鉴权：`/api/journals` 需用户鉴权
- **Source**: [epics.md](file:///D:/WorkPlace/VibeCoding/Xiaozhi%20Journal/_bmad-output/planning-artifacts/epics.md) — Epic 5 Story 5.1 完整 AC
- **Source**: [project-context.md](file:///D:/WorkPlace/VibeCoding/Xiaozhi%20Journal/docs/project-context.md) — AI Agent 规则 #6 (命名), #7 (色板), #1 (Next.js 16)

### Testing Standards

- 本项目不写单元测试，手动验证
- 验证要点：
  1. 首页有 "查看过往记录" 入口
  2. 点击进入历史列表页
  3. 日记按时间倒序显示
  4. 每条显示日期、表情、摘要、金句
  5. 无日记时显示空状态
  6. 超过 20 条时支持分页加载更多

### File Structure Requirements

- **新建**: `src/app/history/page.tsx` — 历史列表页（Server Component）
- **新建**: `src/app/api/journals/route.ts` — GET 分页获取日记
- **新建**: `src/components/journal-list-item.tsx` — 列表项组件
- **修改**: `src/app/page.tsx` — 首页添加 "查看过往记录" 入口按钮
- **复用**: `src/components/empty-state.tsx` — 空状态
- **复用**: `src/components/ui/skeleton.tsx` — 骨架屏

## Dev Agent Record

### Agent Model Used

qwen3.6-plus

### Debug Log References

- `pnpm lint` — 0 errors, 0 warnings
- `npx tsc --noEmit` — 0 errors
- `pnpm build` — SUCCESS, `/history` route confirmed

### Completion Notes List

1. **API 路由 `/api/journals`** — GET 分页查询，使用 `withAuth` 中间件鉴权，`createJsonResponseWithCookies` 保留 cookie 刷新。Supabase `.range()` 分页，每页 20 条。返回格式 `{ data: Journal[], meta: { page, total, hasMore } }`。DB `snake_case` → 前端 `camelCase` 字段映射。
2. **JournalListItem 组件** — Client Component (`'use client'`)，`Link` 包裹，显示日期、心情 emoji、摘要（50 字截断）、金句（可选）。使用 `bg-white rounded-2xl p-5 shadow-sm` 卡片样式，`hover:shadow-md` 交互。
3. **History 页面重写** — 从 `'use client'` + IndexedDB 改为 Server Component + Supabase 直查。`createClient()` 获取 Supabase 客户端，`supabase.auth.getUser()` 鉴权，未登录 redirect 到 `/auth/login`。分页通过 `searchParams` Promise 传递，服务端 `.range()` 查询。空数据展示 EmptyState。
4. **首页入口** — 移除 `{journals.length > 0 && ...}` 条件，始终显示 "查看过往记录" 链接。
5. **TypeScript** — `MoodLevel` 显式 cast 解决 `row.mood: number` 类型不匹配。

### File List

- `src/app/api/journals/route.ts` — 新建，GET 分页 API
- `src/components/journal-list-item.tsx` — 新建，列表项组件
- `src/app/history/page.tsx` — 重写，Server Component + Supabase 查询 + 分页
- `src/app/page.tsx` — 修改，始终显示历史入口
