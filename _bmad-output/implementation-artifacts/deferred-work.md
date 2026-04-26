# Deferred Work

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
