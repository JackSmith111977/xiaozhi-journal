'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { AuthGuard } from '@/components/auth-guard';
import { motion } from 'motion/react';

const OTP_LENGTH = 6;
const EXPIRY_SECONDS = 600; // 10 minutes

export default function OtpPage() {
  return (
    <AuthGuard requireAuth={false}>
      <OtpContent />
    </AuthGuard>
  );
}

function OtpContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get('email') ?? '';

  const [code, setCode] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [expired, setExpired] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [resending, setResending] = useState(false);

  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const verifyingRef = useRef(false);

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    };
  }, []);

  // Expiry countdown
  useEffect(() => {
    const interval = setInterval(() => {
      setElapsed((e) => {
        if (e >= EXPIRY_SECONDS) {
          clearInterval(interval);
          setExpired(true);
          return EXPIRY_SECONDS;
        }
        return e + 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const remaining = EXPIRY_SECONDS - elapsed;
  const remainingMin = Math.floor(remaining / 60);
  const remainingSec = remaining % 60;

  const handleChange = (index: number, value: string) => {
    // Only allow digits
    if (value && !/^\d$/.test(value)) return;

    const newCode = [...code];
    newCode[index] = value;
    setCode(newCode);

    // Auto-focus next input
    if (value && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits entered
    if (newCode.every((d) => d !== '') && !loading) {
      handleVerify(newCode.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !code[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, OTP_LENGTH);
    if (!pasted) return;

    const newCode = [...code];
    for (let i = 0; i < pasted.length; i++) {
      newCode[i] = pasted.charAt(i);
    }
    setCode(newCode);

    // Focus last filled or next empty
    const nextIndex = Math.min(pasted.length, OTP_LENGTH - 1);
    inputRefs.current[nextIndex]?.focus();

    // Auto-submit if complete
    if (newCode.every((d) => d !== '')) {
      handleVerify(newCode.join(''));
    }
  };

  const handleVerify = async (fullCode: string) => {
    if (loading || expired || verifyingRef.current || !email) return;
    verifyingRef.current = true;
    setError(null);
    setLoading(true);

    try {
      const { error: verifyError } = await supabase.auth.verifyOtp({
        email,
        token: fullCode,
        type: 'email',
      });

      if (verifyError) {
        verifyingRef.current = false;
        if (verifyError.message?.includes('expired') || verifyError.message?.includes('Token has expired')) {
          setExpired(true);
          setError('验证码已过期，请重新申请');
        } else {
          setError('验证码错误，请检查后重试');
        }
        return;
      }

      setSuccess(true);
      redirectTimerRef.current = setTimeout(
        () => router.push('/auth/settings'),
        1500
      );
    } catch {
      verifyingRef.current = false;
      setError('验证失败，请稍后重试');
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (resending || !email) return;
    setResending(true);
    setError(null);

    try {
      await supabase.auth.resend({
        type: 'signup',
        email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      // Reset state for new OTP
      setExpired(false);
      setElapsed(0);
      setCode(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } catch {
      setError('重新发送失败，请稍后重试');
    } finally {
      setResending(false);
    }
  };

  if (success) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="w-full max-w-md text-center"
        >
          <div className="text-6xl mb-6">✨</div>
          <h1 className="text-2xl text-foreground mb-4 font-serif">邮箱确认成功</h1>
          <p className="text-muted-foreground mb-6">即将跳转资料设置页...</p>
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
        <h1 className="text-2xl text-foreground text-center mb-2 font-serif">
          输入验证码
        </h1>
        <p className="text-muted-foreground text-center mb-8 text-sm">
          我们已向 {email} 发送了 6 位验证码
        </p>

        {/* OTP inputs */}
        <div className="flex justify-center gap-3 mb-8">
          {code.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { inputRefs.current[index] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              onPaste={handlePaste}
              className="w-12 h-14 text-center text-xl border-b-2 border-border bg-transparent text-foreground focus:outline-none focus:border-accent transition-colors"
            />
          ))}
        </div>

        {/* Expiry timer */}
        <p className="text-muted-foreground text-center text-sm mb-6">
          验证码有效期 {remainingMin}:{remainingSec.toString().padStart(2, '0')}
        </p>

        {/* Error */}
        {error && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mb-4"
          >
            <p className="text-sm text-accent">{error}</p>
            {expired && (
              <button
                type="button"
                onClick={handleResend}
                disabled={resending}
                className="text-sm text-accent hover:underline mt-2 disabled:opacity-50"
              >
                {resending ? '发送中...' : '重新获取验证码'}
              </button>
            )}
          </motion.div>
        )}

        {/* Loading */}
        {loading && (
          <p className="text-center text-sm text-muted-foreground mb-4">
            验证中...
          </p>
        )}

        {/* Back to registration */}
        <div className="text-center">
          <button
            type="button"
            onClick={() => router.push('/auth/login')}
            className="text-sm text-accent hover:underline"
          >
            返回注册
          </button>
        </div>
      </motion.div>
    </main>
  );
}
