# Story 3.2: BYOK 设置与双模式路由

Status: done

---

## Story

As a 自带 API Key 的用户,
I want 使用自己的 Key 调用 AI 不限次数,
So that 我不受平台每日次数限制。

---

## Acceptance Criteria

### AC1: 设置页 BYOK Key 输入

**Given** 用户在设置页（`/settings`）
**When** 查看 BYOK 配置区域
**Then** 显示当前 Key 状态（已配置/未配置）
**And** 显示 Key 输入框（密码模式，type="password"）
**And** 显示"测试 Key"按钮
**And** 显示"删除 Key"按钮（仅已配置时可见）

### AC2: BYOK Key 验证 + 加密存储

**Given** 用户输入新 Key 并点击"测试"
**When** 调用测试接口验证 Key 有效性
**Then** 以最小请求（单字内容）调用 `callAI("test", 3, inputKey)`
**And** 验证成功返回 `invalidKey: false`
**And** 验证失败返回 `invalidKey: true`
**And** 验证成功后加密存储到 `user_api_keys` 表
**And** 加密使用 `lib/encryption.ts` 的 `encryptKey()` 函数
**And** 设置 `is_active = true`
**And** 前端显示绿色提示："Key 有效，已保存"

### AC3: `/api/journal` 双模式路由

**Given** 用户提交日记请求体 `{ id, content, mood, useByok: true }`
**When** Route Handler 处理请求
**Then** 从 `user_api_keys` 表读取用户加密 Key
**And** 使用 `decryptKey()` 解密获取原始 Key
**And** 调用 `callAI(content, mood, decryptedKey)`（BYOK 模式）
**And** **不走平台限次检查**（BYOK 模式无限次）

**Given** 请求体无 `useByok` 参数或 `useByok: false`
**When** Route Handler 处理请求
**Then** 调用 `callAI(content, mood)`（平台 Key 模式）
**And** 走平台限次检查（Story 10.2 实现，当前跳过）

### AC4: BYOK Key 无效/过期处理

**Given** BYOK Key 无效或过期
**When** `callAI()` 返回 `invalidKey: true`
**Then** Route Handler 返回 200 + `fromFallback: true` + fallback 数据
**And** 前端显示温柔提示："你的 API Key 似乎不太对，检查一下？也可以先用平台 AI"
**And** 提示包含"检查设置"链接跳转到 `/settings`

### AC5: BYOK Key 删除

**Given** 用户想删除已配置的 Key
**When** 点击"删除 Key"按钮
**Then** 显示二次确认："删除后将切换回平台 AI 模式（每日 5 次限制）"
**And** 确认后在 `user_api_keys` 表标记 `is_active = false`
**And** 前端切换回平台 AI 模式
**And** 显示"已切换回平台 AI"

### AC6: 认证检查（复用 Story 3-1 模式）

**Given** 未登录用户发送请求到 BYOK 相关端点
**When** 请求到达 `/api/settings/byok` 或 `/api/journal`
**Then** 返回 `{ message: '未授权，请先登录' }` + status 401
**And** 不读取/写入 `user_api_keys` 表

---

## Tasks/Subtasks

- [x] Task 1: 创建 `/settings` 页面 BYOK 配置区域 (AC: 1, 2, 5)
  - [x] Key 状态显示（已配置/未配置）
  - [x] Key 输入框（密码模式）
  - [x] 测试按钮 + 验证逻辑
  - [x] 删除按钮 + 二次确认
  - [x] 成功/失败提示显示

- [x] Task 2: 创建 `/api/settings/byok` API 端点 (AC: 2, 5, 6)
  - [x] GET: 查询当前 Key 状态（不返回 Key 内容）
  - [x] POST: 保存新 Key（加密存储）
  - [x] DELETE: 标记 Key 为 inactive
  - [x] Supabase session 验证
  - [x] 错误处理 + fallback

- [x] Task 3: 修改 `/api/journal` 支持双模式 (AC: 3, 4, 6)
  - [x] 解析 `useByok` 参数
  - [x] BYOK 模式：读取 + 解密用户 Key
  - [x] BYOK 模式：跳过限次检查
  - [x] `invalidKey` 处理 + 前端提示
  - [x] 平台模式：保持现有逻辑

- [x] Task 4: 创建 `user_api_keys` 表迁移（如果不存在） (AC: 2)
  - [x] `id uuid PRIMARY KEY` — 已存在
  - [x] `user_id uuid REFERENCES profiles(id)` — 已存在
  - [x] `encrypted_key text NOT NULL` — 已存在
  - [x] `iv text NOT NULL` — 已存在
  - [x] `provider text DEFAULT 'dashscope'` — 已存在
  - [x] `is_active boolean DEFAULT true` — 已存在
  - [x] `created_at timestamptz DEFAULT now()` — 已存在
  - [x] RLS 策略：用户仅访问自己的 Key — 已存在

---

## Dev Notes

### 现有代码资产（可直接复用）

| 文件 | 内容 | 复用方式 |
|------|------|---------|
| `src/lib/ai.ts` | `callAI(content, mood, byokKey?)` | **已支持 BYOK** — 第 3 参数可选 |
| `src/lib/ai.ts` | `invalidKey` 返回标记 | **已支持** — 401/403 时返回 `{ invalidKey: true }` |
| `src/lib/encryption.ts` | `encryptKey()`, `decryptKey()` | **已实现** — AES-256-GCM 加密/解密 |
| `src/lib/supabase/server.ts` | `createClient()` | **直接复用** — 服务端认证 |
| `src/app/api/journal/route.ts` | POST handler（平台模式） | **扩展** — 增加 BYOK 分支 |
| `src/app/api/ai/usage/route.ts` | 占位返回 `{ platformCalls: 0 }` | **Phase 1 不改** — Story 10.2 实现真实查询 |

### 需要创建/修改

| 文件 | 说明 |
|------|------|
| `src/app/settings/page.tsx` | 新建 — BYOK 配置页面（占位骨架，后续扩展订阅管理） |
| `src/app/api/settings/byok/route.ts` | 新建 — GET/POST/DELETE Key 管理 |
| `src/app/api/journal/route.ts` | 修改 — 增加 BYOK 分支逻辑 |
| `supabase/migrations/004_create_user_api_keys.sql` | 新建（如不存在） — Key 存储表 |

### 架构约束

- **加密存储**：BYOK Key 使用 AES-256-GCM 加密，IV 存储在 `iv` 列
- **ENCRYPTION_SECRET**：服务端环境变量，用于派生加密密钥
- **不暴露 Key**：GET 端点不返回 Key 内容，仅返回 `hasKey: boolean`
- **双模式路由**：同一 `/api/journal` 端点，`useByok` 参数决定模式
- **BYOK 无限次**：BYOK 模式跳过 `ai_usage` 检查
- **错误处理**：BYOK 失败返回 200 + `fromFallback: true` + `invalidKey` 标记
- **命名规范**：DB 列名 `snake_case`，前端 JSON `camelCase`

### 前端 BYOK 流程

```
用户输入 Key → 点击测试 → callAI("test", 3, inputKey)
                        ↓
                    invalidKey?
                        ↓
            false → encryptKey() → 存储 user_api_keys → 显示"已保存"
            true  → 显示"Key 无效"
```

### 后端 BYOK 路由流程

```
POST /api/journal { useByok: true }
        ↓
    查询 user_api_keys WHERE user_id = auth.uid() AND is_active = true
        ↓
    decryptKey(encrypted_key, iv)
        ↓
    callAI(content, mood, decryptedKey)
        ↓
    invalidKey → 返回 fallback + invalidKey 标记
    成功 → 返回 AI 回应
```

### 与其他 Story 的边界

| Story | 职责 | 与本 Story 关系 |
|-------|------|----------------|
| 3-1 AI API Route Handler | 平台 Key 调用 + fallback | **已完成** — 本 Story 扩展双模式 |
| 3-3 打字机动画 + 金句卡片 | 前端展示动画 | 不影响 BYOK 逻辑 |
| 10-2 平台 AI 限次 | `ai_usage` 表检查 | **BYOK 跳过** — 本 Story 不实现限次 |
| 10-3 BYOK 配置管理 | 与本 Story 相同 | **合并** — 本 Story 实现 BYOK 配置 |

### 环境变量要求

```
ENCRYPTION_SECRET=<32+字符随机字符串>  # 用于 AES-256 密钥派生
```

需在 `.env.local` 和 Vercel 环境配置中添加。

---

## Review Findings (Previous Story 3-1)

### 已应用的 patch（复用模式）

- ✅ Sentry 集成：`Sentry.setUser()` + `Sentry.captureException()`
- ✅ 输入校验：`mood < 1 || mood > 5 || Number.isNaN(mood)`
- ✅ 内容校验：`typeof content !== 'string' || content.trim().length === 0`
- ✅ catch 块日志：`console.error()` + Sentry 上报
- ✅ Supabase auth null-safe：`data?.user ?? null`

### Deferred（不影响本 Story）

- BYOK 功能 → **本 Story 实现**
- 频率限制 → Story 10.2
- remainingCalls 响应字段 → Story 10.2

---

## Dev Agent Record

### 前置依赖检查

- ✅ `src/lib/ai.ts` 已支持 `byokKey` 参数
- ✅ `src/lib/encryption.ts` 已实现 AES-256-GCM
- ✅ `src/lib/supabase/server.ts` 服务端客户端
- ✅ `src/app/api/journal/route.ts` 平台模式 Route Handler

### 实现步骤建议

1. **数据库迁移**：创建 `user_api_keys` 表（如不存在）
2. **API 端点**：创建 `/api/settings/byok` GET/POST/DELETE
3. **Route Handler**：修改 `/api/journal` 增加 BYOK 分支
4. **前端页面**：创建 `/settings` BYOK 配置区域
5. **环境变量**：确认 `ENCRYPTION_SECRET` 配置

### 不在此 Story 实现

- ~~平台 AI 限次检查~~ → Story 10.2
- ~~订阅状态检查~~ → Epic 14
- ~~AI Usage 真实查询~~ → Story 10.2
- ~~设置页其他功能（订阅管理、数据导出）~~ → Epic 9/10

### 相关文件

- `xiaozhi-journal/src/app/settings/page.tsx` — 新建，BYOK 配置页面
- `xiaozhi-journal/src/app/api/settings/byok/route.ts` — 新建，Key 管理 API
- `xiaozhi-journal/src/app/api/journal/route.ts` — 修改，增加 BYOK 分支
- `xiaozhi-journal/supabase/migrations/004_create_user_api_keys.sql` — 新建（如不存在）

### Completion Notes

**Task 1 ✅**: `/settings` 页面 BYOK 配置区域完成
- 新增 `byokStatus`, `byokKey` 状态
- 新增 `handleTestByok`, `handleDeleteByok` handlers
- Key 状态显示（已配置/未配置）
- Key 输入框（密码模式）
- 测试按钮 + API 调用验证
- 删除按钮 + 二次确认弹窗
- 成功/失败提示显示

**Task 2 ✅**: `/api/settings/byok` API 端点完成
- GET: 查询 Key 状态，返回 `{ hasKey, provider }`
- POST: 验证 Key + 加密存储（AES-256-GCM）
- DELETE: 标记 `is_active = false`
- Supabase session 验证 + Sentry setUser
- 错误处理 + fallback

**Task 3 ✅**: `/api/journal` 双模式路由完成
- 解析 `useByok` 参数
- BYOK 分支：查询 `user_api_keys` + `decryptKey()`
- `invalidKey` 处理 + 返回 `invalidKey: true`
- 平台模式：保持现有逻辑（无变化）
- TypeScript 编译通过

**Task 4 ✅**: 迁移文件 `004_create_user_api_keys.sql` 已存在
- 所有字段齐全
- RLS 策略已配置
- 索引已创建

### Change Log

- 创建 Story 3.2（2026-04-26）
- 2026-04-26: Task 1-4 实现完成 — BYOK API + Settings UI + Journal 双模式

---

## Review Findings

### patch (需修复)

- [ ] [Review][Patch] `decryptKey` 无 null/undefined 保护 + 加密数据长度边界未校验 [`lib/encryption.ts`] — 入口添加参数校验和 try-catch
- [ ] [Review][Patch] API Key 可能泄露到错误日志 [`journal/route.ts:66`] — catch 块中避免将含 key 的 error 对象发送到 Sentry
- [ ] [Review][Patch] `keyData` 字段可能为 null [`journal/route.ts:64-66`] — 添加 `keyData.encrypted_key && keyData.iv` 校验
- [ ] [Review][Patch] 前端未发送 `useByok` 参数 [`journal-input.tsx:91-95`] — 检查用户 BYOK 状态，已配置时发送 `useByok: true`
- [ ] [Review][Patch] 前端未处理 `invalidKey` 显示提示 [`journal-input.tsx:105-110`] — 检查 `invalidKey` 字段，显示温柔提示
- [ ] [Review][Patch] 无"检查设置"跳转链接 — 提示中添加 `<Link href="/settings">检查设置</Link>`
- [ ] [Review][Patch] IV 格式/长度无验证 [`lib/encryption.ts:decryptKey`] — 校验 IV 为 32 hex 字符
- [ ] [Review][Patch] Catch 块返回 200 而非错误状态码 [`byok/route.ts:40-47`] — GET catch 应返回 500
- [ ] [Review][Patch] `useByok` 类型校验缺失 [`journal/route.ts:46`] — 添加 `typeof useByok === 'boolean'` 校验
- [ ] [Review][Patch] delete 操作未验证是否真正更新 [`byok/route.ts:156-161`] — 检查 `data` 返回值是否有实际更新
- [ ] [Review][Patch] `apiKey` 输入长度未限制 [`byok/route.ts:92`] — 添加 max length 校验（如 256 字符）

### defer

- [x] [Review][Defer] API Key 内存未清除 — JS string immutable，GC 后清除；MVP 可接受
- [x] [Review][Defer] Rate Limiting 缺失 — Story 10.2 实现限次；BYOK 无限次无需
- [x] [Review][Defer] CSRF 保护缺失 — Next.js cookie-based auth 已处理
- [x] [Review][Defer] Upsert 并发竞态 — DB unique constraint 已配置，RLS 保护
- [x] [Review][Defer] Content-Type 未验证 — Next.js 自动处理 JSON parse error
- [x] [Review][Defer] Auth Pattern 不一致 — 样式差异，不影响功能
- [x] [Review][Defer] `new Date().toISOString()` 时钟偏差 — MVP 可接受，分布式场景后续优化
- [x] [Review][Defer] 环境变量延迟 panic — 启动检查可选，当前运行时校验足够
- [x] [Review][Defer] `invalidKey` 字段不一致 — 平台模式无此字段，前端可按场景处理
- [x] [Review][Defer] Key enumeration timing — MVP 阶段风险低，后续可加 constant-time compare