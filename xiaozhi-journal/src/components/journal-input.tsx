'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from '@/store';
import type { Journal, MoodLevel } from '@/types';
import { MOOD_MAP } from '@/types';

const DRAFT_KEY = 'journal-draft';

export function JournalInput({ onExitComplete }: { onExitComplete?: () => void }) {
  const { selectedMood, addJournal, setAIWaiting, updateAIResponse } = useAppStore(
    useShallow((s) => ({
      selectedMood: s.selectedMood,
      addJournal: s.addJournal,
      setAIWaiting: s.setAIWaiting,
      updateAIResponse: s.updateAIResponse,
    }))
  );
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showOfflineMsg, setShowOfflineMsg] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const draftTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const successTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const offlineTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const restoredRef = useRef(false);
  const shouldReduceMotion = useReducedMotion();
  const savingRef = useRef(false);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [content]);

  const saveDraft = useCallback(async (text: string) => {
    try {
      const { setMeta } = await import('@/lib/db');
      await setMeta(DRAFT_KEY, text);
    } catch {
      // Draft save best-effort
    }
  }, []);

  const handleSave = useCallback(async () => {
    if (!content.trim() || !selectedMood || savingRef.current) return;
    savingRef.current = true;

    setSaving(true);
    const isOnline = navigator.onLine;

    const journal: Journal = {
      id: crypto.randomUUID(),
      content: content.trim(),
      mood: selectedMood as 1 | 2 | 3 | 4 | 5,
      moodEmoji: MOOD_MAP[selectedMood as MoodLevel]?.emoji ?? '',
      aiResponse: null,
      goldenQuote: null,
      moodLabel: null,
      timestamp: new Date().toISOString(),
      status: 'pending',
      shareCount: 0,
    };

    await addJournal(journal);
    // Clear draft from IndexedDB
    const { setMeta } = await import('@/lib/db');
    await setMeta(DRAFT_KEY, '');

    setSaving(false);
    setShowSuccess(true);
    setShowOfflineMsg(!isOnline);
    setContent('');

    // Clean up timers
    if (successTimerRef.current) clearTimeout(successTimerRef.current);
    if (offlineTimerRef.current) clearTimeout(offlineTimerRef.current);
    successTimerRef.current = setTimeout(() => setShowSuccess(false), 3000);
    offlineTimerRef.current = setTimeout(() => setShowOfflineMsg(false), 5000);

    if (isOnline) {
      setAIWaiting(true);
      try {
        const res = await fetch('/api/journal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: journal.id, content: journal.content, mood: journal.mood }),
        });

        if (!res.ok) {
          setAIWaiting(false);
          return;
        }

        const data = await res.json();
        if (data?.response) {
          updateAIResponse(journal.id, data);
        } else {
          setAIWaiting(false);
        }
      } catch {
        setAIWaiting(false);
      }
    }

    // Delay onExitComplete so success message is visible briefly
    setTimeout(() => {
      onExitComplete?.();
      savingRef.current = false;
    }, 600);
  }, [content, selectedMood, addJournal, setAIWaiting, updateAIResponse, onExitComplete]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
  };

  // Auto-save draft to IndexedDB (debounce 300ms)
  useEffect(() => {
    if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    draftTimerRef.current = setTimeout(async () => {
      await saveDraft(content);
    }, 300);
    return () => {
      if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
    };
  }, [content, saveDraft]);

  // Restore draft from IndexedDB — only if content is still empty (M4 fix)
  useEffect(() => {
    const restore = async () => {
      if (restoredRef.current) return;
      restoredRef.current = true;
      try {
        const { getMeta } = await import('@/lib/db');
        const draft = await getMeta(DRAFT_KEY);
        if (draft && typeof draft === 'string' && !content) {
          setContent(draft);
        }
      } catch {
        // Draft restore best-effort
      }
    };
    restore();
  }, [content]);

  // Sync draft save on unmount (M3 fix)
  useEffect(() => {
    return () => {
      if (content && !savingRef.current) {
        // Sync save on unmount to prevent draft loss (skip if save in progress)
        import('@/lib/db').then(({ setMeta }) => setMeta(DRAFT_KEY, content)).catch(() => {});
      }
      if (draftTimerRef.current) clearTimeout(draftTimerRef.current);
      if (successTimerRef.current) clearTimeout(successTimerRef.current);
      if (offlineTimerRef.current) clearTimeout(offlineTimerRef.current);
    };
  }, [content]);

  return (
    <motion.div
      initial={shouldReduceMotion ? undefined : { opacity: 0, y: 20 }}
      animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
      exit={shouldReduceMotion ? undefined : { opacity: 0, y: 20 }}
      transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
      className="mb-6"
    >
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="随便写点什么吧，哪怕只有一句话"
        className="w-full bg-transparent border-0 border-b-2 border-border rounded-b-md py-3 px-1 resize-none
          focus:outline-none focus:border-accent placeholder:text-placeholder
          text-base leading-relaxed overflow-y-auto font-sans"
        rows={2}
      />
      <div className="flex justify-center mt-4">
        <motion.button
          whileTap={shouldReduceMotion ? undefined : { scale: 0.95 }}
          onClick={handleSave}
          disabled={!content.trim() || saving}
          className="px-8 py-2.5 bg-accent text-white rounded-xl font-medium
            disabled:opacity-50 disabled:cursor-not-allowed hover:bg-accent-hover transition-colors"
        >
          {saving ? '保存中...' : '记下来'}
        </motion.button>
      </div>

      <AnimatePresence>
        {showSuccess && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-3 text-center text-sm bg-chart-1 rounded-lg py-2 px-4 text-white"
          >
            记下了 ✨
          </motion.div>
        )}
        {showOfflineMsg && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-3 text-center text-muted-foreground text-sm bg-secondary rounded-lg py-2 px-4"
          >
            日记已保存，小知在路上~
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
