'use client';

import { useState, useCallback, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'motion/react';
import { useReducedMotion } from 'motion/react';
import { AuthGuard } from '@/components/auth-guard';
import { supabase } from '@/lib/supabase/client';

const PRESET_AVATARS = ['😊', '😔', '😐', '😴', '😡', '']; // '' = custom

const NICKNAME_MAX = 20;

export default function SettingsPage() {
  return (
    <AuthGuard requireAuth={true}>
      <SettingsContent />
    </AuthGuard>
  );
}

function SettingsContent() {
  const router = useRouter();
  const [nickname, setNickname] = useState('');
  const [avatar, setAvatar] = useState('');
  const [selectedPreset, setSelectedPreset] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [fetching, setFetching] = useState(true);
  const shouldReduceMotion = useReducedMotion();
  const skipTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Load existing profile
  useEffect(() => {
    const loadProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        setFetching(false);
        return;
      }

      const { data: profile } = await supabase
        .from('profiles')
        .select('nickname, avatar_url')
        .eq('id', session.user.id)
        .single();

      if (profile) {
        setNickname(profile.nickname ?? '');
        if (profile.avatar_url) {
          const idx = PRESET_AVATARS.indexOf(profile.avatar_url);
          if (idx >= 0) {
            setSelectedPreset(idx);
            setAvatar(profile.avatar_url);
          } else {
            setAvatar(profile.avatar_url);
            setSelectedPreset(null);
          }
        }
      }

      setFetching(false);
    };

    loadProfile();
  }, []);

  // Cleanup skip timer on unmount
  useEffect(() => {
    return () => {
      if (skipTimerRef.current) clearTimeout(skipTimerRef.current);
    };
  }, []);

  const handlePresetClick = (index: number) => {
    setSelectedPreset(index);
    setAvatar(PRESET_AVATARS[index] ?? '');
  };

  const handleNicknameChange = (value: string) => {
    if (value.length > NICKNAME_MAX) return;
    setNickname(value);
  };

  const handleSkip = () => {
    setToastMessage('已跳过，以后可以在设置里修改~');
    setShowToast(true);
    skipTimerRef.current = setTimeout(() => {
      setShowToast(false);
      router.push('/');
    }, 1500);
  };

  const handleSave = useCallback(async () => {
    if (!nickname.trim()) {
      setError('请输入昵称');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('未登录');

      const { error: updateError } = await supabase
        .from('profiles')
        .update({
          nickname: nickname.trim(),
          avatar_url: avatar || null,
        })
        .eq('id', session.user.id);

      if (updateError) throw new Error(updateError.message);

      router.push('/');
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : '保存失败');
    } finally {
      setLoading(false);
    }
  }, [nickname, avatar, router]);

  const nicknameValid = nickname.trim().length > 0;

  if (fetching) {
    return (
      <main className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground animate-pulse">加载中...</div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-background flex items-center justify-center px-6">
      <motion.div
        initial={shouldReduceMotion ? undefined : { opacity: 0, y: 20 }}
        animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <h1 className="text-2xl text-foreground text-center mb-2 font-serif">
          设置个人资料
        </h1>
        <p className="text-sm text-muted-foreground text-center mb-8">
          让大家认识你
        </p>

        {/* Avatar selection */}
        <div className="mb-8">
          <label className="text-sm text-foreground font-medium mb-3 block">
            选择一个头像
          </label>
          <div className="flex gap-2 justify-center">
            {PRESET_AVATARS.map((emoji, index) => {
              const isSelected = selectedPreset === index;
              return (
                <button
                  key={index}
                  type="button"
                  onClick={() => handlePresetClick(index)}
                  className={`w-12 h-12 rounded-xl text-2xl flex items-center justify-center transition-all ${
                    isSelected
                      ? 'ring-2 ring-accent bg-secondary scale-110'
                      : 'bg-secondary hover:scale-105'
                  }`}
                >
                  {emoji || '✏️'}
                </button>
              );
            })}
          </div>
        </div>

        {/* Nickname input */}
        <div className="mb-6">
          <label className="text-sm text-foreground font-medium mb-2 block">
            昵称
          </label>
          <input
            type="text"
            value={nickname}
            onChange={(e) => handleNicknameChange(e.target.value)}
            placeholder="给自己起个名字吧"
            autoFocus
            maxLength={NICKNAME_MAX}
            className="w-full bg-transparent border-b-2 border-border py-2 text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-accent transition-colors font-sans"
          />
          <div className="flex justify-between mt-1">
            <p className="text-xs text-muted-foreground">
              1-{NICKNAME_MAX} 字符
            </p>
            <p className="text-xs text-muted-foreground">
              {nickname.length}/{NICKNAME_MAX}
            </p>
          </div>
        </div>

        {/* Error */}
        {error && (
          <motion.p
            initial={shouldReduceMotion ? undefined : { opacity: 0 }}
            animate={shouldReduceMotion ? undefined : { opacity: 1 }}
            className="text-center text-sm text-accent mb-4"
          >
            {error}
          </motion.p>
        )}

        {/* Buttons */}
        <div className="flex gap-3">
          <button
            type="button"
            onClick={handleSkip}
            className="flex-1 py-3 rounded-xl text-accent font-medium border-2 border-accent hover:bg-secondary transition-colors"
          >
            以后再说
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!nicknameValid || loading}
            className="flex-1 py-3 rounded-xl text-primary-foreground font-medium bg-primary transition-opacity disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {loading ? '保存中...' : '开始写日记 ✨'}
          </button>
        </div>
      </motion.div>

      {/* Skip toast */}
      <AnimatePresence>
        {showToast && (
          <motion.div
            initial={shouldReduceMotion ? undefined : { opacity: 0, y: 20 }}
            animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
            exit={shouldReduceMotion ? undefined : { opacity: 0, y: 10 }}
            transition={{ duration: 0.25 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-50 px-4 py-2 rounded-xl text-sm text-white shadow-lg bg-chart-1"
          >
            {toastMessage}
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
}
