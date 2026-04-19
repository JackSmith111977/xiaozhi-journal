'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { signOut } from '@/lib/auth';
import { exportUserData } from '@/lib/export';
import { deleteAccount } from '@/lib/account';
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
  const [exporting, setExporting] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deleteConfirmInput, setDeleteConfirmInput] = useState('');
  const messageTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cleanup message timers on unmount
  useEffect(() => {
    return () => {
      if (messageTimerRef.current) clearTimeout(messageTimerRef.current);
    };
  }, []);

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

  const autoDismiss = (cb: () => void) => {
    if (messageTimerRef.current) clearTimeout(messageTimerRef.current);
    messageTimerRef.current = setTimeout(() => {
      messageTimerRef.current = null;
      cb();
    }, 2000);
  };

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
          user_metadata: { ...(currentUser.user_metadata ?? {}), nickname: trimmed },
        });
      }

      setMessage({ type: 'success', text: '已保存' });
      autoDismiss(() => setMessage(null));
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
      autoDismiss(() => setMessage(null));
    } catch {
      setMessage({ type: 'error', text: '上传失败，请稍后重试' });
    } finally {
      setSavingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleExport = async () => {
    setExporting(true);
    setMessage(null);
    try {
      await exportUserData();
      setMessage({ type: 'success', text: '导出成功' });
      autoDismiss(() => setMessage(null));
    } catch (err) {
      const msg = err instanceof Error ? err.message : '导出失败，请稍后再试';
      setMessage({ type: 'error', text: msg });
    } finally {
      setExporting(false);
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

  const handleDeleteAccount = async () => {
    if (deleting) return;
    if (deleteConfirmInput.trim() !== '确认删除') return;
    setDeleting(true);
    setMessage(null);
    try {
      await deleteAccount();
      setShowDeleteConfirm(false);
      useAuthStore.getState().setUser(null);
      router.push('/auth/login');
    } catch (err) {
      const msg = err instanceof Error ? err.message : '删除失败，请稍后再试';
      setMessage({ type: 'error', text: msg });
      setDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  // Cache-busting: only re-fetch when avatar_url actually changes
  const avatarUrl = useMemo(() => {
    if (!profile?.avatar_url) return null;
    return `${supabase.storage.from('avatars').getPublicUrl(profile.avatar_url).data.publicUrl}?t=${Date.now()}`;
  }, [profile?.avatar_url]);

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

        {/* Sign out & Danger zone */}
        <div className="pt-8 border-t border-[#E8E0D8] space-y-3">
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="w-full py-3 rounded-xl text-sm font-medium transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            style={{ backgroundColor: '#A8C5A0', color: '#fff' }}
          >
            {exporting ? '正在准备你的数据，请稍候...' : '导出数据'}
          </button>
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

        {/* Delete account danger zone */}
        <div className="pt-8 border-t border-[#E8E0D8]">
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={deleting}
            className="w-full py-3 rounded-xl text-sm font-medium transition-opacity disabled:opacity-40 disabled:cursor-not-allowed border-2 border-[#D4856A]"
            style={{ backgroundColor: 'transparent', color: '#D4856A' }}
          >
            删除账户
          </button>
        </div>

        {/* Delete confirmation modal */}
        {showDeleteConfirm && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4"
            onClick={() => { if (!deleting) setShowDeleteConfirm(false); }}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="bg-[#FDF8F5] rounded-2xl p-6 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h2
                className="text-lg text-[#3D3D3D] mb-3"
                style={{ fontFamily: 'var(--font-noto-serif)' }}
              >
                确认删除账户？
              </h2>
              <p className="text-sm text-[#8A817C] mb-4" style={{ fontFamily: 'var(--font-noto-sans)' }}>
                删除后 30 天内数据将被彻底清除，此操作不可撤销。
              </p>
              <p className="text-sm text-[#8A817C] mb-4" style={{ fontFamily: 'var(--font-noto-sans)' }}>
                请输入「<strong>确认删除</strong>」以继续：
              </p>
              <input
                type="text"
                value={deleteConfirmInput}
                onChange={(e) => setDeleteConfirmInput(e.target.value)}
                placeholder="确认删除"
                className="w-full bg-transparent border-b-2 border-[#E8E0D8] py-2 text-[#3D3D3D] placeholder-[#8A817C] focus:outline-none focus:border-[#D4856A] transition-colors mb-6"
                style={{ fontFamily: 'var(--font-noto-sans)' }}
                disabled={deleting}
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  className="flex-1 py-3 rounded-xl text-sm font-medium transition-opacity disabled:opacity-40"
                  style={{ backgroundColor: '#E8E0D8', color: '#3D3D3D' }}
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmInput.trim() !== '确认删除' || deleting}
                  className="flex-1 py-3 rounded-xl text-sm font-medium text-white transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
                  style={{ backgroundColor: '#D4856A' }}
                >
                  {deleting ? '删除中...' : '确认删除'}
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}

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
