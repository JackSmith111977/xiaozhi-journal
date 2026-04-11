'use client';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useJournalStore } from '@/store/journal';
import type { Journal } from '@/types';

export function JournalInput() {
  const { selectedMood, journals, addJournal, setAIWaiting, setSelectedMood, updateAIResponse } = useJournalStore();
  const [content, setContent] = useState('');
  const [saving, setSaving] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showOfflineMsg, setShowOfflineMsg] = useState(false);

  const handleSave = useCallback(async () => {
    if (!content.trim() || !selectedMood) return;

    setSaving(true);
    const isOnline = navigator.onLine;

    const journal: Journal = {
      id: crypto.randomUUID(),
      content: content.trim(),
      mood: selectedMood as 1 | 2 | 3 | 4 | 5,
      moodEmoji: ['😡', '😔', '😐', '😊', '😴'][selectedMood - 1],
      aiResponse: null,
      goldenQuote: null,
      moodLabel: null,
      timestamp: new Date().toISOString(),
      status: isOnline ? 'pending' : 'pending',
      shareCount: 0,
    };

    await addJournal(journal);
    setSaving(false);
    setShowSuccess(true);
    setShowOfflineMsg(!isOnline);
    setSelectedMood(null);
    setContent('');

    if (isOnline) {
      setAIWaiting(true);
      try {
        const res = await fetch('/api/journal', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: journal.id, content: journal.content, mood: journal.mood }),
        });
        const data = await res.json();
        if (data) {
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
  }, [content, selectedMood, addJournal, setAIWaiting, setSelectedMood, updateAIResponse]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      handleSave();
    }
  };

  // Auto-save draft
  useEffect(() => {
    const timer = setTimeout(() => {
      if (content) {
        localStorage.setItem('journal-draft', content);
      }
    }, 300);
    return () => clearTimeout(timer);
  }, [content]);

  // Restore draft
  useEffect(() => {
    const draft = localStorage.getItem('journal-draft');
    if (draft) setContent(draft);
  }, []);

  if (!selectedMood) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300 }}
      className="mb-6"
    >
      <textarea
        value={content}
        onChange={(e) => setContent(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder="随便写点什么吧，哪怕只有一句话"
        className="w-full bg-transparent border-0 border-b-2 border-[#E8E0D8] rounded-b-md py-3 px-1 resize-none
          focus:outline-none focus:border-[#D4856A] placeholder:text-[#B5ADA9]
          text-base leading-relaxed"
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
            className="mt-3 text-center text-[#A8C5A0] text-sm"
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
