'use client';

import { useState, useEffect } from 'react';

/**
 * 认证流程原型 C: 链接确认等待页
 *
 * 场景：用户注册后，选择"链接确认"模式
 * 状态：等待验证、链接过期
 *
 * 设计规范：暖日色板 + 朋友语气文案
 */

export default function LinkWaitingPrototype() {
  const [countdown, setCountdown] = useState(600); // 10分钟 = 600秒
  const [resendEnabled, setResendEnabled] = useState(false);
  const [email] = useState('user@example.com'); // 模拟邮箱
  const [linkExpired, setLinkExpired] = useState(false);

  useEffect(() => {
    if (countdown <= 0) {
      setLinkExpired(true);
      return;
    }

    const timer = setInterval(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearInterval(timer);
  }, [countdown]);

  useEffect(() => {
    if (countdown <= 300) {
      setResendEnabled(true); // 5分钟后可重发
    }
  }, [countdown]);

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleResend = () => {
    setCountdown(600);
    setLinkExpired(false);
    setResendEnabled(false);
    alert('已重新发送确认邮件~');
  };

  return (
    <main className="min-h-screen bg-[#FDF8F5] flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="bg-[#F5EDE4] rounded-xl p-8 shadow-md text-center">
          {/* 状态：链接过期 */}
          {linkExpired ? (
            <>
              <div className="text-4xl mb-4">⏰</div>
              <h1 className="text-xl text-gray-800 mb-3">
                这个链接已经过期了
              </h1>
              <p className="text-sm text-[#B5ADA9] mb-6">
                10 分钟过去了，链接失效了。重新发一个？
              </p>
              <button
                type="button"
                onClick={handleResend}
                className="w-full py-3 rounded-md bg-[#D4856A] text-white font-medium"
              >
                重新发送确认邮件
              </button>
            </>
          ) : (
            <>
              {/* 状态：等待验证 */}
              <div className="text-4xl mb-4">📧</div>
              <h1 className="text-xl text-gray-800 mb-3">
                查看邮箱吧
              </h1>
              <p className="text-sm text-[#B5ADA9] mb-4">
                小知发了一封信到
              </p>
              <p className="text-sm text-gray-800 font-medium mb-4">
                {email}
              </p>
              <p className="text-sm text-[#B5ADA9] mb-6">
                点击里面的链接就好了~
              </p>

              {/* 倒计时 */}
              <div className="flex items-center justify-center gap-2 mb-6">
                <span className="text-xs text-[#B5ADA9]">链接有效期</span>
                <span className="text-lg font-medium text-[#D4856A]">
                  {formatTime(countdown)}
                </span>
              </div>

              {/* 打开邮箱按钮 */}
              <button
                type="button"
                onClick={() => alert('这里会跳转到邮箱应用')}
                className="w-full py-3 rounded-md bg-[#E8C4A0] text-gray-800 font-medium mb-4"
              >
                📬 打开邮箱
              </button>

              {/* 重发链接 */}
              <button
                type="button"
                disabled={!resendEnabled}
                onClick={handleResend}
                className="text-sm text-[#D4856A] hover:underline disabled:text-[#B5ADA9] disabled:no-underline disabled:cursor-not-allowed"
              >
                {resendEnabled ? '没收到？重新发送' : `没收到？等待 ${formatTime(countdown - 300)} 后可重发`}
              </button>
            </>
          )}
        </div>

        {/* 底部提示 */}
        <p className="text-center text-xs text-[#B5ADA9] mt-6">
          没收到邮件？检查一下垃圾邮件箱~
        </p>
      </div>
    </main>
  );
}