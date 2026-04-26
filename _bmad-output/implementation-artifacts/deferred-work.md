# Deferred Work

## Deferred from: code review of 3-1-ai-api-route-handler (2026-04-26)
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

## Deferred from: code review of 13-4-transactional-email-system.md (2026-04-26)

- **Edge Function Mock 实现 + 模板变量未替换** — Story Task 3 明确标记等待生产 SMTP 实现；stub 设计已知
- **本地开发无 Inbucket 集成** — Story 设计为模拟发送，邮件仅记录日志
- **CSS 模板零复用** — Supabase 无 partial/include 机制，6 套模板 CSS 重复为平台限制
- **无纯文本回退** — 低优先级，现代客户端均支持 HTML
- **验证逻辑三层重复** — email regex + field validation 在 API Route 与 Edge Function 重复，安全行为期望冗余验证
- **templatePath 冗余传递** — 当前三层传递但 Edge Function 仅用于日志，清理性改进非阻塞
- **邮箱正则不过度收紧** — 当前 `/^[^\s@]+@[^\s@]+\.[^\s@]+$/` 满足基本验证，收紧非 MVP 要求
