'use client';

import Link from 'next/link';

/**
 * 认证流程原型索引页
 *
 * 展示所有原型页面的链接，方便用户逐一查看
 */

const prototypes = [
  { id: 'A', name: '登录/注册页', path: '/auth/prototypes/login-register', description: '三模式切换 + 密码强度 + 邮箱确认选择' },
  { id: 'C', name: '链接确认等待页', path: '/auth/prototypes/link-waiting', description: '倒计时 + 过期状态 + 重发' },
  { id: 'D', name: 'OTP 验证码输入页', path: '/auth/prototypes/otp-input', description: '6位验证码 + 自动聚焦 + 错误提示' },
  { id: 'E', name: '验证成功页', path: '/auth/prototypes/success', description: '验证成功消息 + 开始引导' },
  { id: 'F', name: '忘记密码页', path: '/auth/prototypes/forgot-password', description: '输入邮箱 + 发送重置链接' },
  { id: 'G', name: '重置密码页', path: '/auth/prototypes/reset-password', description: '新密码 + 强度指示器 + 确认' },
  { id: 'H', name: '安全设置页', path: '/auth/prototypes/security-settings', description: '密码修改 + 登录历史 + 安全事件' },
];

export default function PrototypesIndex() {
  return (
    <main className="min-h-screen bg-[#FDF8F5] px-6 py-12">
      <div className="max-w-2xl mx-auto">
        {/* 标题 */}
        <h1 className="text-2xl text-gray-800 mb-2">
          认证流程原型预览
        </h1>
        <p className="text-sm text-[#B5ADA9] mb-8">
          使用暖日色板 + 朋友语气文案设计
        </p>

        {/* 原型列表 */}
        <div className="grid gap-4">
          {prototypes.map((proto) => (
            <Link
              key={proto.id}
              href={proto.path}
              className="block bg-[#F5EDE4] rounded-xl p-6 shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="flex items-start gap-4">
                {/* 原型编号 */}
                <span className="w-8 h-8 rounded-full bg-[#D4856A] text-white text-sm font-medium flex items-center justify-center">
                  {proto.id}
                </span>

                {/* 原型信息 */}
                <div>
                  <h2 className="text-lg text-gray-800 font-medium">
                    {proto.name}
                  </h2>
                  <p className="text-sm text-[#B5ADA9] mt-1">
                    {proto.description}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* 设计规范说明 */}
        <div className="mt-8 p-6 bg-[#F5EDE4] rounded-xl">
          <h2 className="text-lg text-gray-800 mb-4">设计规范</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <span className="text-[#B5ADA9]">页面背景:</span>
              <span className="ml-2 text-gray-800">#FDF8F5</span>
            </div>
            <div>
              <span className="text-[#B5ADA9]">卡片背景:</span>
              <span className="ml-2 text-gray-800">#F5EDE4</span>
            </div>
            <div>
              <span className="text-[#B5ADA9]">主按钮:</span>
              <span className="ml-2 text-gray-800">#E8C4A0</span>
            </div>
            <div>
              <span className="text-[#B5ADA9]">强调色/错误:</span>
              <span className="ml-2 text-gray-800">#D4856A</span>
            </div>
            <div>
              <span className="text-[#B5ADA9]">成功提示:</span>
              <span className="ml-2 text-gray-800">#A8C5A0</span>
            </div>
            <div>
              <span className="text-[#B5ADA9]">边框:</span>
              <span className="ml-2 text-gray-800">#E8E0D8</span>
            </div>
            <div>
              <span className="text-[#B5ADA9]">弱化文字:</span>
              <span className="ml-2 text-gray-800">#B5ADA9</span>
            </div>
          </div>
        </div>

        {/* 启动说明 */}
        <div className="mt-6 p-4 bg-[#E8C4A0]/30 rounded-lg">
          <p className="text-sm text-gray-800">
            <strong>启动方式:</strong> 运行 <code className="bg-[#E8E0D8] px-2 py-1 rounded">pnpm dev</code>，然后点击上方链接查看各原型页面
          </p>
        </div>
      </div>
    </main>
  );
}