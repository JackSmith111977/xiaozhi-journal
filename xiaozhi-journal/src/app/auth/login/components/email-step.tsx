'use client';

import { useState, useCallback } from 'react';
import { AuthInput } from './auth-input';

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface EmailStepProps {
  value: string;
  onChange: (email: string) => void;
  onNext: () => void;
}

export function EmailStep({ value, onChange, onNext }: EmailStepProps) {
  const [touched, setTouched] = useState(false);
  const valid = EMAIL_REGEX.test(value);
  const showError = touched && value.length > 0 && !valid;

  const handleNext = useCallback(() => {
    if (valid) onNext();
  }, [valid, onNext]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && valid) handleNext();
  };

  return (
    <div>
      <h2 className="text-xl text-foreground mb-2 font-serif">输入你的邮箱</h2>
      <p className="text-sm text-muted-foreground mb-6">
        我们会发送一封验证邮件给你
      </p>

      <AuthInput
        type="email"
        value={value}
        onChange={onChange}
        onBlur={() => setTouched(true)}
        onKeyDown={handleKeyDown}
        placeholder="example@email.com"
        autoFocus
        autoComplete="email"
        errorText={showError ? '邮箱格式不太对哦~' : undefined}
      />

      <button
        type="button"
        onClick={handleNext}
        disabled={!valid}
        className="w-full mt-6 py-3 rounded-xl text-primary-foreground font-medium bg-primary transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
      >
        下一步
      </button>
    </div>
  );
}
