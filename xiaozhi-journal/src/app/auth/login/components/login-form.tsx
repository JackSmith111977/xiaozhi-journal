'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { signIn, sendEmailConfirmation } from '@/lib/auth';
import { Eye, EyeOff } from 'lucide-react';
import { motion } from 'motion/react';
import { useReducedMotion } from 'motion/react';
import { AuthInput } from './auth-input';

// ── Remember duration options ──────────────────────────────────────────────────
const REMEMBER_OPTIONS = [
  { label: '不保持', value: 'none' as const },
  { label: '24小时', value: '24h' as const },
  { label: '7天', value: '7d' as const },
  { label: '30天', value: '30d' as const },
];

const LAST_EMAIL_KEY = 'xiaozhi:lastEmail';
const LAST_REMEMBER_KEY = 'xiaozhi:lastRememberDuration';

interface LoginFormProps {
  email: string;
  onEmailChange: (email: string) => void;
  onModeSwitch: (mode: 'reset' | 'register') => void;
}

function readSavedPreferences(): { email: string; rememberDuration: 'none' | '24h' | '7d' | '30d' } {
  try {
    const email = localStorage.getItem(LAST_EMAIL_KEY) ?? '';
    const duration = localStorage.getItem(LAST_REMEMBER_KEY);
    const rememberDuration =
      duration === 'none' || duration === '24h' || duration === '7d' || duration === '30d'
        ? (duration as 'none' | '24h' | '7d' | '30d')
        : ('7d' as const);
    return { email, rememberDuration };
  } catch {
    return { email: '', rememberDuration: '7d' as const };
  }
}

export function LoginForm({ email, onEmailChange, onModeSwitch }: LoginFormProps) {
  const router = useRouter();
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [rememberDuration, setRememberDuration] = useState<
    'none' | '24h' | '7d' | '30d'
  >(() => readSavedPreferences().rememberDuration);
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shouldReduceMotion = useReducedMotion();

  // Restore remembered email on mount
  useEffect(() => {
    const savedEmail = readSavedPreferences().email;
    if (savedEmail) onEmailChange(savedEmail);
  }, [onEmailChange]);

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

      // Remember email and duration
      try {
        localStorage.setItem(LAST_EMAIL_KEY, email);
        localStorage.setItem(LAST_REMEMBER_KEY, rememberDuration);
      } catch {
        // localStorage unavailable
      }

      // Note: "不保持" session expiry is handled by the browser's cookie
      // lifecycle — session cookies are cleared on browser close.
      // Supabase refresh tokens persist longer, but the auth gate will
      // redirect to login if the session is stale.

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

        {/* Password input with visibility toggle */}
        <div className="mb-4 relative">
          <AuthInput
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={setPassword}
            placeholder="请输入密码"
            autoComplete="current-password"
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            aria-label={showPassword ? '隐藏密码' : '显示密码'}
            className="absolute right-0 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
          >
            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
          </button>
        </div>

        {/* Remember duration selector */}
        <div className="mb-6">
          <p className="text-xs text-muted-foreground mb-2">保持登录</p>
          <div className="flex gap-2">
            {REMEMBER_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => setRememberDuration(opt.value)}
                className={`flex-1 py-2 px-1 text-xs rounded-lg border transition-colors ${
                  rememberDuration === opt.value
                    ? 'bg-accent text-primary-foreground border-accent'
                    : 'bg-secondary text-muted-foreground border-border'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
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
