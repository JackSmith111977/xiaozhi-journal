'use client';

import { useMemo } from 'react';
import { validatePassword, type PasswordResult } from '@/lib/password-policy';
import { motion } from 'motion/react';
import { useReducedMotion } from 'motion/react';

const STRENGTH_COLORS: Record<PasswordResult['strength'], string> = {
  weak: 'var(--accent)',
  medium: 'var(--placeholder)',
  strong: 'var(--chart-1)',
};

interface PasswordStrengthProps {
  password: string;
  result?: PasswordResult;
}

export function PasswordStrength({ password, result: passedResult }: PasswordStrengthProps) {
  const computedResult = useMemo(() => validatePassword(password), [password]);
  const result = passedResult ?? computedResult;
  const shouldReduceMotion = useReducedMotion();

  if (!password) return null;

  const color = STRENGTH_COLORS[result.strength];

  return (
    <motion.div
      initial={shouldReduceMotion ? undefined : { opacity: 0, y: -4 }}
      animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
      className="mt-2"
      role="status"
      aria-live="polite"
    >
      {/* 5-segment bar */}
      <div className="flex gap-1 mb-1">
        {Array.from({ length: 5 }, (_, i) => (
          <div
            key={i}
            className="h-1.5 flex-1 rounded-full transition-colors duration-200"
            style={{
              backgroundColor: i < result.segments ? color : 'var(--border)',
            }}
          />
        ))}
      </div>
      {/* Feedback text */}
      <p className="text-xs" style={{ color }}>
        {result.message}
      </p>
    </motion.div>
  );
}
