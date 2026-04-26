# Story 3.1: AI 代理 API Route Handler（平台 Key）

Status: done

---

## Story

As a 保存了日记的用户,
I want 系统自动调用 AI 获取回应,
So that 我能收到温暖的回应和金句。

---

## Acceptance Criteria

### AC1: Route Handler 创建 + 平台 Key 调用

**Given** 用户提交了一篇日记（status 为 `pending`）
**When** 前端调用 `POST /api/journal`，请求体 `{ id, content, mood }`
**Then** 从 `process.env.DASHSCOPE_API_KEY` 读取平台 API Key
**And** 以 OpenAI 兼容格式调用阿里云百炼 API（`qwen-turbo`）
**And** System Prompt 为共情回应的角色设定
**And** 请求 AI 返回 JSON：`{ response: string, goldenQuote: string, moodLabel: string }`
**And** 设置 15 秒超时（AbortController）

### AC2: AI 成功响应

**Given** AI 调用成功
**When** 收到响应
**Then** 返回 200：`{ id, response, goldenQuote, moodLabel, fromFallback: false }`
**And** 前端 store 调用 `updateAIResponse()` 更新本地缓存

### AC3: AI 超时/网络错误降级

**Given** AI 调用超时（>15s）或网络错误
**When** 发生超时或异常
**Then** 返回 200 + `fromFallback: true`
**And** 使用 `lib/ai.ts` 中的本地 fallback 金句库（10 条预设金句）
**And** 前端 store 调用 `updateAIResponse()` 保存 fallback 数据

### AC4: JSON 解析失败重试

**Given** AI 返回的 JSON 解析失败
**When** 解析失败
**Then** 重试一次（新 15s timeout）
**And** 如果仍然失败，返回 fallback 数据 + `fromFallback: true`

### AC5: 认证检查

**Given** 未登录用户发送请求
**When** 请求到达 `/api/journal`
**Then** 返回 `{ message: '未授权，请先登录' }` + status 401
**And** 不发起 AI 调用

---

## Tasks/Subtasks

- [x] Task 1: 创建 `/api/journal` POST Route Handler (AC: 1-5)
  - [x] Supabase session 验证（`createClient()` + `supabase.auth.getUser()`）
  - [x] 解析请求体 `{ id, content, mood }`
  - [x] 调用 `callAI(content, mood)` 获取 AI 回应
  - [x] 返回 `{ id, response, goldenQuote, moodLabel, fromFallback }`
  - [x] 错误时 catch 返回 fallback 数据
- [x] Task 2: 创建 `/api/ai/usage` GET 占位路由 (AC: 1)
  - [x] 返回 `{ platformCalls: 0, dailyLimit: 5 }` 占位数据

---

## Dev Notes

### 现有代码资产（可复用）

| 文件 | 内容 | 复用方式 |
|------|------|---------|
| `src/lib/ai.ts` | `callAI(content, mood, byokKey?)` 函数 | **直接复用** — 已有 DashScope 调用、15s 超时、JSON 解析重试、fallback |
| `src/lib/ai.ts` | `FALLBACK_QUOTES` 数组（10 条中文金句） | **直接复用** |
| `src/lib/ai.ts` | `SYSTEM_PROMPT` — 共情回应角色设定 | **直接复用** |
| `src/lib/supabase/server.ts` | `createClient()` — 服务端 Supabase 客户端 | **直接复用** — cookie-based session 验证 |
| `src/types/index.ts` | `AIResponse`, `Journal`, `MoodLevel` 类型 | **直接复用** |
| `src/lib/db.ts` | IndexedDB 操作 | **直接复用** — store updateAIResponse 已封装 |

### 需要创建

| 文件 | 说明 |
|------|------|
| `src/app/api/journal/route.ts` | POST handler — 接收日记、调用 AI、返回响应 |
| `src/app/api/ai/usage/route.ts` | 占位（Story 10.2 实现限次），当前返回 0 |

### 架构约束

- **AI 失败返回 200 + `fromFallback: true`**，不走 HTTP error code（已有模式）
- **认证**：使用 `@/lib/supabase/server` 的 `createClient()` + `supabase.auth.getUser()` 验证 session
- **API Key 安全**：`DASHSCOPE_API_KEY` 仅服务端读取，不暴露到客户端
- **响应 JSON 字段**：camelCase（`goldenQuote`, `moodLabel`, `fromFallback`）
- **Route Handler**：Next.js App Router `app/api/*/route.ts`

### 与 Epic 3 其他 Story 的边界

| Story | 职责 | 与本 Story 关系 |
|-------|------|----------------|
| 3.2 BYOK 路由 | 双模式路由 + BYOK Key 解密 | 3.1 只做平台 Key；3.2 增加 useByok 判断 |
| 3.3 打字机动画 + 金句卡片 | 前端展示动画 | 3.1 只做 API，前端展示在 3.3 |
| 3.4 离线处理 | 离线 pending 队列 + 网络恢复重试 | 3.1 只做在线调用；3.4 处理后端重试 |

### 限次逻辑

当前 Story **不实现**每日限次检查（属于 Epic 10 / Story 10.2）。`/api/journal` 当前直接调用 AI，不限次。Story 10.2 在 Route Handler 中增加 `ai_usage` 表检查。

### 请求/响应格式

**Request:**
```json
{
  "id": "uuid-string",
  "content": "今天被老板骂了",
  "mood": 2
}
```

**Success Response (200):**
```json
{
  "id": "uuid-string",
  "response": "改了 5 遍还在改，说明你没放弃自己",
  "goldenQuote": "第 5 版不是失败，是第 5 次不肯妥协的自己",
  "moodLabel": "失落",
  "fromFallback": false
}
```

**Fallback Response (200):**
```json
{
  "id": "uuid-string",
  "response": "小知暂时不在，但你的感受已经保存好了。稍后再来看看想对你说什么吧~",
  "goldenQuote": "每一段难熬的时光，都是生活在给你放假。",
  "moodLabel": "本地",
  "fromFallback": true
}
```

---

## Review Findings

### patch (all resolved)
- [x] [Review][Patch] 恢复 Sentry 集成 [route.ts] — 加回 `@sentry/nextjs` import、`Sentry.setUser()`、`Sentry.captureException()`
- [x] [Review][Patch] `mood` 参数缺范围校验 [route.ts:17] — 已恢复
- [x] [Review][Patch] `content` 参数缺 typeof + 空串校验 [route.ts:17] — 已恢复
- [x] [Review][Patch] `catch` 块无异常日志 [route.ts:34-44] — 已恢复
- [x] [Review][Patch] `catch` 返回 `id: ''` [route.ts:36] — 已修复使用真实 id
- [x] [Review][Patch] `supabase.auth.getUser()` 对 `data: null` 解构会崩溃 [route.ts:11] — 已修复前置 null 检查

### defer
- [ ] [Review][Patch] `mood` 参数缺范围校验 [route.ts:17] — 应恢复 `mood < 1 || mood > 5 || Number.isNaN(mood)` 检查
- [ ] [Review][Patch] `content` 参数缺 typeof + 空串校验 [route.ts:17] — 应恢复 `typeof content !== 'string' || content.trim().length === 0`
- [ ] [Review][Patch] `catch` 块无异常日志 [route.ts:34-44] — 应恢复 `console.error` 或 Sentry 上报
- [ ] [Review][Patch] `catch` 返回 `id: ''` [route.ts:36] — 应使用请求中的真实 id
- [ ] [Review][Patch] `supabase.auth.getUser()` 对 `data: null` 解构会崩溃 [route.ts:11] — 前置 null 检查

### defer
- [x] [Review][Defer] BYOK 移除 — 按 spec 推迟至 Story 3.2
- [x] [Review][Defer] 频率限制 + 使用量追踪移除 — 按 spec 推迟至 Story 10.2
- [x] [Review][Defer] 数据库持久化移除 — 前端 IndexedDB 已覆盖，Story 10.2 恢复服务端持久化
- [x] [Review][Defer] remainingCalls 响应字段移除 — 捆绑限次逻辑，Story 10.2 恢复
- [x] [Review][Defer] AI Usage 端点硬编码 — Story 10.2 实现真实查询

## Dev Agent Record

### 前置依赖

- ✅ `src/lib/ai.ts` 已实现（AI 调用、超时、重试、fallback）
- ✅ `src/lib/supabase/server.ts` 已实现（服务端认证）
- ✅ `src/types/index.ts` 已定义 AIResponse 类型
- ✅ `src/store/index.ts` 已有 `updateAIResponse()` 和 `addJournal()` 流程

### 实现步骤

1. 创建 `src/app/api/journal/route.ts`:
   - POST handler
   - Supabase session 验证（`createClient()` + `supabase.auth.getUser()`）
   - 解析请求体 `{ id, content, mood }`
   - 调用 `callAI(content, mood)`（不传 byokKey = 平台 Key 模式）
   - 返回 `{ id, response, goldenQuote, moodLabel, fromFallback }`
   - 错误时 catch 返回 fallback

### 不在此 Story 实现

- ~~每日限次检查~~ → Story 10.2
- ~~BYOK 路由~~ → Story 3.2
- ~~前端打字机动画~~ → Story 3.3
- ~~离线 pending 重试~~ → Story 3.4
- ~~支付/订阅检查~~ → Epic 14

### 相关文件

- `xiaozhi-journal/src/app/api/journal/route.ts` — 新建，POST Route Handler：认证 + AI 调用 + fallback
- `xiaozhi-journal/src/app/api/ai/usage/route.ts` — 新建，GET 占位路由

### Completion Notes

**Task 1 ✅**: `/api/journal` Route Handler 创建完成

- Supabase session 验证（401 未授权）
- 请求体验证（400 缺字段）
- 调用 `callAI()` 获取 AI 回应（复用现有 lib/ai.ts）
- catch 时返回 fallback 数据（200 + fromFallback: true）
- lint 检查无新增错误

**Task 2 ✅**: `/api/ai/usage` 占位路由创建完成

- 返回 `{ platformCalls: 0, dailyLimit: 5 }`
- Story 10.2 实现真实限次逻辑

### Change Log

- 创建 Story 3.1（2026-04-26）
- 2026-04-26: Task 1-2 实现完成 — `/api/journal` Route Handler + `/api/ai/usage` 占位
