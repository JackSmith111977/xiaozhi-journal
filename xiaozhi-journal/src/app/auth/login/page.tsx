'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signUp, signIn } from '@/lib/auth';
import { motion } from 'framer-motion';

type Mode = 'register' | 'login';

export default function AuthPage() {
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
    : email && isPasswordValid;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

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
      } else if (mode === 'login' && (message.includes('Invalid') || message.includes('Invalid login credentials'))) {
        setError('邮箱或密码不正确');
      } else {
        setError(message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-screen bg-[#FDF8F5] flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <h1
          className="text-2xl text-[#3D3D3D] text-center mb-8"
          style={{ fontFamily: 'var(--font-noto-serif)' }}
        >
          Xiaozhi Journal
        </h1>

        {/* Mode toggle */}
        <div className="flex mb-8 border-b border-[#E8E0D8]">
          <button
            type="button"
            onClick={() => setMode('register')}
            className={`flex-1 pb-2 text-sm font-medium transition-colors ${
              mode === 'register'
                ? 'text-[#D4856A] border-b-2 border-[#D4856A]'
                : 'text-[#8A817C]'
            }`}
          >
            注册
          </button>
          <button
            type="button"
            onClick={() => setMode('login')}
            className={`flex-1 pb-2 text-sm font-medium transition-colors ${
              mode === 'login'
                ? 'text-[#D4856A] border-b-2 border-[#D4856A]'
                : 'text-[#8A817C]'
            }`}
          >
            登录
          </button>
        </div>

        <form onSubmit={handleSubmit}>
          {/* Email */}
          <div className="mb-6">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="请输入邮箱"
              required
              className="w-full bg-transparent border-b-2 border-[#E8E0D8] py-2 text-[#3D3D3D] placeholder-[#8A817C] focus:outline-none focus:border-[#D4856A] transition-colors"
              style={{ fontFamily: 'var(--font-noto-sans)' }}
            />
          </div>

          {/* Password */}
          <div className="mb-6">
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="请输入密码（至少 8 位）"
              required
              className="w-full bg-transparent border-b-2 border-[#E8E0D8] py-2 text-[#3D3D3D] placeholder-[#8A817C] focus:outline-none focus:border-[#D4856A] transition-colors"
              style={{ fontFamily: 'var(--font-noto-sans)' }}
            />
            {mode === 'register' && !isPasswordValid && password.length > 0 && (
              <p className="text-[#D4856A] text-xs mt-1">密码至少需要 8 位</p>
            )}
          </div>

          {/* Age confirmation (register only) */}
          {mode === 'register' && (
            <label className="flex items-center gap-2 mb-6 cursor-pointer">
              <input
                type="checkbox"
                checked={ageConfirmed}
                onChange={(e) => setAgeConfirmed(e.target.checked)}
                className="w-4 h-4 accent-[#D4856A]"
              />
              <span className="text-sm text-[#3D3D3D]">我已年满 18 岁</span>
            </label>
          )}

          {/* Submit */}
          <button
            type="submit"
            disabled={!canSubmit || loading}
            className="w-full py-3 rounded-xl text-white font-medium transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#E8C4A0' }}
          >
            {loading ? '处理中...' : mode === 'register' ? '注册' : '登录'}
          </button>

          {/* Forgot password link (login only) */}
          {mode === 'login' && (
            <div className="text-center mt-4">
              <button
                type="button"
                className="text-xs text-[#D4856A] hover:underline"
              >
                忘记密码？
              </button>
            </div>
          )}
        </form>

        {/* Success / Error messages */}
        {success && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-sm text-[#A8C5A0] mt-4"
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
            <p className="text-sm text-[#D4856A]">{error}</p>
            {error.includes('已经') && (
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-xs text-[#D4856A] hover:underline mt-1"
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
