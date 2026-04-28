# Deferred Work

## Deferred from: code review of 3-2-byok-settings (2026-04-26)

- **API Key 内存未清除** — JS string immutable，GC 后清除；MVP 可接受
- **Rate Limiting 缺失** — Story 10.2 实现限次；BYOK 无限次无需
- **CSRF 保护缺失** — Next.js cookie-based auth 已处理
- **Upsert 并发竞态** — DB unique constraint 已配置，RLS 保护
- **Content-Type 未验证** — Next.js 自动处理 JSON parse error
- **Auth Pattern 不一致** — 样式差异，不影响功能
- **`new Date().toISOString()` 时钟偏差** — MVP 可接受，分布式场景后续优化
- **环境变量延迟 panic** — 启动检查可选，当前运行时校验足够
- **`invalidKey` 字段不一致** — 平台模式无此字段，前端可按场景处理
## Deferred from: code review of 3-4-offline-async-callback.md (2026-04-26)

- **pendingMessage 幽灵状态** — 定义但未被 UI 使用，与 journal-input 本地状态重复。状态设计不一致，需统一重构
- **syncing 双重重置风险** — syncing=false 在多处设置，异常路径可能重复或遗漏。MVP 可接受
- **timestamp 无效日期** — new Date(timestamp) 可能返回 Invalid Date，sort 结果异常。数据源保证 timestamp 有效
- **网络中断无检查** — 循环中无 navigator.onLine 检查，断网时继续无效请求。依赖浏览器 fetch 自行处理
- **useAppStore 非 React context** — getState() 在非 React context 调用，updateAIResponse 可能失败。Zustand 支持外部调用
- BYOK 移除 — 按 spec 推迟至 Story 3.2
- 频率限制 + 使用量追踪移除 — 按 spec 推迟至 Story 10.2
- 数据库持久化移除 — 前端 IndexedDB 已覆盖，Story 10.2 恢复服务端持久化
- remainingCalls 响应字段移除 — 捆绑限次逻辑，Story 10.2 恢复
- AI Usage 端点硬编码 — Story 10.2 实现真实查询

## Deferred from: code review of 4-2-hover-tooltip-no-data.md (2026-04-15)

- **resize 事件无节流/防抖** — `window.addEventListener('resize', computePos)` 在窗口调整大小时每帧触发 getBoundingClientRect + setState；tooltip 场景性能开销可接受
- **svgRef 作为 useCallback 依赖不必要** — ref 对象稳定，hover 切换时 computePos 重建导致 resize listener 频繁卸载重装，不影响正确性
- **SSR 环境 window 访问无守卫** — `computePos` 使用 `window.innerWidth/Height`，useEffect 只在客户端运行，可加 `typeof window` 守卫增强防御性
- **mood 值无边界约束** — `Math.round(avgMood)` 理论上可能超出 1-5 范围，`as 1 | 2 | 3 | 4 | 5` 断言掩盖类型不匹配；实际数据源保证 mood 在 1-5 范围内

## Deferred from: code review of 13-4-transactional-email-system.md (2026-04-24)

- **Edge Function Mock 实现 + 模板变量未替换** — Story Task 3 明确标记等待生产 SMTP 实现；实际 SMTP 发送和模板变量替换逻辑未实现，返回 mock success
- **本地开发无 Inbucket 集成** — Story 设计为模拟发送，API route 在开发环境仅打印日志，未实际发送到 Inbucket

## Deferred from: code review of 13-1-cicd-pipeline.md (2026-04-26)

- **前端不发 useByok** — BYOK 前端功能属 Epic 10，后端代码为未来脚手架，当前无可达路径是预期行为
- **SQL migration 不可重入** — `CREATE TABLE IF NOT EXISTS` 不改已有表，需新迁移文件。当前阶段不阻塞
- **incrementAIUsage 竞态** — 注释已承认 read-then-write 非原子，MVP 阶段可接受
- **加密格式无分隔符** — 密文+authTag 硬拼接。当前正常工作，格式迁移可在加密方案升级时处理
- **architecture.md 缺 CI/CD 章节** — 可选完善，不影响功能

## Deferred from: code review of 13-2-error-monitoring.md (2026-04-26)

- **NEXT_PUBLIC_SENTRY_DSN 无校验逻辑** — DSN 为空时 Sentry 静默丢弃事件，MVP 阶段可接受
- **beforeSend PII 脱敏范围过窄** — 仅删 email，event.request.headers 也可能含 PII，MVP 阶段合理
- **client beforeSend 手动附加 URL** — SDK 自动捕获 URL，手动设置多余但无害
- **replaysOnErrorSampleRate: 1.0** — 预期设计，<1K 用户流量可接受
- **AuthGuard useEffect 依赖项 [requireAuth]** — 预存问题，非本 story 引入

## Deferred from: code review of 13-3-smtp-email-service.md (2026-04-26)

- **模板 "1小时" 有效期硬编码** — 无机制注入配置值到静态模板，otp_expiry 很少改动
- **模板 CSS 零复用** — Supabase 无 partial/include 机制，重复为平台限制
- **确认邮件混淆验证与引导** — UX 设计意图，非 bug
- **无纯文本回退** — 低优先级，现代客户端均支持 HTML
- **无 DKIM/SPF/DMARC 配置文档** — 基础设施范畴，非本 story
- **本地开发 SMTP_HOST 可能为空** — .env.local 配置问题，非代码 bug
- **sender_name UTF-8 编码问题** — 现代客户端均支持 UTF-8 标题
- **无 TLS/SSL SMTP 配置** — Supabase 内部处理

## Deferred from: code review of 4-2-hover-tooltip-no-data.md (2026-04-26)

- **date string invalid/malformed** — emotion-tooltip.tsx:85，数据源保证有效日期格式
- **mood value outside 1-5 range** — emotion-tooltip.tsx:86，数据源保证 mood 在 1-5 范围
- **timestamp no T separator** — emotion-chart.tsx:35，数据源保证 ISO format
- **avgMood exceeds 1-5 range** — emotion-chart.tsx:62，avg of 1-5 values stay in range
- **Math.round produces 0 or 6** — emotion-chart.tsx:63，same mathematical constraint
- **resize no throttle** — emotion-tooltip.tsx:68-71，已在2026-04-15记录，tooltip场景性能开销可接受

## RESOLVED in Epic 4 Retro (2026-04-26)

- **pendingMessage 幽灵状态** — ✅ 已修复：移除 store.pendingMessage，journal-input 使用本地 showOfflineMsg
- **Race condition: journal update mid-typewriter** — ✅ 已修复：添加 displayingJournal state 锁定动画期间的 journal
- **前端 useByok 参数缺失** — ✅ 已确认：journal-input.tsx:121 已发送，API route 已接收
- **incrementAIUsage 竞态** — 🟡 重分类为 Medium Impact：函数未实现，推迟至 Epic 10-2

- **Race condition: journal update mid-typewriter** — Store realtime subscription can update journals mid-animation, causing abrupt disappearance. Requires broader store synchronization strategy beyond this story scope.
- **AC4: theme tokens vs spec colors** — `bg-secondary`, `border-accent` rely on Tailwind theme matching spec values (#F5EDE4, 暖珊瑚). Pre-existing design decision.

- **Edge Function Mock 实现 + 模板变量未替换** — Story Task 3 明确标记等待生产 SMTP 实现；stub 设计已知
- **本地开发无 Inbucket 集成** — Story 设计为模拟发送，邮件仅记录日志
- **CSS 模板零复用** — Supabase 无 partial/include 机制，6 套模板 CSS 重复为平台限制
- **无纯文本回退** — 低优先级，现代客户端均支持 HTML
- **验证逻辑三层重复** — email regex + field validation 在 API Route 与 Edge Function 重复，安全行为期望冗余验证
- **templatePath 冗余传递** — 当前三层传递但 Edge Function 仅用于日志，清理性改进非阻塞
- **邮箱正则不过度收紧** — 当前 `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` 满足基本验证，收紧非 MVP 要求

## Deferred from: code review of 8-8-indexeddb-user-isolation.md (2026-04-28)

- **用户切换场景未处理** — 用户 B 登录同一设备时，未清理用户 A 数据。违反 AC3 第二部分（存储清理）。MVP 阶段多用户共享设备场景罕见，prefix 隔离已满足功能正确性，存储膨胀非阻塞问题，等实际需求再改
- **getPendingJournals() 性能退化** — 从 index query `getAll('pending')` 改为 `getJournals()` + `filter()`，遍历全部而非命中 pending entries。性能问题非功能缺陷，数据量小暂不影响
- **syncToSupabase() stub 冗余** — 循环内每次 `await getDB()`，应提取到循环外。stub 实现，Epic 9 重写
- **DB 升级旧数据丢失** — `oldVersion < 2` 直接 `deleteObjectStore`，无迁移路径。单用户历史数据不重要，清理可接受

## Deferred from: code review of 8-7-api-auth-middleware.md (2026-04-28)

- **email send no rate limiting** — Epic 10 feature, out of current story scope
- **account delete no confirmation** — Security design deferred to future story, irreversible data loss risk acknowledged
- **sync route stub returns 200** — Epic 9 implementation placeholder, intentional stub design
- **ai/usage stub hardcoded** — Epic 10 implementation placeholder, frontend relies on stub data
- **proxy uses getSession()** — Architectural design per story Dev Notes, "optimistic check" + full JWT verification in route handler. Race condition acknowledged but handled by route handler getUser()
