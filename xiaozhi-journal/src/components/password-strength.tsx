'use client';

import { useMemo } from 'react';
import { validatePassword, type PasswordResult } from '@/lib/password-policy';
import { motion } from 'motion/react';

const STRENGTH_COLORS: Record<PasswordResult['strength'], string> = {
  weak: '#D4856A',
  medium: '#B5ADA9',
  strong: '#A8C5A0',
};

interface PasswordStrengthProps {
  password: string;
}

export function PasswordStrength({ password }: PasswordStrengthProps) {
  const result = useMemo(() => validatePassword(password), [password]);

  if (!password) return null;

  const color = STRENGTH_COLORS[result.strength];

  return (
    <motion.div
      initial={{ opacity: 0, y: -4 }}
      animate={{ opacity: 1, y: 0 }}
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
              backgroundColor: i < result.segments ? color : '#E8E0D8',
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
