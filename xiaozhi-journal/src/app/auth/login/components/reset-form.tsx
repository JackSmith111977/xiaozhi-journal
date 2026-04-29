'use client';

import { useState } from 'react';
import { resetPassword } from '@/lib/auth';
import { motion } from 'motion/react';
import { useReducedMotion } from 'motion/react';
import { AuthInput } from './auth-input';

interface ResetFormProps {
  email: string;
  onEmailChange: (email: string) => void;
  onModeSwitch: (mode: 'login') => void;
}

export function ResetForm({ email, onEmailChange, onModeSwitch }: ResetFormProps) {
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const shouldReduceMotion = useReducedMotion();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      await resetPassword(email, `${window.location.origin}/auth/callback`);
      setSuccess('去看看邮箱吧，小知发了一封信~');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '发送失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <form onSubmit={handleSubmit}>
        <div className="mb-6">
          <AuthInput
            type="email"
            value={email}
            onChange={onEmailChange}
            placeholder="请输入注册邮箱"
            autoComplete="email"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !email}
          className="w-full py-3 rounded-xl text-primary-foreground font-medium bg-primary transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? '处理中...' : '发送重置链接'}
        </button>

        <div className="text-center mt-4">
          <button
            type="button"
            onClick={() => onModeSwitch('login')}
            className="text-xs text-accent hover:underline"
          >
            返回登录
          </button>
        </div>
      </form>

      {success && (
        <motion.p
          initial={shouldReduceMotion ? undefined : { opacity: 0 }}
          animate={shouldReduceMotion ? undefined : { opacity: 1 }}
          className="text-center text-sm text-chart-1 mt-4"
        >
          {success}
        </motion.p>
      )}

      {error && (
        <motion.p
          initial={shouldReduceMotion ? undefined : { opacity: 0 }}
          animate={shouldReduceMotion ? undefined : { opacity: 1 }}
          className="text-center text-sm text-accent mt-4"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
}
