'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { useJournalStore } from '@/store/journal';
import { MoodSelector } from '@/components/mood-selector';
import { JournalInput } from '@/components/journal-input';
import { EmotionChart } from '@/components/emotion-chart';
import { TypingIndicator } from '@/components/typing-indicator';
import { XiaozhiBubble } from '@/components/xiaozhi-bubble';
import { GoldenQuote } from '@/components/golden-quote';
import { EmptyState } from '@/components/empty-state';
import { CapsulePopup } from '@/components/capsule-popup';
import { getMeta, setMeta, getPendingJournals, addJournal as dbAdd, updateJournal as dbUpdate, getJournals } from '@/lib/db';
import { checkTimeCapsule, recordShown } from '@/lib/time-capsule';
import { SEED_JOURNALS } from '@/lib/seed-data';
import type { Journal, AIResponse } from '@/types';

export default function Home() {
  const { journals, loading, fetchJournals, aiWaiting, selectedMood } = useJournalStore();
  const [initialized, setInitialized] = useState(false);
  const [capsuleJournal, setCapsuleJournal] = useState<Journal | null>(null);
  const [capsuleTitle, setCapsuleTitle] = useState<string>('');
  const [showCapsule, setShowCapsule] = useState(false);
  const seedingRef = useRef(false);
  const prevCountRef = useRef(0);

  // Time capsule: trigger after a new journal is added
  useEffect(() => {
    let cancelled = false;

    // Reset state on each run
    setCapsuleJournal(null);
    setCapsuleTitle('');
    setShowCapsule(false);

    if (!initialized || journals.length <= prevCountRef.current) {
      prevCountRef.current = journals.length;
      return;
    }
    // A new journal was added — check for time capsule match
    const latest = journals[0];
    if (latest) {
      checkTimeCapsule(latest, journals).then((result) => {
        if (cancelled) return;
        if (result) {
          setCapsuleJournal(result.journal);
          setCapsuleTitle(result.title);
          setShowCapsule(true);
          recordShown(result.journal.id);
        }
      });
    }
    prevCountRef.current = journals.length;

    return () => { cancelled = true; };
  }, [journals, initialized]);

  const seedData = useCallback(async () => {
    if (seedingRef.current) return;
    seedingRef.current = true;
    try {
      const loaded = await getMeta('seedDataLoaded');
      if (!loaded) {
        for (const seed of SEED_JOURNALS) {
          const journal: Journal = {
            ...seed,
            id: crypto.randomUUID(),
          };
          await dbAdd(journal);
        }
        await setMeta('seedDataLoaded', true);
      }
    } finally {
      seedingRef.current = false;
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      await seedData();
      await fetchJournals();
      setInitialized(true);
    };
    init();
  }, [seedData, fetchJournals]);

  // Process pending journals when online
  useEffect(() => {
    let cancelled = false;

    const processPending = async () => {
      const pending = await getPendingJournals();
      for (const journal of pending) {
        if (cancelled) return;
        try {
          const res = await fetch('/api/journal', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              id: journal.id,
              content: journal.content,
              mood: journal.mood,
            }),
          });

          if (!res.ok) {
            console.warn(`[AI Sync] Failed for journal ${journal.id}: ${res.status}`);
            continue;
          }

          const data: AIResponse = await res.json();
          if (data?.response && data?.goldenQuote) {
            const updated = {
              ...journal,
              aiResponse: data.response,
              goldenQuote: data.goldenQuote,
              moodLabel: data.moodLabel,
              status: 'ai_done' as const,
            };
            await dbUpdate(updated);
          }
        } catch (err) {
          console.warn(`[AI Sync] Error for journal ${journal.id}:`, err);
        }
      }
      // Refresh store after all pending journals are processed
      if (!cancelled) {
        await fetchJournals();
      }
    };

    if (navigator.onLine) {
      processPending();
    }
    window.addEventListener('online', () => processPending());
    return () => {
      cancelled = true;
    };
  }, [fetchJournals]);

  if (!initialized || loading) {
    return (
      <div className="min-h-screen bg-[#FDF8F5] flex items-center justify-center">
        <div className="text-[#8A817C] animate-pulse">加载中...</div>
      </div>
    );
  }

  const latestJournal = journals[0];
  const hasAIResponse = latestJournal?.goldenQuote && !aiWaiting;

  return (
    <main className="min-h-screen bg-[#FDF8F5]">
      <div className="max-w-[680px] mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <p className="text-xs text-[#8A817C] tracking-widest mb-2">
            {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
          </p>
          <h1
            className="text-3xl text-[#3D3D3D] leading-tight"
            style={{ fontFamily: 'var(--font-noto-serif)' }}
          >
            Xiaozhi Journal
          </h1>
        </div>

        {/* Emotion Chart */}
        <EmotionChart journals={journals} />

        {/* Mood Selector */}
        <MoodSelector />

        {/* Journal Input */}
        {selectedMood && <JournalInput />}

        {/* AI Response Area */}
        {aiWaiting && <TypingIndicator />}

        {hasAIResponse && (
          <div className="mt-6">
            <XiaozhiBubble text={latestJournal.aiResponse!} />
            <GoldenQuote quote={latestJournal.goldenQuote!} date={latestJournal.timestamp} journalId={latestJournal.id} />
          </div>
        )}

        {/* Empty State */}
        {journals.length === 0 && <EmptyState />}

        {/* Time Capsule */}
        {showCapsule && capsuleJournal && (
          <CapsulePopup
            journal={capsuleJournal}
            title={capsuleTitle}
            onClose={() => setShowCapsule(false)}
          />
        )}

        {/* History Link */}
        {journals.length > 0 && (
          <div className="text-center mt-8">
            <a href="/history" className="text-sm text-[#D4856A] hover:underline">
              查看过往记录
            </a>
          </div>
        )}
      </div>
    </main>
  );
}
