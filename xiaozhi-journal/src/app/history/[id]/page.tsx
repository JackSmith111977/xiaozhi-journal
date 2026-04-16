'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { getJournalById } from '@/lib/db';
import type { Journal } from '@/types';
import { XiaozhiBubble } from '@/components/xiaozhi-bubble';
import { GoldenQuote } from '@/components/golden-quote';

export default function JournalDetail() {
  const params = useParams();
  const router = useRouter();
  const [journal, setJournal] = useState<Journal | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const id = params.id;
    const journalId = Array.isArray(id) ? id[0] : id;
    if (!journalId) {
      setLoading(false);
      return;
    }
    const load = async () => {
      const j = await getJournalById(journalId);
      setJournal(j || null);
      setLoading(false);
    };
    load();
  }, [params.id]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') router.back();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FDF8F5] flex items-center justify-center">
        <div className="text-[#8A817C] animate-pulse">加载中...</div>
      </div>
    );
  }

  if (!journal) {
    return (
      <div className="min-h-screen bg-[#FDF8F5] flex items-center justify-center">
        <p className="text-[#8A817C]">日记不存在</p>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-[#FDF8F5]">
      <div className="max-w-[680px] mx-auto px-6 py-12">
        <button
          onClick={() => router.back()}
          className="text-[#D4856A] text-sm mb-6 hover:underline focus-visible:outline-2 focus-visible:outline-[#D4856A] focus-visible:outline-offset-2 rounded"
        >
          ← 返回列表
        </button>

        {/* Date and Mood */}
        <div className="mb-6">
          <p className="text-xs text-[#8A817C] tracking-widest mb-2">
            {new Date(journal.timestamp).toLocaleDateString('zh-CN', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
              weekday: 'long',
            })}
          </p>
          <span className="text-4xl">{journal.moodEmoji}</span>
        </div>

        {/* Journal Content */}
        <div className="bg-white rounded-2xl p-6 shadow-sm mb-6">
          <p className="text-[#3D3D3D] leading-relaxed text-base" style={{ fontFamily: 'var(--font-noto-sans)' }}>
            {journal.content}
          </p>
        </div>

        {/* AI Response */}
        {journal.aiResponse && <XiaozhiBubble text={journal.aiResponse} />}

        {/* Golden Quote */}
        {journal.goldenQuote && <GoldenQuote quote={journal.goldenQuote} date={journal.timestamp} journalId={journal.id} journal={journal} />}
      </div>
    </main>
  );
}
