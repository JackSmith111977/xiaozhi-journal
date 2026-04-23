<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

<!-- BEGIN:sentry-agent-rules -->
# Sentry Next.js SDK v10+ Rules

- **v10 Migration**: OpenTelemetry v2, FID removed (use INP), `enableLogs` is official API (not `_experiments`)
- **Config files**: `sentry.client.config.ts`, `sentry.server.config.ts`, optional `sentry.edge.config.ts`
- **User context**: Call `Sentry.setUser({ id, email })` after login, `Sentry.setUser(null)` on logout
- **beforeSend**: Use for PII scrubbing, URL attachment. Returning `null` drops the event.
- **Source Maps**: `SENTRY_AUTH_TOKEN` only in CI, never commit to repo
- **Performance**: `tracesSampleRate: 0.1` in production, `1.0` in development
- **Alerts**: v10 does not support FID metrics, use INP for performance alerts
- **Reference**: `_bmad-output/standards/sentry-nextjs-best-practices.md`
<!-- END:sentry-agent-rules -->
