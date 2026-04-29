/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { updatePassword } from '@/lib/auth';
import { validatePassword, passwordsMatch } from '@/lib/password-policy';
import { PasswordStrength } from '@/components/password-strength';
import { AuthGuard } from '@/components/auth-guard';
import { motion } from 'motion/react';

type FlowType = 'recovery' | 'confirmation' | null;

export default function CallbackPage() {
  return (
    <AuthGuard requireAuth={false}>
      <CallbackContent />
    </AuthGuard>
  );
}

function CallbackContent() {
  const router = useRouter();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const _searchParams = useSearchParams();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [validToken, setValidToken] = useState<boolean | null>(null);
  const [flow, setFlow] = useState<FlowType>(null);
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    };
  }, []);

  useEffect(() => {
    // Determine flow type from URL hash (Supabase redirects with #type=recovery or #type=signup)
    let detectedFlow: FlowType = null;
    try {
      const hash = window.location.hash;
      const hashParams = new URLSearchParams(hash.replace('#', ''));
      const type = hashParams.get('type');

      if (type === 'recovery') {
        detectedFlow = 'recovery';
      } else if (type === 'signup' || type === 'invite') {
        detectedFlow = 'confirmation';
      }
    } catch {
      // Malformed hash - ignore and continue with default flow
    }
    setFlow(detectedFlow);

    // Check if user has a valid session
    supabase.auth.getUser().then(({ data: { user }, error }) => {
      if (error || !user) {
        setValidToken(false);
      } else {
        setValidToken(true);
      }
    });
  }, []);

  const passwordResult = validatePassword(password);
  const isPasswordStrong = passwordResult.valid;
  const doPasswordsMatch = passwordsMatch(password, confirmPassword);
  const canSubmit = isPasswordStrong && doPasswordsMatch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validToken) {
      setError('链接已失效，请重新申请重置');
      return;
    }

    if (!canSubmit) {
      if (!isPasswordStrong) {
        setError('密码需要至少 8 位，包含大小写字母和数字');
        return;
      }
      if (!doPasswordsMatch) {
        setError('两次密码不太一样哦~');
        return;
      }
    }

    setLoading(true);
    try {
      await updatePassword(password);
      setSuccess('密码已更新，请使用新密码登录');
      redirectTimerRef.current = setTimeout(() => router.push('/auth/login'), 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '密码更新失败');
    } finally {
      setLoading(false);
    }
  };

  // ── Loading ──────────────────────────────────────────────────────
  if (validToken === null) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground animate-pulse">验证中...</div>
      </main>
    );
  }

  // ── Invalid/Expired Link ─────────────────────────────────────────
  if (!validToken) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md text-center"
        >
          <h1 className="text-2xl text-foreground mb-4 font-serif">
            链接无效
          </h1>
          <p className="text-muted-foreground mb-6">链接已过期，请重新申请重置。</p>
          <button
            type="button"
            onClick={() => router.push('/auth/login')}
            className="px-6 py-3 rounded-xl text-white font-medium bg-primary"
          >
            返回登录
          </button>
        </motion.div>
      </main>
    );
  }

  // ── Email Confirmation Success ───────────────────────────────────
  if (flow === 'confirmation') {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md text-center"
        >
          <div className="text-6xl mb-6">✨</div>
          <h1 className="text-2xl text-foreground mb-4 font-serif">
            邮箱确认成功
          </h1>
          <p className="text-muted-foreground mb-8">
            邮箱已验证，开始你的第一篇日记吧
          </p>
          <button
            type="button"
            onClick={() => router.push('/auth/settings')}
            className="w-full py-3 rounded-xl text-primary-foreground font-medium bg-primary"
          >
            设置个人资料
          </button>
          <button
            type="button"
            onClick={() => router.push('/')}
            className="w-full py-3 rounded-xl text-accent font-medium mt-3 hover:underline"
          >
            稍后再说，先去写日记
          </button>
        </motion.div>
      </main>
    );
  }

  // ── Password Reset ───────────────────────────────────────────────
  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <h1 className="text-2xl text-foreground text-center mb-8 font-serif">
          重置密码
        </h1>

        <form onSubmit={handleSubmit}>
          {/* New Password */}
          <div className="mb-6">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入新密码（至少 8 位，含大小写+数字）"
              required
              autoComplete="new-password"
              className="w-full bg-transparent border-b-2 border-border py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent transition-colors font-sans"
            />
            <PasswordStrength password={password} />
          </div>

          {/* Confirm Password */}
          <div className="mb-6">
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="请再次输入密码"
              required
              autoComplete="new-password"
              className="w-full bg-transparent border-b-2 border-border py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent transition-colors font-sans"
            />
            {confirmPassword.length > 0 && !doPasswordsMatch && (
              <p className="text-xs mt-1" style={{ color: '#D4856A' }}>
                两次密码不太一样哦~
              </p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!canSubmit || loading}
            className="w-full py-3 rounded-xl text-primary-foreground font-medium bg-primary transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? '处理中...' : '更新密码'}
          </button>
        </form>

        {/* Success / Error messages */}
        {success && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-sm text-chart-1 mt-4"
          >
            {success}
          </motion.p>
        )}
        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-sm text-accent mt-4"
          >
            {error}
          </motion.p>
        )}
      </motion.div>
    </main>
  );
}
