'use client';

import { useState } from 'react';

/**
 * 认证流程原型 G: 重置密码页
 *
 * 场景：用户点击邮件中的重置链接
 * 功能：输入新密码、密码强度指示器、确认密码
 *
 * 设计规范：暖日色板 + 朋友语气文案
 */

type PasswordStrength = 'weak' | 'medium' | 'strong';

function getPasswordStrength(password: string): PasswordStrength {
  if (password.length < 8) return 'weak';
  const hasLower = /[a-z]/.test(password);
  const hasUpper = /[A-Z]/.test(password);
  const hasDigit = /\d/.test(password);
  if (hasLower && hasUpper && hasDigit) return 'strong';
  return 'medium';
}

function getPasswordStrengthText(strength: PasswordStrength): string {
  switch (strength) {
    case 'weak':
      return '再加几位吧~';
    case 'medium':
      return '还不错，加点复杂度？';
    case 'strong':
      return '这就很安全了 ✨';
  }
}

function getPasswordStrengthColor(strength: PasswordStrength): string {
  switch (strength) {
    case 'weak':
      return 'text-[#D4856A]';
    case 'medium':
      return 'text-[#B5ADA9]';
    case 'strong':
      return 'text-[#A8C5A0]';
  }
}

export default function ResetPasswordPrototype() {
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const passwordStrength = getPasswordStrength(newPassword);
  const isPasswordValid = newPassword.length >= 8;
  const passwordsMatch = newPassword === confirmPassword;

  const handleSubmit = async () => {
    if (!isPasswordValid || !passwordsMatch) return;
    setLoading(true);
    // 模拟提交
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSuccess(true);
    setLoading(false);
  };

  // 重置成功状态
  if (success) {
    return (
      <main className="min-h-screen bg-[#FDF8F5] flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          <div className="bg-[#F5EDE4] rounded-xl p-8 shadow-md text-center">
            <div className="text-4xl mb-4">✅</div>
            <h1 className="text-xl text-gray-800 mb-3">
              密码更新好了
            </h1>
            <p className="text-sm text-[#B5ADA9] mb-6">
              用新密码登录，继续写日记吧~
            </p>
            <button
              type="button"
              onClick={() => alert('跳转到登录页')}
              className="w-full py-3 rounded-md bg-[#D4856A] text-white font-medium"
            >
              去登录
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
          重置密码
        </h1>
        <p className="text-sm text-center text-[#B5ADA9] mb-8">
          设置一个新密码吧
        </p>

        {/* 表单 */}
        <div className="bg-[#F5EDE4] rounded-xl p-6 shadow-md">
          {/* 新密码 */}
          <div className="mb-5">
            <label className="block text-sm text-[#B5ADA9] mb-1">
              新密码（至少 8 位）
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              placeholder="输入新密码..."
              className="w-full bg-transparent border-b-2 border-[#E8E0D8] py-2 text-gray-800 placeholder:text-[#B5ADA9] focus:outline-none focus:border-[#D4856A] transition-colors"
            />

            {/* 密码强度指示器 */}
            {newPassword.length > 0 && (
              <div className="flex items-center gap-2 mt-2">
                <div className="flex gap-1">
                  {[1, 2, 3, 4, 5].map((i) => (
                    <div
                      key={i}
                      className={`w-4 h-1 rounded-full transition-colors ${
                        passwordStrength === 'weak' && i <= 2
                          ? 'bg-[#D4856A]'
                        : passwordStrength === 'medium' && i <= 3
                          ? 'bg-[#B5ADA9]'
                        : passwordStrength === 'strong' && i <= 5
                          ? 'bg-[#A8C5A0]'
                          : 'bg-[#E8E0D8]'
                      }`}
                    />
                  ))}
                </div>
                <span className={`text-xs ${getPasswordStrengthColor(passwordStrength)}`}>
                  {getPasswordStrengthText(passwordStrength)}
                </span>
              </div>
            )}
          </div>

          {/* 确认密码 */}
          <div className="mb-5">
            <label className="block text-sm text-[#B5ADA9] mb-1">
              再次输入新密码
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              placeholder="再次输入..."
              className="w-full bg-transparent border-b-2 border-[#E8E0D8] py-2 text-gray-800 placeholder:text-[#B5ADA9] focus:outline-none focus:border-[#D4856A] transition-colors"
            />
            {confirmPassword && !passwordsMatch && (
              <p className="text-xs text-[#D4856A] mt-1">
                两次密码不太一样哦~
              </p>
            )}
          </div>

          {/* 提交按钮 */}
          <button
            type="button"
            disabled={!isPasswordValid || !passwordsMatch || loading}
            onClick={handleSubmit}
            className="w-full py-3 rounded-md bg-[#D4856A] text-white font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? '更新中...' : '更新密码'}
          </button>
        </div>
      </div>
    </main>
  );
}