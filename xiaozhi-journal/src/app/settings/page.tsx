'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase/client';
import { signOut } from '@/lib/auth';
import { exportUserData } from '@/lib/export';
import { deleteAccount } from '@/lib/account';
import { useAppStore, initializeAuth } from '@/store';
import { AuthGuard } from '@/components/auth-guard';
import { motion } from 'motion/react';

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
  const { user } = useAppStore((s) => ({ user: s.user }));
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

  // Close delete modal on Escape key
  useEffect(() => {
    if (!showDeleteConfirm) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !deleting) setShowDeleteConfirm(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => { window.removeEventListener('keydown', handleKeyDown); };
  }, [showDeleteConfirm, deleting]);

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
      const currentUser = useAppStore.getState().user;
      if (currentUser) {
        useAppStore.getState().setUser({
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
      useAppStore.getState().setUser(null);
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
      useAppStore.getState().setUser(null);
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
    return supabase.storage.from('avatars').getPublicUrl(profile.avatar_url).data.publicUrl;
  }, [profile?.avatar_url]);

  return (
    <main className="min-h-screen bg-background px-6 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="mx-auto max-w-md"
      >
        <h1 className="text-2xl text-foreground text-center mb-8 font-serif">
          设置
        </h1>

        {/* Avatar section */}
        <div className="flex items-center gap-6 mb-8 pb-8 border-b border-border">
          <div
            className="w-20 h-20 rounded-full bg-muted flex items-center justify-center overflow-hidden flex-shrink-0"
          >
            {avatarUrl ? (
              <img
                src={avatarUrl}
                alt="头像"
                className="w-full h-full object-cover"
              />
            ) : (
              <span className="text-3xl text-muted-foreground">
                {(profile?.nickname || user?.email || 'U').charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={savingAvatar}
              className="px-4 py-2 rounded-xl text-sm text-primary-foreground font-medium bg-primary transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
            >
              更换头像
            </button>
            <p className="text-xs text-muted-foreground mt-1">JPG/PNG，不超过 2MB</p>
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
          <label className="text-sm text-muted-foreground mb-1 block">邮箱</label>
          <p className="text-foreground font-sans">
            {user?.email}
          </p>
        </div>

        {/* Nickname edit */}
        {loadingProfile ? (
          <div className="mb-8 text-muted-foreground animate-pulse">加载个人信息中...</div>
        ) : (
          <div className="mb-8">
            <label className="text-sm text-muted-foreground mb-1 block">昵称</label>
            <div className="flex gap-3">
              <input
                type="text"
                value={nickname}
                onChange={(e) => setNickname(e.target.value)}
                maxLength={20}
                placeholder="请输入昵称（1-20 字符）"
                className="flex-1 bg-transparent border-b-2 border-border py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent transition-colors font-sans"
              />
              <button
                type="button"
                onClick={handleSaveNickname}
                disabled={savingNickname}
                className="px-4 py-2 rounded-xl text-sm text-white font-medium bg-chart-1 transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {savingNickname ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        )}

        {/* Sign out & Danger zone */}
        <div className="pt-8 border-t border-border space-y-3">
          <button
            type="button"
            onClick={handleExport}
            disabled={exporting}
            className="w-full py-3 rounded-xl text-sm font-medium bg-chart-1 text-white transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {exporting ? '正在准备你的数据，请稍候...' : '导出数据'}
          </button>
          <button
            type="button"
            onClick={handleSignOut}
            disabled={signingOut}
            className="w-full py-3 rounded-xl text-sm font-medium bg-accent text-white transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {signingOut ? '退出中...' : '退出登录'}
          </button>
        </div>

        {/* Delete account danger zone */}
        <div className="pt-8 border-t border-border">
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            disabled={deleting}
            className="w-full py-3 rounded-xl text-sm font-medium text-accent border-2 border-accent transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
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
              className="bg-background rounded-2xl p-6 max-w-sm w-full"
              onClick={(e) => e.stopPropagation()}
            >
              <h2 className="text-lg text-foreground mb-3 font-serif">
                确认删除账户？
              </h2>
              <p className="text-sm text-muted-foreground mb-4 font-sans">
                删除后 30 天内数据将被彻底清除，此操作不可撤销。
              </p>
              <p className="text-sm text-muted-foreground mb-4 font-sans">
                请输入「<strong>确认删除</strong>」以继续：
              </p>
              <input
                type="text"
                value={deleteConfirmInput}
                onChange={(e) => setDeleteConfirmInput(e.target.value)}
                placeholder="确认删除"
                className="w-full bg-transparent border-b-2 border-border py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent transition-colors mb-6 font-sans"
                disabled={deleting}
              />
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => setShowDeleteConfirm(false)}
                  disabled={deleting}
                  className="flex-1 py-3 rounded-xl text-sm font-medium bg-muted text-foreground transition-opacity disabled:opacity-40"
                >
                  取消
                </button>
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={deleteConfirmInput.trim() !== '确认删除' || deleting}
                  className="flex-1 py-3 rounded-xl text-sm font-medium text-white bg-accent transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
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
              message.type === 'success' ? 'text-chart-1' : 'text-accent'
            }`}
          >
            {message.text}
          </motion.p>
        )}
      </motion.div>
    </main>
  );
}
