'use client';

import { useState } from 'react';

type Mode = 'register' | 'login' | 'reset';
type VerificationMode = 'link' | 'otp';
type PasswordStrength = 'weak' | 'medium' | 'strong';

/**
 * 认证流程原型 A: 登录/注册页（三模式切换）
 *
 * 设计规范：暖日色板 + 朋友语气文案
 * - 页面背景: #FDF8F5
 * - 卡片背景: #F5EDE4
 * - 主按钮: #E8C4A0
 * - 强调色/错误: #D4856A
 * - 成功: #A8C5A0
 * - 边框: #E8E0D8
 * - 弱化文字: #B5ADA9
 */

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
      return 'text-[#D4856A]'; // accent
    case 'medium':
      return 'text-[#B5ADA9]'; // muted
    case 'strong':
      return 'text-[#A8C5A0]'; // success
  }
}

export default function LoginRegisterPrototype() {
  const [mode, setMode] = useState<Mode>('register');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [ageConfirmed, setAgeConfirmed] = useState(false);
  const [verificationMode, setVerificationMode] = useState<VerificationMode>('link');
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  const passwordStrength = getPasswordStrength(password);
  const isPasswordValid = password.length >= 8;

  const canSubmit = mode === 'register'
    ? email && isPasswordValid && ageConfirmed
    : mode === 'reset'
      ? !!email
      : email && isPasswordValid;

  const handleRegisterSubmit = () => {
    if (!canSubmit) return;
    setShowVerificationModal(true);
  };

  return (
    <main className="min-h-screen bg-[#FDF8F5] flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        {/* 标题 */}
        <h1 className="text-2xl text-center mb-8 font-serif text-gray-800">
          {mode === 'reset' ? '找回密码' : 'Xiaozhi Journal'}
        </h1>

        {/* 模式切换（注册/登录） */}
        {mode !== 'reset' && (
          <div className="flex mb-8">
            <button
              type="button"
              onClick={() => { setMode('register'); }}
              className={`flex-1 pb-3 text-sm font-medium transition-colors ${
                mode === 'register'
                  ? 'text-[#D4856A] border-b-2 border-[#D4856A]'
                  : 'text-[#B5ADA9] border-b border-[#E8E0D8]'
              }`}
            >
              注册 {mode === 'register' && '✦'}
            </button>
            <button
              type="button"
              onClick={() => { setMode('login'); }}
              className={`flex-1 pb-3 text-sm font-medium transition-colors ${
                mode === 'login'
                  ? 'text-[#D4856A] border-b-2 border-[#D4856A]'
                  : 'text-[#B5ADA9] border-b border-[#E8E0D8]'
              }`}
            >
              登录 {mode === 'login' && '✦'}
            </button>
          </div>
        )}

        {/* 表单 */}
        <div className="bg-[#F5EDE4] rounded-xl p-6 shadow-md">
          {/* 邮箱 */}
          <div className="mb-5">
            <label className="block text-sm text-[#B5ADA9] mb-1">
              {mode === 'reset' ? '你的注册邮箱' : '你的邮箱地址'}
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              className="w-full bg-transparent border-b-2 border-[#E8E0D8] py-2 text-gray-800 placeholder:text-[#B5ADA9] focus:outline-none focus:border-[#D4856A] transition-colors"
            />
          </div>

          {/* 密码（注册/登录模式） */}
          {mode !== 'reset' && (
            <div className="mb-5">
              <label className="block text-sm text-[#B5ADA9] mb-1">
                你的密码（至少 8 位）
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="输入密码..."
                className="w-full bg-transparent border-b-2 border-[#E8E0D8] py-2 text-gray-800 placeholder:text-[#B5ADA9] focus:outline-none focus:border-[#D4856A] transition-colors"
              />

              {/* 密码强度指示器 */}
              {password.length > 0 && (
                <div className="flex items-center gap-2 mt-2">
                  {/* 强度条 */}
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

                  {/* 强度文案 */}
                  <span className={`text-xs ${getPasswordStrengthColor(passwordStrength)}`}>
                    {getPasswordStrengthText(passwordStrength)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* 确认密码（仅注册模式） */}
          {mode === 'register' && (
            <div className="mb-5">
              <label className="block text-sm text-[#B5ADA9] mb-1">
                再次输入密码
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="再次输入..."
                className="w-full bg-transparent border-b-2 border-[#E8E0D8] py-2 text-gray-800 placeholder:text-[#B5ADA9] focus:outline-none focus:border-[#D4856A] transition-colors"
              />
              {confirmPassword && password !== confirmPassword && (
                <p className="text-xs text-[#D4856A] mt-1">两次密码不太一样哦~</p>
              )}
            </div>
          )}

          {/* 年龄确认（仅注册模式） */}
          {mode === 'register' && (
            <label className="flex items-center gap-2 mb-5 cursor-pointer">
              <input
                type="checkbox"
                checked={ageConfirmed}
                onChange={(e) => setAgeConfirmed(e.target.checked)}
                className="w-4 h-4 accent-[#D4856A]"
              />
              <span className="text-sm text-gray-700">我已年满 18 岁</span>
            </label>
          )}

          {/* 提交按钮 */}
          <button
            type="button"
            disabled={!canSubmit}
            onClick={mode === 'register' ? handleRegisterSubmit : undefined}
            className={`w-full py-3 rounded-md font-medium transition-opacity disabled:opacity-40 disabled:cursor-not-allowed ${
              mode === 'login'
                ? 'bg-[#E8C4A0] text-gray-800'
                : 'bg-[#D4856A] text-white'
            }`}
          >
            {mode === 'register' ? '开始 ✨' : mode === 'reset' ? '发送重置链接' : '登录'}
          </button>

          {/* 忘记密码链接（仅登录模式） */}
          {mode === 'login' && (
            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => setMode('reset')}
                className="text-sm text-[#D4856A] hover:underline"
              >
                忘记密码了？没关系
              </button>
            </div>
          )}

          {/* 重置模式：返回登录 */}
          {mode === 'reset' && (
            <div className="text-center mt-4">
              <button
                type="button"
                onClick={() => setMode('login')}
                className="text-sm text-[#D4856A] hover:underline"
              >
                返回登录
              </button>
            </div>
          )}
        </div>

        {/* 切换模式提示 */}
        {mode !== 'reset' && (
          <p className="text-center text-sm text-[#B5ADA9] mt-6">
            {mode === 'register' ? '已经有账号了？' : '还没有账号？'}
            <button
              type="button"
              onClick={() => setMode(mode === 'register' ? 'login' : 'register')}
              className="text-[#D4856A] hover:underline ml-1"
            >
              {mode === 'register' ? '去登录' : '去注册'}
            </button>
          </p>
        )}
      </div>

      {/* 邮箱确认模式选择弹窗 */}
      {showVerificationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center px-6">
          <div className="w-full max-w-sm bg-[#F5EDE4] rounded-xl p-6 shadow-lg relative">
            {/* 关闭按钮 */}
            <button
              type="button"
              onClick={() => setShowVerificationModal(false)}
              className="absolute top-4 right-4 text-[#B5ADA9] hover:text-[#D4856A]"
            >
              ✕
            </button>

            <h2 className="text-lg text-gray-800 mb-4">选择邮箱确认方式</h2>

            {/* 链接模式 */}
            <label className="flex items-start gap-3 mb-4 cursor-pointer p-3 rounded-lg hover:bg-[#E8E0D8]/30 transition-colors">
              <input
                type="radio"
                name="verification"
                checked={verificationMode === 'link'}
                onChange={() => setVerificationMode('link')}
                className="w-4 h-4 accent-[#D4856A] mt-1"
              />
              <div>
                <span className="text-sm text-gray-800">点击邮件链接确认</span>
                <p className="text-xs text-[#B5ADA9] mt-1">简单快捷，一键验证</p>
              </div>
            </label>

            {/* OTP 模式 */}
            <label className="flex items-start gap-3 mb-4 cursor-pointer p-3 rounded-lg hover:bg-[#E8E0D8]/30 transition-colors">
              <input
                type="radio"
                name="verification"
                checked={verificationMode === 'otp'}
                onChange={() => setVerificationMode('otp')}
                className="w-4 h-4 accent-[#D4856A] mt-1"
              />
              <div>
                <span className="text-sm text-gray-800">输入 6 位验证码</span>
                <p className="text-xs text-[#B5ADA9] mt-1">更安全，适合敏感操作</p>
              </div>
            </label>

            {/* 确认发送按钮 */}
            <button
              type="button"
              onClick={() => {
                setShowVerificationModal(false);
                // TODO: 实际发送确认邮件逻辑
                alert(`已发送 ${verificationMode === 'link' ? '确认链接' : '6位验证码'} 到 ${email}`);
              }}
              className="w-full py-3 rounded-md bg-[#D4856A] text-white font-medium"
            >
              确认发送 ✉
            </button>
          </div>
        </div>
      )}
    </main>
  );
}