'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { updatePassword } from '@/lib/auth';
import { AuthGuard } from '@/components/auth-guard';
import { motion } from 'motion/react';

export default function CallbackPage() {
  return (
    <AuthGuard requireAuth={false}>
      <CallbackContent />
    </AuthGuard>
  );
}

function CallbackContent() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [validToken, setValidToken] = useState<boolean | null>(null);
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const router = useRouter();

  // Cleanup redirect timer on unmount
  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    };
  }, []);
  const isPasswordValid = password.length >= 8;
  const passwordsMatch = password === confirmPassword && !!confirmPassword;
  const canSubmit = isPasswordValid && passwordsMatch;

  useEffect(() => {
    // Check if user has a valid session (from reset password email link)
    supabase.auth.getUser().then(({ data: { user }, error }) => {
      if (error || !user) {
        setValidToken(false);
      } else {
        setValidToken(true);
      }
    });
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (!validToken) return;

    if (!canSubmit) {
      if (!isPasswordValid) {
        setError('密码至少需要 8 位');
        return;
      }
      if (!passwordsMatch) {
        setError('两次输入的密码不一致');
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

  if (validToken === null) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground animate-pulse">验证中...</div>
      </main>
    );
  }

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
            onClick={() => router.push('/auth/login')}
            className="px-6 py-3 rounded-xl text-white font-medium bg-primary"
          >
            返回登录
          </button>
        </motion.div>
      </main>
    );
  }

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
              placeholder="请输入新密码（至少 8 位）"
              required
              className="w-full bg-transparent border-b-2 border-border py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent transition-colors font-sans"
            />
            {!isPasswordValid && password.length > 0 && (
              <p className="text-accent text-xs mt-1">密码至少需要 8 位</p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="mb-6">
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="请再次输入密码"
              required
              className="w-full bg-transparent border-b-2 border-border py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent transition-colors font-sans"
            />
            {!passwordsMatch && confirmPassword.length > 0 && (
              <p className="text-accent text-xs mt-1">两次输入的密码不一致</p>
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
