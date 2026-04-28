'use client';

/**
 * 认证流程原型 E: 验证成功页
 *
 * 场景：用户完成邮箱验证后
 * 功能：显示成功消息、引导开始写日记
 *
 * 设计规范：暖日色板 + 朋友语气文案
 */

export default function SuccessPrototype() {
  return (
    <main className="min-h-screen bg-[#FDF8F5] flex items-center justify-center px-6">
      <div className="w-full max-w-md">
        <div className="bg-[#F5EDE4] rounded-xl p-8 shadow-md text-center">
          {/* 成功图标 */}
          <div className="text-4xl mb-4">✅</div>

          {/* 主标题 */}
          <h1 className="text-xl text-gray-800 mb-3">
            邮箱确认好了
          </h1>

          {/* 描述文案 */}
          <p className="text-sm text-[#B5ADA9] mb-6">
            开始你的第一篇日记吧 ✨
          </p>

          {/* 主按钮 */}
          <button
            type="button"
            onClick={() => alert('跳转到首页，开始写日记')}
            className="w-full py-3 rounded-md bg-[#D4856A] text-white font-medium"
          >
            开始写日记 ✦
          </button>
        </div>

        {/* 底部提示 */}
        <p className="text-center text-xs text-[#B5ADA9] mt-6">
          有问题随时找小知~
        </p>
      </div>
    </main>
  );
}