'use client';

import { useEffect } from 'react';
import { motion } from 'motion/react';
import * as Sentry from '@sentry/nextjs';

export default function Error({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(error);
    console.error('[Error Boundary]', error);
  }, [error]);

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="min-h-screen bg-background flex items-center justify-center px-6"
    >
      <div className="text-center max-w-sm">
        <h1 className="text-4xl text-foreground mb-3 font-serif">出了点问题</h1>
        <p className="text-muted-foreground mb-8 font-sans">
          页面遇到了意外错误，请稍后重试。
        </p>
        <button
          onClick={reset}
          className="px-8 py-3 bg-accent text-white rounded-xl font-medium hover:bg-accent-hover transition-colors"
        >
          重新加载
        </button>
      </div>
    </motion.main>
  );
}
