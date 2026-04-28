'use client';

import { useState, useRef, useEffect } from 'react';

/**
 * 认证流程原型 D: OTP 验证码输入页
 *
 * 场景：用户注册后，选择"验证码确认"模式
 * 功能：6位验证码输入、自动聚焦、倒计时、重发
 *
 * 设计规范：暖日色板 + 朋友语气文案
 */

export default function OTPInputPrototype() {
  const [otp, setOtp] = useState<string[]>(['', '', '', '', '', '']);
  const [countdown, setCountdown] = useState(600); // 10分钟
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const email = 'user@example.com'; // 模拟邮箱

  useEffect(() => {
    if (countdown <= 0) {
      return;
    }
    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(timer);
  }, [countdown]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleChange = (index: number, value: string) => {
    // 只允许数字
    if (value && !/^\d$/.test(value)) return;

    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);
    setError(null);

    // 自动聚焦下一个
    if (value && index < 5) {
      inputRefs.current[index + 1]?.focus();
    }

    // 输入完成自动提交
    if (newOtp.every((digit) => digit !== '') && index === 5) {
      handleSubmit(newOtp.join(''));
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    // Backspace 删除后聚焦前一个
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleSubmit = (code: string) => {
    // 模拟验证（实际应该调用 API）
    if (code === '123456') {
      setSuccess(true);
    } else {
      setError('验证码不太对，再看看邮件？');
    }
  };

  const handleResend = () => {
    setOtp(['', '', '', '', '', '']);
    setCountdown(600);
    setError(null);
    inputRefs.current[0]?.focus();
    alert('已重新发送验证码~');
  };

  // 验证成功状态
  if (success) {
    return (
      <main className="min-h-screen bg-[#FDF8F5] flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          <div className="bg-[#F5EDE4] rounded-xl p-8 shadow-md text-center">
            <div className="text-4xl mb-4">✅</div>
            <h1 className="text-xl text-gray-800 mb-3">
              邮箱确认好了
            </h1>
            <p className="text-sm text-[#B5ADA9] mb-6">
              开始你的第一篇日记吧 ✨
            </p>
            <button
              type="button"
              onClick={() => alert('跳转到首页')}
              className="w-full py-3 rounded-md bg-[#D4856A] text-white font-medium"
            >
              开始写日记 ✦
            </button>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-[#FDF8F5] flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        {/* 标题 */}
        <h1 className="text-xl text-center text-gray-800 mb-3">
          输入验证码
        </h1>
        <p className="text-sm text-center text-[#B5ADA9] mb-6">
          小知发了 6 位验证码到 <span className="text-gray-800">{email}</span>
        </p>

        {/* OTP 输入框 */}
        <div className="flex justify-center gap-3 mb-6">
          {otp.map((digit, index) => (
            <input
              key={index}
              ref={(el) => { inputRefs.current[index] = el; }}
              type="text"
              inputMode="numeric"
              maxLength={1}
              value={digit}
              onChange={(e) => handleChange(index, e.target.value)}
              onKeyDown={(e) => handleKeyDown(index, e)}
              className={`w-12 h-14 text-center text-lg font-medium rounded-lg border-2 transition-colors ${
                error
                  ? 'border-[#D4856A] text-[#D4856A]'
                  : digit
                    ? 'border-[#A8C5A0] text-gray-800'
                    : 'border-[#E8E0D8] text-gray-800'
              } bg-white focus:outline-none focus:border-[#D4856A]`}
            />
          ))}
        </div>

        {/* 错误提示 */}
        {error && (
          <p className="text-center text-sm text-[#D4856A] mb-4">
            {error}
          </p>
        )}

        {/* 倒计时 */}
        <div className="text-center mb-6">
          <span className="text-xs text-[#B5ADA9]">
            ⏱ 验证码有效期：
          </span>
          <span className={`font-medium ${
            countdown < 120 ? 'text-[#D4856A]' : 'text-gray-800'
          }`}>
            {formatTime(countdown)}
          </span>
        </div>

        {/* 确认按钮 */}
        <button
          type="button"
          disabled={otp.some((d) => d === '')}
          onClick={() => handleSubmit(otp.join(''))}
          className="w-full py-3 rounded-md bg-[#E8C4A0] text-gray-800 font-medium disabled:opacity-40 disabled:cursor-not-allowed mb-4"
        >
          确认
        </button>

        {/* 重发按钮 */}
        <button
          type="button"
          disabled={countdown > 0}
          onClick={handleResend}
          className="text-center text-sm text-[#D4856A] hover:underline disabled:text-[#B5ADA9] disabled:no-underline disabled:cursor-not-allowed w-full"
        >
          {countdown > 0 ? `没收到？等待 ${formatTime(countdown)} 后可重发` : '没收到？重新发送验证码'}
        </button>
      </div>
    </main>
  );
}