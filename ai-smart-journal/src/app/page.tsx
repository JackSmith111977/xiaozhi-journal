'use client';

import { useEffect, useState, useCallback } from 'react';
import { useJournalStore } from '@/store/journal';
import { MoodSelector } from '@/components/mood-selector';
import { JournalInput } from '@/components/journal-input';
import { EmotionChart } from '@/components/emotion-chart';
import { TypingIndicator } from '@/components/typing-indicator';
import { XiaozhiBubble } from '@/components/xiaozhi-bubble';
import { GoldenQuote } from '@/components/golden-quote';
import { EmptyState } from '@/components/empty-state';
import { CapsulePopup } from '@/components/capsule-popup';
import { getMeta, setMeta, getJournals, getPendingJournals, addJournal as dbAdd } from '@/lib/db';
import { SEED_JOURNALS } from '@/lib/seed-data';
import type { Journal } from '@/types';

export default function Home() {
  const { journals, loading, fetchJournals, aiWaiting, selectedMood } = useJournalStore();
  const [initialized, setInitialized] = useState(false);
  const [capsuleJournal, setCapsuleJournal] = useState<Journal | null>(null);
  const [showCapsule, setShowCapsule] = useState(false);
  const [showResponse, setShowResponse] = useState(false);

  const seedData = useCallback(async () => {
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
    const processPending = async () => {
      const { updateJournal: dbUpdate } = await import('@/lib/db');
      const pending = await getPendingJournals();
      for (const journal of pending) {
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
          const data = await res.json();
          if (data) {
            const updated = {
              ...journal,
              aiResponse: data.response,
              goldenQuote: data.goldenQuote,
              moodLabel: data.moodLabel,
              status: 'ai_done' as const,
            };
            await dbUpdate(updated);
            await fetchJournals();
          }
        } catch {
          // Silently fail, will retry
        }
      }
    };

    if (navigator.onLine) {
      processPending();
    }
    window.addEventListener('online', () => processPending());
  }, []);

  // Show AI response area for latest journal
  useEffect(() => {
    if (journals.length > 0 && journals[0]?.goldenQuote && !aiWaiting) {
      setShowResponse(true);
    }
  }, [journals, aiWaiting]);

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
            AI Smart Journal
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

        {showResponse && hasAIResponse && (
          <div className="mt-6">
            <XiaozhiBubble text={latestJournal.aiResponse!} />
            <GoldenQuote quote={latestJournal.goldenQuote!} date={latestJournal.timestamp} />
          </div>
        )}

        {/* Empty State */}
        {journals.length === 0 && !loading && <EmptyState />}

        {/* Time Capsule */}
        {showCapsule && capsuleJournal && (
          <CapsulePopup
            journal={capsuleJournal}
            onClose={() => setShowCapsule(false)}
            onView={() => setShowCapsule(false)}
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
