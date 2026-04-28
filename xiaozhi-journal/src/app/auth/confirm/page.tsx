'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { sendEmailConfirmation } from '@/lib/auth';
import { AuthGuard } from '@/components/auth-guard';
import { motion } from 'motion/react';

export default function ConfirmPage() {
  return (
    <AuthGuard requireAuth={false}>
      <ConfirmContent />
    </AuthGuard>
  );
}

function ConfirmContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') ?? '';

  const [cooldown, setCooldown] = useState(0);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    };
  }, []);

  // Countdown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => {
      setCooldown((c) => c - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  const handleResend = async () => {
    if (cooldown > 0 || sending || !email) return;
    setError(null);
    setSending(true);

    try {
      await sendEmailConfirmation(email);
      setSent(true);
      setCooldown(60);
    } catch (err: unknown) {
      // Regardless of success/failure from Supabase side, show "sent" message
      // to avoid revealing whether the email exists
      setSent(true);
      setCooldown(60);
    } finally {
      setSending(false);
    }
  };

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-6">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md text-center"
      >
        {/* Icon */}
        <div className="text-6xl mb-6">📬</div>

        {/* Title */}
        <h1 className="text-2xl text-foreground mb-4 font-serif">
          验证邮件已发送
        </h1>

        {/* Description */}
        <p className="text-muted-foreground mb-2">
          我们已向 <span className="text-foreground font-medium">{email}</span> 发送了一封验证邮件
        </p>
        <p className="text-muted-foreground mb-8 text-sm">
          点击邮件中的链接即可完成验证
        </p>

        {/* Resend button */}
        <button
          type="button"
          onClick={handleResend}
          disabled={cooldown > 0 || sending}
          className="w-full py-3 rounded-xl text-primary-foreground font-medium bg-primary transition-opacity disabled:opacity-40 disabled:cursor-not-allowed mb-4"
        >
          {sending
            ? '发送中...'
            : cooldown > 0
              ? `重新发送 (${cooldown}s)`
              : '重新发送验证邮件'}
        </button>

        {/* Sent confirmation */}
        {sent && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-chart-1 mb-4"
          >
            已重新发送，请查收 ✨
          </motion.p>
        )}

        {/* Error */}
        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-sm text-accent mb-4"
          >
            {error}
          </motion.p>
        )}

        {/* Back to registration */}
        <button
          type="button"
          onClick={() => router.push('/auth/login')}
          className="text-sm text-accent hover:underline"
        >
          返回注册
        </button>
      </motion.div>
    </main>
  );
}
