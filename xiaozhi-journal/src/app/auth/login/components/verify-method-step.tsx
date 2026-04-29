'use client';

import { useState, useCallback } from 'react';
import { motion } from 'motion/react';
import { useReducedMotion } from 'motion/react';

export type VerifyMethod = 'link' | 'otp';

interface VerifyMethodStepProps {
  value: VerifyMethod;
  onChange: (method: VerifyMethod) => void;
  onNext: () => void;
}

const VERIFY_OPTIONS: {
  method: VerifyMethod;
  icon: string;
  label: string;
  desc: string;
}[] = [
  { method: 'link', icon: '✉️', label: '邮件链接', desc: '点击邮件中的链接完成验证' },
  { method: 'otp', icon: '🔢', label: '验证码（OTP）', desc: '输入 6 位数字验证码' },
];

export function VerifyMethodStep({ value, onChange, onNext }: VerifyMethodStepProps) {
  const [selected, setSelected] = useState<VerifyMethod>(value);
  const shouldReduceMotion = useReducedMotion();

  const handleConfirm = useCallback(() => {
    onChange(selected);
    onNext();
  }, [selected, onChange, onNext]);

  return (
    <motion.div
      initial={shouldReduceMotion ? undefined : { opacity: 0, x: 20 }}
      animate={shouldReduceMotion ? undefined : { opacity: 1, x: 0 }}
      exit={shouldReduceMotion ? undefined : { opacity: 0, x: -20 }}
      transition={{ duration: 0.25 }}
    >
      <h2 className="text-xl text-foreground mb-2 font-serif">选择验证方式</h2>
      <p className="text-sm text-muted-foreground mb-6">
        你希望通过哪种方式验证邮箱？
      </p>

      <div className="flex flex-col gap-3 mb-6">
        {VERIFY_OPTIONS.map(({ method, icon, label, desc }) => (
          <button
            key={method}
            type="button"
            onClick={() => setSelected(method)}
            className={`flex items-start gap-4 p-4 rounded-xl border-2 transition-colors text-left ${
              selected === method
                ? 'border-accent bg-secondary'
                : 'border-border hover:border-accent'
            }`}
          >
            <div className="text-2xl">{icon}</div>
            <div>
              <div className="text-foreground font-medium text-sm">{label}</div>
              <div className="text-xs text-muted-foreground mt-1">{desc}</div>
            </div>
            {selected === method && (
              <div className="ml-auto text-accent text-lg">✓</div>
            )}
          </button>
        ))}
      </div>

      <button
        type="button"
        onClick={handleConfirm}
        className="w-full py-3 rounded-xl text-primary-foreground font-medium bg-primary"
      >
        继续
      </button>
    </motion.div>
  );
}
