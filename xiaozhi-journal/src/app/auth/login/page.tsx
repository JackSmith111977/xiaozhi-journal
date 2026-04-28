'use client';

import { useState, useRef, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { signUp, signIn, resetPassword, sendEmailConfirmation, AuthError } from '@/lib/auth';
import { validatePassword, passwordsMatch } from '@/lib/password-policy';
import { PasswordStrength } from '@/components/password-strength';
import { AuthGuard } from '@/components/auth-guard';
import { motion } from 'motion/react';

type Mode = 'register' | 'login' | 'reset';

export default function AuthPage() {
  return (
    <AuthGuard requireAuth={false}>
      <AuthPageContent />
    </AuthGuard>
  );
}

function AuthPageContent() {
  const [mode, setMode] = useState<Mode>('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const router = useRouter();

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    };
  }, []);

  // Password validation (memoized)
  const passwordResult = useMemo(() => validatePassword(password), [password]);
  const isPasswordStrong = passwordResult.valid;
  const doPasswordsMatch = passwordsMatch(password, confirmPassword);
  // Only show mismatch error when both fields have content
  const passwordsDiffer = password.length > 0 && confirmPassword.length > 0 && !doPasswordsMatch;

  // Can submit logic
  const canSubmit = mode === 'register'
    ? email && isPasswordStrong && doPasswordsMatch && ageConfirmed
    : mode === 'reset'
      ? !!email
      : email && password.length >= 8;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (mode === 'reset') {
      setLoading(true);
      try {
        await resetPassword(email, `${window.location.origin}/auth/callback`);
        setSuccess('去看看邮箱吧，小知发了一封信~');
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : '发送失败');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Register: validate password policy before submission
    if (mode === 'register') {
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
      if (mode === 'register') {
        const user = await signUp(email, password);
        if (!user.email_confirmed_at) {
          router.push(`/auth/confirm?email=${encodeURIComponent(email)}`);
        } else {
          setSuccess('注册成功，欢迎加入！');
          redirectTimerRef.current = setTimeout(() => router.push('/'), 1000);
        }
      } else {
        await signIn(email, password);
        router.push('/');
      }
    } catch (err: unknown) {
      if (err instanceof AuthError) {
        if (err.code === 'email_not_confirmed' || err.message?.includes('Email not confirmed')) {
          setError('请先验证你的邮箱，检查收件箱或重新发送验证邮件');
        } else if (err.message?.includes('already registered') || err.message?.includes('User already registered')) {
          setError('这个邮箱已经有主人了，试试登录？');
        } else if (err.message?.includes('is invalid')) {
          setError('邮箱格式不正确，请检查后重试');
        } else if (err.message?.includes('Invalid login credentials')) {
          setError('邮箱或密码不正确');
        } else {
          setError(err.message || (mode === 'register' ? '注册失败' : '登录失败'));
        }
      } else {
        setError(mode === 'register' ? '注册失败' : '登录失败');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleResendFromLogin = async () => {
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
    <main className="min-h-screen bg-background flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <h1 className="text-2xl text-foreground text-center mb-8 font-serif">
          {mode === 'reset' ? '重置密码' : 'Xiaozhi Journal'}
        </h1>

        {/* Mode toggle (hidden in reset mode) */}
        {mode !== 'reset' && (
          <div className="flex mb-8 border-b border-border">
            <button
              type="button"
              onClick={() => { setMode('register'); setError(null); setSuccess(null); setPassword(''); setConfirmPassword(''); }}
              className={`flex-1 pb-2 text-sm font-medium transition-colors ${
                mode === 'register'
                  ? 'text-accent border-b-2 border-accent'
                  : 'text-muted-foreground'
              }`}
            >
              注册
            </button>
            <button
              type="button"
              onClick={() => { setMode('login'); setError(null); setSuccess(null); setPassword(''); setConfirmPassword(''); }}
              className={`flex-1 pb-2 text-sm font-medium transition-colors ${
                mode === 'login'
                  ? 'text-accent border-b-2 border-accent'
                  : 'text-muted-foreground'
              }`}
            >
              登录
            </button>
          </div>
        )}

        <form onSubmit={handleSubmit} autoComplete="off">
          {/* Email */}
          <div className="mb-6">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={mode === 'reset' ? '请输入注册邮箱' : '请输入邮箱'}
              required
              autoComplete="email"
              className="w-full bg-transparent border-b-2 border-border py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent transition-colors font-sans"
            />
          </div>

          {/* Password (hidden in reset mode) */}
          {mode !== 'reset' && (
            <div className="mb-6">
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="请输入密码（至少 8 位，含大小写+数字）"
                required
                autoComplete={mode === 'register' ? 'new-password' : 'current-password'}
                className="w-full bg-transparent border-b-2 border-border py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent transition-colors font-sans"
              />
              {/* Password strength indicator (register only) */}
              {mode === 'register' && (
                <PasswordStrength password={password} />
              )}
            </div>
          )}

          {/* Confirm Password (register only) */}
          {mode === 'register' && (
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
              {passwordsDiffer && (
                <p className="text-xs mt-1" style={{ color: '#D4856A' }}>
                  两次密码不太一样哦~
                </p>
              )}
            </div>
          )}

          {/* Age confirmation (register only) */}
          {mode === 'register' && (
            <label className="flex items-center gap-2 mb-6 cursor-pointer">
              <input
                type="checkbox"
                checked={ageConfirmed}
                onChange={(e) => setAgeConfirmed(e.target.checked)}
                className="w-4 h-4 accent-accent"
              />
              <span className="text-sm text-foreground">我已年满 18 岁</span>
            </label>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!canSubmit || loading}
            className="w-full py-3 rounded-xl text-primary-foreground font-medium bg-primary transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? '处理中...' : mode === 'register' ? '注册' : mode === 'reset' ? '发送重置链接' : '登录'}
          </button>

          {/* Forgot password link (login only) */}
          {mode === 'login' && (
            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => { setMode('reset'); setError(null); setSuccess(null); setPassword(''); setConfirmPassword(''); }}
                className="text-xs text-accent hover:underline"
              >
                忘记密码？
              </button>
            </div>
          )}

          {/* Reset mode: back to login */}
          {mode === 'reset' && (
            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => { setMode('login'); setError(null); setSuccess(null); setPassword(''); setConfirmPassword(''); }}
                className="text-xs text-accent hover:underline"
              >
                返回登录
              </button>
            </div>
          )}
        </form>

        {/* Error message */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mt-4"
          >
            <p className="text-sm text-accent">{error}</p>
            {(error.includes('先验证你的邮箱') || error.includes('重新发送验证邮件')) && (
              <button
                type="button"
                onClick={handleResendFromLogin}
                className="text-xs text-accent hover:underline mt-1"
              >
                重新发送验证邮件
              </button>
            )}
            {error.includes('已经') && (
              <button
                type="button"
                onClick={() => { setMode('login'); setError(null); setSuccess(null); setPassword(''); setConfirmPassword(''); }}
                className="text-xs text-accent hover:underline mt-1"
              >
                去登录
              </button>
            )}
          </motion.div>
        )}

        {/* Success message */}
        {success && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-sm text-chart-1 mt-4"
          >
            {success}
          </motion.p>
        )}
      </motion.div>
    </main>
  );
}
