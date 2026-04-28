'use client';

import { useState } from 'react';

/**
 * 认证流程原型 F: 忘记密码页
 *
 * 场景：用户点击"忘记密码"
 * 功能：输入注册邮箱、发送重置链接
 *
 * 设计规范：暖日色板 + 朋友语气文案
 */

export default function ForgotPasswordPrototype() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (!email) return;
    setLoading(true);
    // 模拟发送
    await new Promise((resolve) => setTimeout(resolve, 1000));
    setSent(true);
    setLoading(false);
  };

  // 发送成功状态
  if (sent) {
    return (
      <main className="min-h-screen bg-[#FDF8F5] flex items-center justify-center px-6">
        <div className="w-full max-w-md">
          <div className="bg-[#F5EDE4] rounded-xl p-8 shadow-md text-center">
            <div className="text-4xl mb-4">✉️</div>
            <h1 className="text-xl text-gray-800 mb-3">
              去看看邮箱吧
            </h1>
            <p className="text-sm text-[#B5ADA9] mb-4">
              小知发了一封信到
            </p>
            <p className="text-sm text-gray-800 font-medium mb-6">
              {email}
            </p>
            <p className="text-sm text-[#B5ADA9] mb-6">
              点击里面的链接就能重置密码了~
            </p>
            <button
              type="button"
              onClick={() => alert('跳转到邮箱应用')}
              className="w-full py-3 rounded-md bg-[#E8C4A0] text-gray-800 font-medium"
            >
              📬 打开邮箱
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
          找回密码
        </h1>
        <p className="text-sm text-center text-[#B5ADA9] mb-8">
          没关系，小知帮你发送重置链接~
        </p>

        {/* 表单 */}
        <div className="bg-[#F5EDE4] rounded-xl p-6 shadow-md">
          {/* 邮箱 */}
          <div className="mb-5">
            <label className="block text-sm text-[#B5ADA9] mb-1">
              你的注册邮箱
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              className="w-full bg-transparent border-b-2 border-[#E8E0D8] py-2 text-gray-800 placeholder:text-[#B5ADA9] focus:outline-none focus:border-[#D4856A] transition-colors"
            />
          </div>

          {/* 发送按钮 */}
          <button
            type="button"
            disabled={!email || loading}
            onClick={handleSubmit}
            className="w-full py-3 rounded-md bg-[#D4856A] text-white font-medium disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? '发送中...' : '发送重置链接'}
          </button>
        </div>

        {/* 返回登录 */}
        <p className="text-center text-sm text-[#B5ADA9] mt-6">
          <button
            type="button"
            onClick={() => alert('返回登录页')}
            className="text-[#D4856A] hover:underline"
          >
            返回登录
          </button>
        </p>
      </div>
    </main>
  );
}