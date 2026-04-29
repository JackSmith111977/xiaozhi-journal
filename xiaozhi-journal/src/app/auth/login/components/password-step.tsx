'use client';

import { useState, useCallback, useMemo } from 'react';
import { validatePassword, passwordsMatch } from '@/lib/password-policy';
import { PasswordStrength } from '@/components/password-strength';
import { AuthInput } from './auth-input';

interface PasswordStepProps {
  password: string;
  confirmPassword: string;
  ageConfirmed: boolean;
  onPasswordChange: (pwd: string) => void;
  onConfirmChange: (pwd: string) => void;
  onAgeChange: (checked: boolean) => void;
  onNext: () => void;
}

export function PasswordStep({
  password,
  confirmPassword,
  ageConfirmed,
  onPasswordChange,
  onConfirmChange,
  onAgeChange,
  onNext,
}: PasswordStepProps) {
  const [touched, setTouched] = useState(false);

  const passwordResult = useMemo(() => validatePassword(password), [password]);
  const isPasswordStrong = passwordResult.valid;
  const doPasswordsMatch = passwordsMatch(password, confirmPassword);
  const showMismatch = touched && confirmPassword.length > 0 && !doPasswordsMatch;

  const canSubmit = isPasswordStrong && doPasswordsMatch && ageConfirmed;

  const handleNext = useCallback(() => {
    if (canSubmit) onNext();
  }, [canSubmit, onNext]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && canSubmit) handleNext();
  };

  return (
    <div
      onKeyDown={handleKeyDown}
    >
      <h2 className="text-xl text-foreground mb-2 font-serif">设置密码</h2>
      <p className="text-sm text-muted-foreground mb-6">
        保护你的账户安全
      </p>

      {/* Password */}
      <div className="mb-4">
        <AuthInput
          type="password"
          value={password}
          onChange={onPasswordChange}
          placeholder="请输入密码（至少 8 位，含大小写+数字）"
          autoFocus
          autoComplete="new-password"
        />
        <PasswordStrength password={password} result={passwordResult} />
      </div>

      {/* Confirm Password */}
      <div className="mb-4">
        <AuthInput
          type="password"
          value={confirmPassword}
          onChange={onConfirmChange}
          onBlur={() => setTouched(true)}
          placeholder="请再次输入密码"
          autoComplete="new-password"
          errorText={showMismatch ? '两次密码不太一样哦~' : undefined}
        />
      </div>

      {/* Age confirmation */}
      <label className="flex items-center gap-2 mb-6 cursor-pointer">
        <input
          type="checkbox"
          checked={ageConfirmed}
          onChange={(e) => onAgeChange(e.target.checked)}
          className="w-4 h-4 accent-accent"
        />
        <span className="text-sm text-foreground">我已年满 18 岁</span>
      </label>

      <button
        type="button"
        onClick={handleNext}
        disabled={!canSubmit}
        className="w-full py-3 rounded-xl text-primary-foreground font-medium bg-primary transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
      >
        下一步
      </button>
    </div>
  );
}
