'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signUp, signIn, resetPassword } from '@/lib/auth';
import { AuthGuard } from '@/components/auth-guard';
import { motion, useReducedMotion } from 'motion/react';

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
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const router = useRouter();

  const isPasswordValid = password.length >= 8;
  const canSubmit = mode === 'register'
    ? email && isPasswordValid && ageConfirmed
    : mode === 'reset'
      ? !!email
      : email && isPasswordValid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    if (mode === 'reset') {
      setLoading(true);
      try {
        await resetPassword(email, `${window.location.origin}/auth/callback`);
        setSuccess('重置链接已发送到你的邮箱，请查收');
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : '发送失败');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (mode === 'register' && !isPasswordValid) {
      setError('密码至少需要 8 位');
      return;
    }

    setLoading(true);
    try {
      if (mode === 'register') {
        await signUp(email, password);
        setSuccess('注册成功，欢迎加入！');
        setTimeout(() => router.push('/'), 1000);
      } else {
        await signIn(email, password);
        router.push('/');
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : (mode === 'register' ? '注册失败' : '登录失败');
      if (mode === 'register' && (message.includes('already registered') || message.includes('User already registered'))) {
        setError('这个邮箱已经被注册了，试试登录？');
      } else if (mode === 'register' && message.includes('is invalid')) {
        setError('邮箱格式不正确，请检查后重试');
      } else {
        setError(mode === 'login' ? '邮箱或密码不正确' : message);
      }
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
              onClick={() => { setMode('register'); setError(null); setSuccess(null); }}
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
              onClick={() => { setMode('login'); setError(null); setSuccess(null); }}
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

        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div className="mb-6">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder={mode === 'reset' ? '请输入注册邮箱' : '请输入邮箱'}
              required
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
                placeholder="请输入密码（至少 8 位）"
                required
                className="w-full bg-transparent border-b-2 border-border py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent transition-colors font-sans"
              />
              {mode === 'register' && !isPasswordValid && password.length > 0 && (
                <p className="text-accent text-xs mt-1">密码至少需要 8 位</p>
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
                onClick={() => { setMode('reset'); setError(null); setSuccess(null); }}
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
                onClick={() => { setMode('login'); setError(null); setSuccess(null); }}
                className="text-xs text-accent hover:underline"
              >
                返回登录
              </button>
            </div>
          )}
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
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mt-4"
          >
            <p className="text-sm text-accent">{error}</p>
            {error.includes('已经') && (
              <button
                type="button"
                onClick={() => { setMode('login'); setError(null); setSuccess(null); }}
                className="text-xs text-accent hover:underline mt-1"
              >
                去登录
              </button>
            )}
          </motion.div>
        )}
      </motion.div>
    </main>
  );
}
