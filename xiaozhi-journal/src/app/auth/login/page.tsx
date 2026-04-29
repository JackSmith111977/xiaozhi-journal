'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { signUp, sendEmailConfirmation, AuthError } from '@/lib/auth';
import { AnimatePresence, motion } from 'motion/react';
import { useReducedMotion } from 'motion/react';
import { AuthGuard } from '@/components/auth-guard';
import { Stepper, type StepKey, STEP_ORDER } from './components/stepper';
import { EmailStep } from './components/email-step';
import { PasswordStep } from './components/password-step';
import { VerifyMethodStep, type VerifyMethod } from './components/verify-method-step';
import { LoginForm } from './components/login-form';
import { ResetForm } from './components/reset-form';

type Mode = 'register' | 'login' | 'reset';
type RegisterStep = Exclude<(typeof STEP_ORDER)[number], 'profile'>;

function ModeToggle({ mode, onSwitch }: { mode: Mode; onSwitch: (m: Mode) => void }) {
  return (
    <div className="flex mb-6 border-b border-border">
      <button
        type="button"
        onClick={() => onSwitch('register')}
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
        onClick={() => onSwitch('login')}
        className={`flex-1 pb-2 text-sm font-medium transition-colors ${
          mode === 'login'
            ? 'text-accent border-b-2 border-accent'
            : 'text-muted-foreground'
        }`}
      >
        登录
      </button>
    </div>
  );
}

export default function AuthPage() {
  return (
    <AuthGuard requireAuth={false}>
      <AuthPageContent />
    </AuthGuard>
  );
}

function AuthPageContent() {
  const router = useRouter();
  const [mode, setMode] = useState<Mode>('register');
  const shouldReduceMotion = useReducedMotion();

  // Register stepper state
  const [step, setStep] = useState<RegisterStep>('email');
  const [completedSteps, setCompletedSteps] = useState<Set<RegisterStep>>(new Set());
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [verifyMethod, setVerifyMethod] = useState<VerifyMethod>('link');

  // Shared state
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const redirectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    return () => {
      if (redirectTimerRef.current) clearTimeout(redirectTimerRef.current);
    };
  }, []);

  const resetRegisterState = useCallback(() => {
    setStep('email');
    setCompletedSteps(new Set());
    setEmail('');
    setPassword('');
    setConfirmPassword('');
    setAgeConfirmed(false);
    setVerifyMethod('link');
  }, []);

  const switchMode = useCallback((newMode: Mode) => {
    setMode(newMode);
    setError(null);
    setSuccess(null);
    setLoading(false);
    resetRegisterState();
  }, [resetRegisterState]);

  // ── Step progression ────────────────────────────────────────────────
  const nextStep = useCallback(() => {
    if (step === 'email') {
      setCompletedSteps((prev) => new Set(prev).add('email'));
      setStep('password');
    } else if (step === 'password') {
      setCompletedSteps((prev) => new Set(prev).add('password'));
      setStep('verify-method');
    }
  }, [step]);

  // ── Handle step click on stepper (back to completed step) ──────────
  const handleStepClick = useCallback((clicked: StepKey) => {
    if (clicked === 'profile') return;
    if (completedSteps.has(clicked)) {
      setStep(clicked);
    }
  }, [completedSteps]);

  // ── Submit registration ────────────────────────────────────────────
  const handleRegisterSubmit = async () => {
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const user = await signUp(email, password);
      if (!user.email_confirmed_at) {
        if (verifyMethod === 'otp') {
          router.push(`/auth/otp?email=${encodeURIComponent(email)}`);
        } else {
          router.push(`/auth/confirm?email=${encodeURIComponent(email)}`);
        }
      } else {
        setSuccess('注册成功，欢迎加入！');
        redirectTimerRef.current = setTimeout(() => router.push('/auth/settings'), 1000);
      }
    } catch (err: unknown) {
      if (err instanceof AuthError) {
        if (err.message?.includes('already registered') || err.message?.includes('User already registered')) {
          setError('这个邮箱已经有主人了，试试登录？');
        } else if (err.message?.includes('is invalid')) {
          setError('邮箱格式不正确，请检查后重试');
        } else {
          setError(err.message);
        }
      } else {
        setError('注册失败，请稍后重试');
      }
    } finally {
      setLoading(false);
    }
  };

  // ── Render: Register Stepper ───────────────────────────────────────
  if (mode === 'register') {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center px-6">
        <motion.div
          initial={shouldReduceMotion ? undefined : { opacity: 0, y: 20 }}
          animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md"
        >
          <h1 className="text-2xl text-foreground text-center mb-6 font-serif">
            Xiaozhi Journal
          </h1>

          <ModeToggle mode={mode} onSwitch={switchMode} />

          {/* Stepper */}
          <Stepper
            currentStep={step}
            completedSteps={completedSteps}
            onStepClick={handleStepClick}
          />

          {/* Step content */}
          <form onSubmit={(e) => e.preventDefault()}>
            <AnimatePresence mode="wait">
              {step === 'email' && (
                <EmailStep
                  key="email"
                  value={email}
                  onChange={setEmail}
                  onNext={nextStep}
                />
              )}
              {step === 'password' && (
                <PasswordStep
                  key="password"
                  password={password}
                  confirmPassword={confirmPassword}
                  ageConfirmed={ageConfirmed}
                  onPasswordChange={setPassword}
                  onConfirmChange={setConfirmPassword}
                  onAgeChange={setAgeConfirmed}
                  onNext={nextStep}
                />
              )}
              {step === 'verify-method' && (
                <VerifyMethodStep
                  key="verify-method"
                  value={verifyMethod}
                  onChange={setVerifyMethod}
                  onNext={handleRegisterSubmit}
                />
              )}
            </AnimatePresence>
          </form>

          {/* Error / Success / Loading blocks (unchanged) */}
          {error && (
            <motion.div
              initial={shouldReduceMotion ? undefined : { opacity: 0 }}
              animate={shouldReduceMotion ? undefined : { opacity: 1 }}
              className="text-center mt-4"
            >
              <p className="text-sm text-accent">{error}</p>
              {(error.includes('先验证你的邮箱') || error.includes('重新发送验证邮件')) && (
                <button type="button" onClick={async () => {
                  setError(null);
                  setLoading(true);
                  try { await sendEmailConfirmation(email); setSuccess('已重新发送验证邮件，请查收'); } catch { setError('发送失败，请稍后重试'); } finally { setLoading(false); }
                }} className="text-xs text-accent hover:underline mt-1">
                  重新发送验证邮件
                </button>
              )}
              {error.includes('已经') && (
                <button type="button" onClick={() => switchMode('login')} className="text-xs text-accent hover:underline mt-1">
                  去登录
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

          {loading && (
            <p className="text-center text-sm text-muted-foreground mt-4">处理中...</p>
          )}
        </motion.div>
      </main>
    );
  }

  // ── Render: Login ──────────────────────────────────────────────────
  if (mode === 'login') {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center px-6">
        <motion.div
          initial={shouldReduceMotion ? undefined : { opacity: 0, y: 20 }}
          animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="w-full max-w-md"
        >
          <h1 className="text-2xl text-foreground text-center mb-6 font-serif">
            Xiaozhi Journal
          </h1>

          <ModeToggle mode={mode} onSwitch={switchMode} />

          <LoginForm
            email={email}
            onEmailChange={setEmail}
            onModeSwitch={switchMode}
          />
        </motion.div>
      </main>
    );
  }

  // ── Render: Reset Password ─────────────────────────────────────────
  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-6">
      <motion.div
        initial={shouldReduceMotion ? undefined : { opacity: 0, y: 20 }}
        animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <h1 className="text-2xl text-foreground text-center mb-6 font-serif">
          重置密码
        </h1>

        <ResetForm
          email={email}
          onEmailChange={setEmail}
          onModeSwitch={switchMode}
        />
      </motion.div>
    </main>
  );
}
