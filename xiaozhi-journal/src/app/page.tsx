/* eslint-disable react-hooks/set-state-in-effect */
'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import { AnimatePresence } from 'motion/react';
import { useShallow } from 'zustand/react/shallow';
import { useAppStore } from '@/store';
import { AuthGuard } from '@/components/auth-guard';
import { MoodSelector } from '@/components/mood-selector';
import { JournalInput } from '@/components/journal-input';
import { EmotionChart } from '@/components/emotion-chart';
import { TypingIndicator } from '@/components/typing-indicator';
import { XiaozhiBubble } from '@/components/xiaozhi-bubble';
import { GoldenQuote } from '@/components/golden-quote';
import { EmptyState } from '@/components/empty-state';
import { CapsulePopup } from '@/components/capsule-popup';
import { getMeta, setMeta, addJournal as dbAdd } from '@/lib/db';
import { motion } from 'motion/react';
import Link from 'next/link';
import { checkTimeCapsule, recordShown } from '@/lib/time-capsule';
import { SEED_JOURNALS } from '@/lib/seed-data';
import type { Journal } from '@/types';

export default function Home() {
  return (
    <AuthGuard>
      <HomeContent />
    </AuthGuard>
  );
}

function HomeContent() {
  const { journals, loading, fetchJournals, aiWaiting, selectedMood, syncProgress } = useAppStore(
    useShallow((s) => ({
      journals: s.journals,
      loading: s.loading,
      fetchJournals: s.fetchJournals,
      aiWaiting: s.aiWaiting,
      selectedMood: s.selectedMood,
      syncProgress: s.syncProgress,
    }))
  );
  const [initialized, setInitialized] = useState(false);
  const [capsuleJournal, setCapsuleJournal] = useState<Journal | null>(null);
  const [capsuleTitle, setCapsuleTitle] = useState<string>('');
  const [showCapsule, setShowCapsule] = useState(false);
  const [showGoldenQuote, setShowGoldenQuote] = useState(false);
  const [displayingJournal, setDisplayingJournal] = useState<Journal | null>(null);
  const seedingRef = useRef(false);
  const prevCountRef = useRef(0);
  const goldenQuoteTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Compute latest journal and AI response status early for hooks
  const latestJournal = journals[0];
  const hasAIResponse = latestJournal?.goldenQuote && !aiWaiting;

  // Lock displaying journal during AI animation to prevent realtime race
  const activeJournal = displayingJournal || latestJournal;

  // Stable onComplete callback for XiaozhiBubble
  const handleTypewriterComplete = useCallback(() => {
    setDisplayingJournal(null); // Unlock after animation complete
    goldenQuoteTimerRef.current = setTimeout(() => setShowGoldenQuote(true), 300);
  }, []);

  // Cleanup golden quote timer on unmount or journal change
  useEffect(() => {
    return () => {
      if (goldenQuoteTimerRef.current) {
        clearTimeout(goldenQuoteTimerRef.current);
        goldenQuoteTimerRef.current = null;
      }
    };
  }, [latestJournal?.id]);

  // Reset showGoldenQuote when AI response not ready or journal changes
  useEffect(() => {
    if (!hasAIResponse) {
      setShowGoldenQuote(false);
      setDisplayingJournal(null); // Clear lock
      if (goldenQuoteTimerRef.current) {
        clearTimeout(goldenQuoteTimerRef.current);
        goldenQuoteTimerRef.current = null;
      }
    } else if (!displayingJournal) {
      // Lock journal when AI response first appears
      setDisplayingJournal(latestJournal);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasAIResponse, latestJournal?.id]);

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

  // Process pending journals is handled by store's initOfflineSync → syncPendingWithAI
// No duplicate processing needed here

if (!initialized || loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-muted-foreground animate-pulse">加载中...</div>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-[680px] mx-auto px-6 py-12">
        {/* Header */}
        <div className="mb-8">
          <p className="text-xs text-muted-foreground tracking-widest mb-2">
            {new Date().toLocaleDateString('zh-CN', { year: 'numeric', month: 'long', day: 'numeric', weekday: 'long' })}
          </p>
          <h1 className="text-3xl text-foreground leading-tight font-serif">
            Xiaozhi Journal
          </h1>
        </div>

        {/* Emotion Chart */}
        <EmotionChart journals={journals} />

        {/* Mood Selector */}
        <MoodSelector />

        {/* Journal Input — slide in when mood selected */}
        <AnimatePresence>
          {selectedMood && <JournalInput key={selectedMood} onExitComplete={() => {}} />}
        </AnimatePresence>

        {/* AI Response Area */}
        {syncProgress && (
          <div className="mt-4 text-center text-sm text-muted-foreground">
            正在处理 {syncProgress.done}/{syncProgress.total} 篇离线日记...
          </div>
        )}
        {aiWaiting && <TypingIndicator />}

        {hasAIResponse && activeJournal && (
          <div className="mt-6">
            <XiaozhiBubble
              text={activeJournal.aiResponse!}
              onComplete={handleTypewriterComplete}
            />
            {showGoldenQuote && (
              <GoldenQuote quote={activeJournal.goldenQuote!} date={activeJournal.timestamp} journalId={activeJournal.id} journal={activeJournal} />
            )}
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
        <motion.div
          className="text-center mt-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
        >
          <Link href="/history" className="text-sm text-accent hover:underline">
            查看过往记录
          </Link>
        </motion.div>
      </div>
    </main>
  );
}
