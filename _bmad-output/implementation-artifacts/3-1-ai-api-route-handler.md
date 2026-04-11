Status: review

# Story 3.1: AI 代理 API Route Handler

## Story

As a 保存了日记的用户,
I want 系统自动调用 AI 获取回应,
so that 我能收到温暖的回应和金句。

## Acceptance Criteria

1. **Given** 用户提交了一篇日记（status 为 `pending`）
   **When** 前端调用 `POST /api/journal`，请求体 `{ content, mood }`
   **Then** Route Handler 从 `process.env.DASHSCOPE_API_KEY` 读取 API Key
   **And** 以 OpenAI 兼容格式调用阿里云百炼 API
   **And** System Prompt 为 PRD 定义的内容（"你是一个温暖、有个性的朋友..."）
   **And** 请求 AI 返回 JSON：`{ response: string, goldenQuote: string, moodLabel: string }`
   **And** 设置 15 秒超时

2. **Given** AI 调用成功
   **When** 收到响应
   **Then** 返回 200：`{ response, goldenQuote, moodLabel, fromFallback: false }`

3. **Given** AI 调用超时（>15s）或网络错误
   **When** 发生超时或异常
   **Then** 返回 200 + `fromFallback: true`
   **And** 使用本地 fallback 金句库（`lib/ai.ts` 中预设 5-10 条通用金句）

4. **Given** AI 返回的 JSON 解析失败
   **When** 解析失败
   **Then** 重试一次
   **And** 如果仍然失败，返回 fallback 数据 + `fromFallback: true`

## Tasks / Subtasks

- [x] Task 1: 创建 AI 调用库 (AC: #1, #3, #4)
  - [x] 在 `lib/ai.ts` 实现 AI 调用逻辑
  - [x] 定义 system prompt（"你是一个温暖、有个性的朋友..."）
  - [x] 实现 15 秒超时控制
  - [x] 实现本地 fallback 金句库（5-10 条）
  - [x] 实现 JSON 解析失败重试逻辑
- [x] Task 2: 实现 API Route Handler (AC: #1, #2, #3, #4)
  - [x] 创建 `app/api/journal/route.ts`
  - [x] 实现 POST handler，读取 DASHSCOPE_API_KEY
  - [x] 实现成功/超时/失败/解析错误等不同场景的响应
  - [x] 所有降级返回 200 + `fromFallback: true`，不走 HTTP error

## Dev Notes

### API 契约
**请求体：** `{ content: string, mood: number }`
**响应体（成功）：** `{ response: string, goldenQuote: string, moodLabel: string, fromFallback: false }`
**响应体（降级）：** `{ response: string, goldenQuote: string, moodLabel: "本地", fromFallback: true }`

### 错误处理标准
- 15 秒超时 → 本地 fallback 金句
- 网络错误 → 本地 fallback 金句
- JSON 解析失败 → 重试一次 → 失败则 fallback
- 所有降级不走 HTTP error，返回 200 + `fromFallback: true`

### System Prompt 核心
> 你是一个温暖、有个性的朋友。用户写日记后，你给出 2-3 句回应：先共情他的感受，再用一个独特的角度帮他重新看待这件事。不要用鸡汤话，要真实有共鸣。最后用一句话提炼这篇日记的"金句"，像一句诗。

### References
- [Source: architecture.md#API & Communication Patterns]
- [Source: architecture.md#Error Handling Patterns]
- [Source: prd.md#AI 人格定义]

## Dev Agent Record

### Agent Model Used

{{agent_model_name_version}}

### Debug Log References

### Completion Notes List

### File List
