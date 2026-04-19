'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { updatePassword } from '@/lib/auth';
import { AuthGuard } from '@/components/auth-guard';
import { motion } from 'framer-motion';

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

  const router = useRouter();
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
      setTimeout(() => router.push('/auth/login'), 1500);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '密码更新失败');
    } finally {
      setLoading(false);
    }
  };

  if (validToken === null) {
    return (
      <main className="min-h-screen bg-[#FDF8F5] flex items-center justify-center">
        <div className="text-[#8A817C] animate-pulse">验证中...</div>
      </main>
    );
  }

  if (!validToken) {
    return (
      <main className="min-h-screen bg-[#FDF8F5] flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md text-center"
        >
          <h1
            className="text-2xl text-[#3D3D3D] mb-4"
            style={{ fontFamily: 'var(--font-noto-serif)' }}
          >
            链接无效
          </h1>
          <p className="text-[#8A817C] mb-6">链接已过期，请重新申请重置。</p>
          <button
            onClick={() => router.push('/auth/login')}
            className="px-6 py-3 rounded-xl text-white font-medium"
            style={{ backgroundColor: '#E8C4A0' }}
          >
            返回登录
          </button>
        </motion.div>
      </main>
    );
  }

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
              className="w-full bg-transparent border-b-2 border-[#E8E0D8] py-2 text-[#3D3D3D] placeholder-[#8A817C] focus:outline-none focus:border-[#D4856A] transition-colors"
              style={{ fontFamily: 'var(--font-noto-sans)' }}
            />
            {!isPasswordValid && password.length > 0 && (
              <p className="text-[#D4856A] text-xs mt-1">密码至少需要 8 位</p>
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
              className="w-full bg-transparent border-b-2 border-[#E8E0D8] py-2 text-[#3D3D3D] placeholder-[#8A817C] focus:outline-none focus:border-[#D4856A] transition-colors"
              style={{ fontFamily: 'var(--font-noto-sans)' }}
            />
            {!passwordsMatch && confirmPassword.length > 0 && (
              <p className="text-[#D4856A] text-xs mt-1">两次输入的密码不一致</p>
            )}
          </div>

          {/* Submit */}
          <button
            type="submit"
            disabled={!canSubmit || loading}
            className="w-full py-3 rounded-xl text-white font-medium transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#E8C4A0' }}
          >
            {loading ? '处理中...' : '更新密码'}
          </button>
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
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center text-sm text-[#D4856A] mt-4"
          >
            {error}
          </motion.p>
        )}
      </motion.div>
    </main>
  );
}
