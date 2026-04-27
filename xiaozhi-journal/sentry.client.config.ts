import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.VERCEL_ENV || process.env.NODE_ENV,
  tracesSampleRate: process.env.VERCEL_ENV === 'production' ? 0.1 : 1.0,
  integrations: [Sentry.replayIntegration()],
  replaysSessionSampleRate: 0,
  replaysOnErrorSampleRate: 1.0,
  beforeSend(event) {
    // 噪音过滤 — 浏览器扩展/三方 SDK 已知噪音
    const exceptionType = event.exception?.values?.[0]?.type;
    const exceptionValue = event.exception?.values?.[0]?.value;
    if (
      exceptionType === 'ExtensionContextInvalidated' ||
      exceptionType === 'SecurityError' ||
      exceptionValue?.includes('ResizeObserver loop limit exceeded')
    ) {
      return null;
    }

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