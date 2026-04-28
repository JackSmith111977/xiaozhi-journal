'use client';

import { useState } from 'react';

/**
 * 认证流程原型 H: 安全设置区块
 *
 * 场景：用户在设置页查看安全设置
 * 功能：密码修改、登录历史表格、安全事件时间线
 *
 * 设计规范：暖日色板 + 朋友语气文案
 */

// 模拟登录历史数据
const mockLoginHistory = [
  { time: '今天 10:30', ip: '192.168.1.1', device: 'Chrome on Mac', method: '邮箱' },
  { time: '昨天 22:15', ip: '192.168.1.1', device: 'Chrome on Mac', method: '邮箱' },
  { time: '3 天前', ip: '10.0.0.5', device: 'Safari on iPhone', method: '邮箱' },
  { time: '7 天前', ip: '192.168.1.100', device: 'Edge on Windows', method: '微信' },
];

// 模拟安全事件数据
const mockSecurityEvents = [
  { date: '2026-04-27', event: '密码修改', detail: '用户主动修改' },
  { date: '2026-04-20', event: '邮箱验证', detail: '验证成功' },
  { date: '2026-04-15', event: '新设备登录', detail: 'Safari on iPhone' },
];

export default function SecuritySettingsPrototype() {
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const handlePasswordSubmit = () => {
    if (newPassword.length < 8) {
      alert('密码至少 8 位哦~');
      return;
    }
    if (newPassword !== confirmPassword) {
      alert('两次密码不太一样~');
      return;
    }
    alert('密码修改成功！（这是原型演示）');
    setShowPasswordForm(false);
    setCurrentPassword('');
    setNewPassword('');
    setConfirmPassword('');
  };

  return (
    <main className="min-h-screen bg-[#FDF8F5] px-6 py-8">
      <div className="max-w-2xl mx-auto">
        {/* 标题 */}
        <h1 className="text-2xl text-gray-800 mb-8">设置</h1>

        {/* 个人资料区块 */}
        <section className="mb-8">
          <h2 className="text-sm text-[#B5ADA9] mb-4 flex items-center gap-2">
            <span>👤</span> 个人资料
          </h2>
          <div className="bg-[#F5EDE4] rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between mb-4">
              <div>
                <span className="text-xs text-[#B5ADA9]">邮箱</span>
                <p className="text-sm text-gray-800">kei@example.com</p>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-[#B5ADA9]">昵称</span>
                <p className="text-sm text-gray-800">Kei</p>
              </div>
              <button
                type="button"
                onClick={() => alert('编辑昵称')}
                className="text-xs text-[#D4856A] hover:underline"
              >
                修改
              </button>
            </div>
          </div>
        </section>

        {/* 安全设置区块 */}
        <section className="mb-8">
          <h2 className="text-sm text-[#B5ADA9] mb-4 flex items-center gap-2">
            <span>🔐</span> 安全设置
          </h2>
          <div className="bg-[#F5EDE4] rounded-xl p-6 shadow-md">
            {/* 修改密码 */}
            <div className="mb-6">
              <h3 className="text-sm text-gray-800 mb-3">修改密码</h3>

              {!showPasswordForm ? (
                <button
                  type="button"
                  onClick={() => setShowPasswordForm(true)}
                  className="text-sm text-[#D4856A] hover:underline"
                >
                  修改密码
                </button>
              ) : (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs text-[#B5ADA9] mb-1">
                      当前密码
                    </label>
                    <input
                      type="password"
                      value={currentPassword}
                      onChange={(e) => setCurrentPassword(e.target.value)}
                      placeholder="输入当前密码..."
                      className="w-full bg-transparent border-b border-[#E8E0D8] py-2 text-gray-800 placeholder:text-[#B5ADA9] focus:outline-none focus:border-[#D4856A]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#B5ADA9] mb-1">
                      新密码
                    </label>
                    <input
                      type="password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      placeholder="输入新密码..."
                      className="w-full bg-transparent border-b border-[#E8E0D8] py-2 text-gray-800 placeholder:text-[#B5ADA9] focus:outline-none focus:border-[#D4856A]"
                    />
                  </div>
                  <div>
                    <label className="block text-xs text-[#B5ADA9] mb-1">
                      确认新密码
                    </label>
                    <input
                      type="password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      placeholder="再次输入..."
                      className="w-full bg-transparent border-b border-[#E8E0D8] py-2 text-gray-800 placeholder:text-[#B5ADA9] focus:outline-none focus:border-[#D4856A]"
                    />
                  </div>
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={handlePasswordSubmit}
                      className="px-4 py-2 rounded-md bg-[#D4856A] text-white text-sm"
                    >
                      确认修改
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowPasswordForm(false)}
                      className="px-4 py-2 rounded-md bg-[#E8E0D8] text-[#B5ADA9] text-sm"
                    >
                      取消
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* 登录历史 */}
            <div className="mb-6">
              <h3 className="text-sm text-gray-800 mb-3">登录历史</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-[#B5ADA9] border-b border-[#E8E0D8]">
                      <th className="py-2 text-left">时间</th>
                      <th className="py-2 text-left">IP</th>
                      <th className="py-2 text-left">设备</th>
                      <th className="py-2 text-left">方式</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mockLoginHistory.map((row, idx) => (
                      <tr key={idx} className="border-b border-[#E8E0D8]/50">
                        <td className="py-2 text-gray-800">{row.time}</td>
                        <td className="py-2 text-[#B5ADA9]">{row.ip}</td>
                        <td className="py-2 text-gray-800">{row.device}</td>
                        <td className="py-2 text-gray-800">{row.method}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <button
                type="button"
                onClick={() => alert('查看全部 30 天记录')}
                className="text-xs text-[#D4856A] hover:underline mt-2"
              >
                查看全部 30 天记录
              </button>
            </div>

            {/* 安全事件时间线 */}
            <div>
              <h3 className="text-sm text-gray-800 mb-3">安全事件</h3>
              <div className="space-y-3">
                {mockSecurityEvents.map((event, idx) => (
                  <div
                    key={idx}
                    className="flex items-start gap-3 text-sm"
                  >
                    <div className="w-2 h-2 rounded-full bg-[#D4856A] mt-1.5" />
                    <div>
                      <span className="text-[#B5ADA9]">{event.date}</span>
                      <span className="mx-2 text-gray-800">{event.event}</span>
                      <span className="text-[#B5ADA9]">({event.detail})</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* AI 配置区块 */}
        <section className="mb-8">
          <h2 className="text-sm text-[#B5ADA9] mb-4 flex items-center gap-2">
            <span>🤖</span> AI 配置
          </h2>
          <div className="bg-[#F5EDE4] rounded-xl p-6 shadow-md">
            <div className="flex items-center justify-between">
              <div>
                <span className="text-xs text-[#B5ADA9]">API Key</span>
                <p className="text-sm text-gray-800">未配置</p>
              </div>
              <button
                type="button"
                onClick={() => alert('配置 BYOK')}
                className="text-xs text-[#D4856A] hover:underline"
              >
                配置
              </button>
            </div>
          </div>
        </section>

        {/* 注销账户 */}
        <section>
          <button
            type="button"
            onClick={() => alert('确认注销账户？')}
            className="text-sm text-[#D4856A] hover:underline"
          >
            注销账户
          </button>
        </section>
      </div>
    </main>
  );
}