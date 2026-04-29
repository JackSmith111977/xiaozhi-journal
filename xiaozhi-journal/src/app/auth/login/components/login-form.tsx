'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, sendEmailConfirmation } from '@/lib/auth';
import { motion } from 'motion/react';
import { useReducedMotion } from 'motion/react';
import { AuthInput } from './auth-input';

interface LoginFormProps {
  email: string;
  onEmailChange: (email: string) => void;
  onModeSwitch: (mode: 'reset' | 'register') => void;
}

export function LoginForm({ email, onEmailChange, onModeSwitch }: LoginFormProps) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
    return () => {
      // eslint-disable-next-line react-hooks/exhaustive-deps -- timer ref is intentionally accessed for cleanup
      const timer = redirectTimerRef.current;
      if (timer) clearTimeout(timer);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      await signIn(email, password);
      router.push('/');
    } catch (err: unknown) {
      if (err instanceof Error) {
        if (err.message?.includes('Email not confirmed')) {
          setError('请先验证你的邮箱，检查收件箱或重新发送验证邮件');
        } else if (err.message?.includes('Invalid login credentials')) {
          setError('邮箱或密码不正确');
        } else {
          setError(err.message);
        }
      } else {
        setError('登录失败，请稍后重试');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!email) return;
    setError(null);
    setLoading(true);
    try {
      await sendEmailConfirmation(email);
      setSuccess('已重新发送验证邮件，请查收');
    } catch {
      setError('发送失败，请稍后重试');
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
            placeholder="请输入邮箱"
            autoComplete="email"
          />
        </div>

        <div className="mb-6">
          <AuthInput
            type="password"
            value={password}
            onChange={setPassword}
            placeholder="请输入密码"
            autoComplete="current-password"
          />
        </div>

        <button
          type="submit"
          disabled={loading || !email || password.length < 8}
          className="w-full py-3 rounded-xl text-primary-foreground font-medium bg-primary transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {loading ? '处理中...' : '登录'}
        </button>

        <div className="text-center mt-4">
          <button
            type="button"
            onClick={() => onModeSwitch('reset')}
            className="text-xs text-accent hover:underline"
          >
            忘记密码？
          </button>
        </div>
      </form>

      {error && (
        <motion.div
          initial={shouldReduceMotion ? undefined : { opacity: 0 }}
          animate={shouldReduceMotion ? undefined : { opacity: 1 }}
          className="text-center mt-4"
        >
          <p className="text-sm text-accent">{error}</p>
          {(error.includes('先验证你的邮箱') || error.includes('重新发送验证邮件')) && (
            <button
              type="button"
              onClick={handleResend}
              className="text-xs text-accent hover:underline mt-1"
            >
              重新发送验证邮件
            </button>
          )}
        </motion.div>
      )}

      {success && (
        <motion.p
          initial={shouldReduceMotion ? undefined : { opacity: 0 }}
          animate={shouldReduceMotion ? undefined : { opacity: 1 }}
          className="text-center text-sm text-chart-1 mt-4"
        >
          {success}
        </motion.p>
      )}
    </div>
  );
}
