'use client';

import { motion } from 'motion/react';
import Link from 'next/link';
import type { Journal } from '@/types';

interface JournalListItemProps {
  journal: Journal;
  index?: number;
}

export function JournalListItem({ journal, index = 0 }: JournalListItemProps) {
  const summary =
    journal.content.length > 50
      ? journal.content.slice(0, 50) + '...'
      : journal.content;

  const dateStr = new Date(journal.timestamp).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, delay: index * 0.05, ease: 'easeOut' }}
    >
      <Link
        href={`/history/${journal.id}`}
        className="block bg-white rounded-2xl p-5 shadow-sm hover:shadow-md transition-shadow"
      >
        <div className="flex items-start gap-3">
          <span className="text-2xl flex-shrink-0" aria-hidden="true">
            {journal.moodEmoji}
          </span>
          <div className="flex-1 min-w-0">
            <p className="text-xs text-muted-foreground mb-1">{dateStr}</p>
            <p className="text-foreground truncate" title={journal.content}>
              {summary}
            </p>
            {journal.goldenQuote && (
              <p className="text-accent italic text-sm mt-1 truncate font-serif italic">
                &ldquo;{journal.goldenQuote}&rdquo;
              </p>
            )}
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
