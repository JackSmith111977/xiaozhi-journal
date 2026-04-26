# Deferred Work

## Deferred from: code review of 4-2-hover-tooltip-no-data.md (2026-04-15)

- **resize 事件无节流/防抖** — `window.addEventListener('resize', computePos)` 在窗口调整大小时每帧触发 getBoundingClientRect + setState；tooltip 场景性能开销可接受
- **svgRef 作为 useCallback 依赖不必要** — ref 对象稳定，hover 切换时 computePos 重建导致 resize listener 频繁卸载重装，不影响正确性
- **SSR 环境 window 访问无守卫** — `computePos` 使用 `window.innerWidth/Height`，useEffect 只在客户端运行，可加 `typeof window` 守卫增强防御性
- **mood 值无边界约束** — `Math.round(avgMood)` 理论上可能超出 1-5 范围，`as 1 | 2 | 3 | 4 | 5` 断言掩盖类型不匹配；实际数据源保证 mood 在 1-5 范围内

## Deferred from: code review of 13-4-transactional-email-system.md (2026-04-24)

- **Edge Function Mock 实现 + 模板变量未替换** — Story Task 3 明确标记等待生产 SMTP 实现；实际 SMTP 发送和模板变量替换逻辑未实现，返回 mock success
- **本地开发无 Inbucket 集成** — Story 设计为模拟发送，API route 在开发环境仅打印日志，未实际发送到 Inbucket
