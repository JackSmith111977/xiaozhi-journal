'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { signOut } from '@/lib/auth';
import { useAuthStore } from '@/store/auth';
import { AuthGuard } from '@/components/auth-guard';
import { motion } from 'framer-motion';

interface Profile {
  nickname: string;
  avatar_url: string | null;
}

export default function SettingsPage() {
  return (
    <AuthGuard>
      <SettingsContent />
    </AuthGuard>
  );
}

function SettingsContent() {
  const router = useRouter();
  const { user } = useAuthStore();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [nickname, setNickname] = useState('');
  const [savingNickname, setSavingNickname] = useState(false);
  const [savingAvatar, setSavingAvatar] = useState(false);
  const [signingOut, setSigningOut] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Load profile data
  useEffect(() => {
    if (!user) return;
    let cancelled = false;

    supabase
      .from('profiles')
      .select('nickname, avatar_url')
      .eq('id', user.id)
      .single()
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error || !data) {
          setProfile(null);
          setNickname(user.email?.split('@')[0] || '用户');
        } else {
          setProfile(data);
          setNickname(data.nickname || user.email?.split('@')[0] || '用户');
        }
        setLoadingProfile(false);
      });

    return () => { cancelled = true; };
  }, [user]);

  const handleSaveNickname = async () => {
    const trimmed = nickname.trim();
    if (trimmed.length < 1 || trimmed.length > 20) {
      setMessage({ type: 'error', text: '昵称长度为 1-20 字符' });
      return;
    }

    const previousNickname = nickname;
    setSavingNickname(true);
    setMessage(null);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ nickname: trimmed })
        .eq('id', user!.id);

      if (error) {
        console.warn('[Settings] Failed to update profile:', error.message);
        setMessage({ type: 'error', text: '保存失败，请稍后重试' });
        setNickname(previousNickname);
        return;
      }

      setProfile((prev) => (prev ? { ...prev, nickname: trimmed } : null));

      // P0 fix: Sync Zustand store with updated nickname
      const currentUser = useAuthStore.getState().user;
      if (currentUser) {
        useAuthStore.getState().setUser({
          ...currentUser,
          user_metadata: { ...currentUser.user_metadata, nickname: trimmed },
        });
      }

      setMessage({ type: 'success', text: '已保存' });
      // Auto-dismiss after 2s
      setTimeout(() => setMessage(null), 2000);
    } catch {
      setMessage({ type: 'error', text: '保存失败，请稍后重试' });
      setNickname(previousNickname);
    } finally {
      setSavingNickname(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    // File size validation (≤ 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setMessage({ type: 'error', text: '头像大小不能超过 2MB' });
      e.target.value = '';
      return;
    }

    // File type validation
    const allowedTypes = ['image/jpeg', 'image/png'];
    if (!allowedTypes.includes(file.type)) {
      setMessage({ type: 'error', text: '仅支持 JPG/PNG 格式' });
      e.target.value = '';
      return;
    }

    setSavingAvatar(true);
    setMessage(null);

    try {
      const ext = file.type === 'image/png' ? 'png' : 'jpg';
      const filePath = `${user.id}/avatar.${ext}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, { upsert: true });

      if (uploadError) {
        console.warn('[Settings] Avatar upload failed:', uploadError.message);
        setMessage({ type: 'error', text: '上传失败，请稍后重试' });
        return;
      }

      // Update profile with new avatar URL
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: filePath })
        .eq('id', user.id);

      if (updateError) {
        console.warn('[Settings] Failed to update avatar_url:', updateError.message);
        setMessage({ type: 'error', text: '头像上传成功但保存失败' });
        return;
      }

      setProfile((prev) => (prev ? { ...prev, avatar_url: filePath } : null));
      setMessage({ type: 'success', text: '头像已更新' });
      // Auto-dismiss after 2s
      setTimeout(() => setMessage(null), 2000);
    } catch {
      setMessage({ type: 'error', text: '上传失败，请稍后重试' });
    } finally {
      setSavingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleSignOut = async () => {
    setSigningOut(true);
    try {
      await signOut();
      useAuthStore.getState().setUser(null);
      router.push('/auth/login');
    } catch {
      setMessage({ type: 'error', text: '退出失败，请稍后再试' });
      setSigningOut(false);
    }
  };

  // P1 fix: cache-busting to avoid browser serving stale avatar images
  const avatarUrl = profile?.avatar_url
    ? `${supabase.storage.from('avatars').getPublicUrl(profile.avatar_url).data.publicUrl}?t=${Date.now()}`
    : null;

  return (
    <main className="min-h-screen bg-[#FDF8F5] px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mx-auto max-w-md"
      >
        <h1
          className="text-2xl text-[#3D3D3D] text-center mb-8"
          style={{ fontFamily: 'var(--font-noto-serif)' }}
        >
          设置
        </h1>

        {/* Avatar section */}
        <div className="flex items-center gap-6 mb-8 pb-8 border-b border-[#E8E0D8]">
          <div
            className="w-20 h-20 rounded-full bg-[#E8E0D8] flex items-center justify-center overflow-hidden flex-shrink-0"
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="头像"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-3xl text-[#8A817C]">
                {(profile?.nickname || user?.email || 'U').charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={savingAvatar}
              className="px-4 py-2 rounded-xl text-sm text-white font-medium transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
              style={{ backgroundColor: '#E8C4A0' }}
            >
              更换头像
            </button>
            <p className="text-xs text-[#8A817C] mt-1">JPG/PNG，不超过 2MB</p>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/jpeg,image/png"
            onChange={handleAvatarChange}
            className="hidden"
          />
        </div>

        {/* Profile info */}
        <div className="mb-6">
          <label className="text-sm text-[#8A817C] mb-1 block">邮箱</label>
          <p className="text-[#3D3D3D]" style={{ fontFamily: 'var(--font-noto-sans)' }}>
            {user?.email}
          </p>
        </div>

        {/* Nickname edit */}
        {loadingProfile ? (
          <div className="mb-8 text-[#8A817C] animate-pulse">加载个人信息中...</div>
        ) : (
          <div className="mb-8">
            <label className="text-sm text-[#8A817C] mb-1 block">昵称</label>
            <div className="flex gap-3">
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={20}
                placeholder="请输入昵称（1-20 字符）"
                className="flex-1 bg-transparent border-b-2 border-[#E8E0D8] py-2 text-[#3D3D3D] placeholder-[#8A817C] focus:outline-none focus:border-[#D4856A] transition-colors"
                style={{ fontFamily: 'var(--font-noto-sans)' }}
              />
              <button
                type="button"
                onClick={handleSaveNickname}
                disabled={savingNickname}
                className="px-4 py-2 rounded-xl text-sm text-white font-medium transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                style={{ backgroundColor: '#A8C5A0' }}
              >
                {savingNickname ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        )}

        {/* Sign out */}
        <div className="pt-8 border-t border-[#E8E0D8]">
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="w-full py-3 rounded-xl text-sm font-medium transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#D4856A', color: '#fff' }}
          >
            {signingOut ? '退出中...' : '退出登录'}
          </button>
        </div>

        {/* Feedback messages */}
        {message && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className={`text-center text-sm mt-4 ${
              message.type === 'success' ? 'text-[#A8C5A0]' : 'text-[#D4856A]'
            }`}
          >
            {message.text}
          </motion.p>
        )}
      </motion.div>
    </main>
  );
}
