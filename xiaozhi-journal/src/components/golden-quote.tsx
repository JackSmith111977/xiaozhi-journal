'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { updateJournal as dbUpdate, getJournalById } from '@/lib/db';

interface GoldenQuoteProps {
  quote: string;
  date?: string;
  journalId?: string;
}

async function generateQuoteImage(quote: string, date?: string): Promise<Blob | null> {
  const canvas = document.createElement('canvas');
  const dpr = 2;
  const width = 640;
  const height = 360;
  canvas.width = width * dpr;
  canvas.height = height * dpr;

  const ctx = canvas.getContext('2d');
  if (!ctx) return null;
  ctx.scale(dpr, dpr);

  // Background
  ctx.fillStyle = '#F5EDE4';
  ctx.fillRect(0, 0, width, height);

  // Left accent line
  ctx.fillStyle = '#D4856A';
  ctx.fillRect(20, 30, 4, height - 60);

  // Quote text
  ctx.fillStyle = '#3D3D3D';
  ctx.font = 'italic 24px "Noto Serif SC", serif';
  ctx.textBaseline = 'top';

  const quoteText = `"${quote}"`;
  const maxWidth = width - 60;
  const lineHeight = 36;
  const words = quoteText.split('');
  let line = '';
  let y = 50;

  for (let i = 0; i < words.length; i++) {
    const testLine = line + words[i];
    const metrics = ctx.measureText(testLine);
    if (metrics.width > maxWidth && i > 0) {
      ctx.fillText(line, 44, y);
      line = words[i];
      y += lineHeight;
    } else {
      line = testLine;
    }
  }
  ctx.fillText(line, 44, y);

  // Date
  if (date) {
    ctx.fillStyle = '#8A817C';
    ctx.font = '12px "Noto Sans SC", sans-serif';
    ctx.textAlign = 'right';
    const formattedDate = new Date(date).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
    ctx.fillText(`— Xiaozhi Journal · ${formattedDate}`, width - 30, height - 40);
    ctx.textAlign = 'left';
  }

  return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
}

export function GoldenQuote({ quote, date, journalId }: GoldenQuoteProps) {
  const [revealed, setRevealed] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [copied, setCopied] = useState(false);
  const quoteRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  const handleReveal = () => {
    if (reducedMotion) {
      setRevealed(true);
      return;
    }
    setTimeout(() => setRevealed(true), 600);
  };

  const handleShare = async () => {
    try {
      const blob = await generateQuoteImage(quote, date);
      if (!blob) return;

      if (navigator.clipboard && navigator.clipboard.write) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `xiaozhi-quote-${Date.now()}.png`;
        a.click();
        URL.revokeObjectURL(url);
      }

      // Increment shareCount
      if (journalId) {
        const journal = await getJournalById(journalId);
        if (journal) {
          await dbUpdate({ ...journal, shareCount: (journal.shareCount || 0) + 1 });
        }
      }
    } catch {
      // Share best-effort
    }
  };

  return (
    <motion.div
      ref={quoteRef}
      initial={!reducedMotion ? { rotateY: 90, opacity: 0 } : { opacity: 1 }}
      animate={!reducedMotion ? { rotateY: 0, opacity: 1 } : { opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      onAnimationComplete={handleReveal}
      className="my-6 bg-[#F5EDE4] rounded-3xl py-6 px-6 shadow-md relative"
      style={{ borderLeft: '3px solid #D4856A' }}
    >
      {/* Share button */}
      <button
        onClick={handleShare}
        className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#E8E0D8] transition-colors text-[#8A817C] focus-visible:outline-2 focus-visible:outline-[#D4856A] focus-visible:outline-offset-2"
        aria-label="分享金句"
        title="分享金句"
      >
        {copied ? (
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
            <polyline points="16 6 12 2 8 6" />
            <line x1="12" y1="2" x2="12" y2="15" />
          </svg>
        )}
      </button>

      <blockquote
        className="text-xl italic leading-relaxed text-[#3D3D3D] pr-8"
        style={{ fontFamily: 'var(--font-noto-serif)', fontStyle: 'italic' }}
      >
        "{quote}"
      </blockquote>
      {date && (
        <p className="text-xs text-[#8A817C] mt-3 text-right">
          {new Date(date).toLocaleDateString('zh-CN')}
        </p>
      )}
    </motion.div>
  );
}
