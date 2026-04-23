'use client';

import { motion, useReducedMotion } from 'motion/react';

export function EmptyState() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      className="flex flex-col items-center py-8 text-center"
      animate={shouldReduceMotion ? undefined : { y: [0, -6, 0] }}
      transition={shouldReduceMotion ? undefined : { duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    >
      <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className="mb-4">
        <circle cx="40" cy="40" r="36" stroke="var(--border)" strokeWidth="2" />
        <text x="40" y="48" textAnchor="middle" fontSize="24">✨</text>
      </svg>
      <p className="text-muted-foreground text-sm font-sans">
        你的第一条日记从这里开始 ✨
      </p>
    </motion.div>
  );
}
