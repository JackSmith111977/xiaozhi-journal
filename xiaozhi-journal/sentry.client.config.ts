import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NODE_ENV,
  tracesSampleRate: process.env.NODE_ENV === 'development' ? 1.0 : 0.1,
  integrations: [Sentry.replayIntegration()],
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,
  beforeSend(event) {
    // 附加当前页面 URL
    if (typeof window !== 'undefined') {
      event.contexts = {
        ...event.contexts,
        browser: { url: window.location.href },
      };
    }
    // PII 脱敏 — 不上报邮箱
    if (event.user?.email) {
      delete event.user.email;
    }
    return event;
  },
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;