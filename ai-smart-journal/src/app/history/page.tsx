'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { useJournalStore } from '@/store/journal';
import type { Journal } from '@/types';

export default function HistoryPage() {
  const { journals, loading, fetchJournals } = useJournalStore();
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const init = async () => {
      await fetchJournals();
      setInitialized(true);
    };
    init();
  }, [fetchJournals]);

  if (!initialized || loading) {
    return (
      <div className="min-h-screen bg-[#FDF8F5] flex items-center justify-center">
        <div className="text-[#8A817C] animate-pulse">加载中...</div>
      </div>
    );
  }

  return (
    <motion.main
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="min-h-screen bg-[#FDF8F5]"
    >
      <div className="max-w-[680px] mx-auto px-6 py-12">
        <Link href="/" className="text-[#D4856A] text-sm mb-6 inline-block hover:underline">
          ← 返回首页
        </Link>
        <h1 className="text-2xl text-[#3D3D3D] mb-8" style={{ fontFamily: 'var(--font-noto-serif)' }}>
          过往记录
        </h1>

        {journals.length === 0 ? (
          <p className="text-center text-[#8A817C] py-12">还没有日记记录</p>
        ) : (
          <div className="space-y-4">
            {journals.map((journal: Journal) => {
              const summary = journal.content.length > 50
                ? journal.content.slice(0, 50) + '...'
                : journal.content;
              return (
                <Link
                  key={journal.id}
                  href={`/history/${journal.id}`}
                  className="block bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start gap-3">
                    <span className="text-2xl">{journal.moodEmoji}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-[#8A817C] mb-1">
                        {new Date(journal.timestamp).toLocaleDateString('zh-CN', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                        })}
                      </p>
                      <p className="text-[#3D3D3D] truncate" title={journal.content}>
                        {summary}
                      </p>
                      {journal.goldenQuote && (
                        <p className="text-[#D4856A] italic text-sm mt-1 truncate" style={{ fontFamily: 'var(--font-noto-serif)', fontStyle: 'italic' }}>
                          "{journal.goldenQuote}"
                        </p>
                      )}
                    </div>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </motion.main>
  );
}
