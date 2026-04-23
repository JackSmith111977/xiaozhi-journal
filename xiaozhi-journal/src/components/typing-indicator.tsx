'use client';

import { motion, useReducedMotion } from 'motion/react';

export function TypingIndicator() {
  const shouldReduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="flex items-center gap-2 text-muted-foreground text-sm py-3 font-sans"
    >
      <span>小知正在想...</span>
      <div className="flex gap-1">
        {[0, 1, 2].map((i) => (
          <motion.div
            key={i}
            className="w-2 h-2 rounded-full bg-muted-foreground"
            animate={shouldReduceMotion ? undefined : { y: [0, -6, 0] }}
            transition={shouldReduceMotion ? undefined : { duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
          />
        ))}
      </div>
    </motion.div>
  );
}
