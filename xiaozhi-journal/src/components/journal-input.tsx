'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useJournalStore } from '@/store/journal';
import type { Journal, MoodLevel } from '@/types';
import { MOOD_MAP } from '@/types';

const DRAFT_KEY = 'journal-draft';

export function JournalInput() {
  const { selectedMood, addJournal, setAIWaiting, updateAIResponse } = useJournalStore();
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showOfflineMsg, setShowOfflineMsg] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Auto-resize textarea
  useEffect(() => {
    const textarea = textareaRef.current;
    if (textarea) {
      textarea.style.height = 'auto';
      textarea.style.height = `${Math.min(textarea.scrollHeight, 200)}px`;
    }
  }, [content]);

  const handleSave = useCallback(async () => {
    if (!content.trim() || !selectedMood) return;

    setSaving(true);
    const isOnline = navigator.onLine;

    const journal: Journal = {
      id: crypto.randomUUID(),
      content: content.trim(),
      mood: selectedMood as 1 | 2 | 3 | 4 | 5,
      moodEmoji: MOOD_MAP[selectedMood as MoodLevel].emoji,
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

    setTimeout(() => setShowSuccess(false), 3000);
    setTimeout(() => setShowOfflineMsg(false), 5000);
  }, [content, selectedMood, addJournal, setAIWaiting, updateAIResponse]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleSave();
    }
  };

  // Auto-save draft to IndexedDB (debounce 300ms)
  useEffect(() => {
    if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    saveTimerRef.current = setTimeout(async () => {
      try {
        const { setMeta } = await import('@/lib/db');
        await setMeta(DRAFT_KEY, content);
      } catch {
        // Draft save best-effort
      }
    }, 300);
    return () => {
      if (saveTimerRef.current) clearTimeout(saveTimerRef.current);
    };
  }, [content]);

  // Restore draft from IndexedDB
  useEffect(() => {
    const restore = async () => {
      try {
        const { getMeta } = await import('@/lib/db');
        const draft = await getMeta(DRAFT_KEY);
        if (draft && typeof draft === 'string') {
          setContent(draft);
        }
      } catch {
        // Draft restore best-effort
      }
    };
    restore();
  }, []);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 20 }}
      transition={{ type: 'tween', duration: 0.25, ease: 'easeOut' }}
      className="mb-6"
    >
      <textarea
        ref={textareaRef}
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="随便写点什么吧，哪怕只有一句话"
        className="w-full bg-transparent border-0 border-b-2 border-[#E8E0D8] rounded-b-md py-3 px-1 resize-none
          focus:outline-none focus:border-[#D4856A] placeholder:text-[#B5ADA9]
          text-base leading-relaxed overflow-y-auto"
        style={{ maxHeight: '200px', fontFamily: 'var(--font-noto-sans)' }}
        rows={2}
      />
      <div className="flex justify-center mt-4">
        <motion.button
          whileTap={{ scale: 0.95 }}
          onClick={handleSave}
          disabled={!content.trim() || saving}
          className="px-8 py-2.5 bg-[#D4856A] text-white rounded-xl font-medium
            disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[#C47459] transition-colors"
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
            className="mt-3 text-center text-sm bg-[#A8C5A0] rounded-lg py-2 px-4 text-white"
          >
            记下了 ✨
          </motion.div>
        )}
        {showOfflineMsg && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mt-3 text-center text-[#8A817C] text-sm bg-[#F5EDE4] rounded-lg py-2 px-4"
          >
            日记已保存，小知在路上~
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
