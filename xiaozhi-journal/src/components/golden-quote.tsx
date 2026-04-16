'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import type { Journal } from '@/types';
import { ShareCard } from '@/components/share-card';
import { renderShareCardToCanvas } from '@/lib/share-card-renderer';
import { updateJournal as dbUpdate, getJournalById } from '@/lib/db';

interface GoldenQuoteProps {
  quote: string;
  date?: string;
  journalId?: string;
  journal?: Journal;
}

type ShareAction = 'copy' | 'download' | 'copyText';
type ShareFeedback = { action: ShareAction; message: string } | null;

export function GoldenQuote({ quote, date, journalId, journal }: GoldenQuoteProps) {
  const [reducedMotion, setReducedMotion] = useState(false);
  const [flipped, setFlipped] = useState(false);
  const [feedback, setFeedback] = useState<ShareFeedback>(null);
  const [loading, setLoading] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setReducedMotion(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  }, []);

  const showFeedback = useCallback((action: ShareAction, message: string) => {
    setFeedback({ action, message });
    setTimeout(() => setFeedback(null), 2000);
  }, []);

  const handleShare = () => {
    setFlipped(true);
  };

  const handleBack = () => {
    setFlipped(false);
    setFeedback(null);
  };

  const incrementShareCount = useCallback(async () => {
    if (journalId) {
      const journalEntry = await getJournalById(journalId);
      if (journalEntry) {
        await dbUpdate({ ...journalEntry, shareCount: (journalEntry.shareCount ?? 0) + 1 });
      }
    }
  }, [journalId]);

  const generateImage = useCallback(async (): Promise<Blob | null> => {
    if (!cardRef.current) return null;
    const rect = cardRef.current.getBoundingClientRect();
    const canvas = await renderShareCardToCanvas({
      date: date || new Date().toISOString(),
      moodEmoji: journal?.moodEmoji || '😐',
      content: journal?.content || '',
      aiResponse: journal?.aiResponse || '',
      quote,
      width: Math.round(rect.width),
    });
    if (!canvas) return null;
    return new Promise((resolve) => canvas.toBlob(resolve, 'image/png'));
  }, [date, journal, quote]);

  const handleCopy = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      const blob = await generateImage();
      if (!blob) return;

      if (navigator.clipboard && navigator.clipboard.write) {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
        showFeedback('copy', '已复制到剪贴板');
      } else {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `xiaozhi-quote-${Date.now()}.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
        showFeedback('download', '图片已保存');
      }
      await incrementShareCount();
    } catch (err) {
      console.error('[Share] Copy failed:', err);
    } finally {
      setLoading(false);
    }
  }, [generateImage, loading, showFeedback, incrementShareCount]);

  const handleDownload = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      const blob = await generateImage();
      if (!blob) return;

      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `xiaozhi-quote-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      showFeedback('download', '图片已保存');
      await incrementShareCount();
    } catch (err) {
      console.error('[Share] Download failed:', err);
    } finally {
      setLoading(false);
    }
  }, [generateImage, loading, showFeedback, incrementShareCount]);

  const handleCopyText = useCallback(async () => {
    if (loading) return;
    setLoading(true);
    try {
      await navigator.clipboard.writeText(quote);
      showFeedback('copyText', '文字已复制');
      await incrementShareCount();
    } catch (err) {
      console.error('[Share] Copy text failed:', err);
    } finally {
      setLoading(false);
    }
  }, [quote, loading, showFeedback, incrementShareCount]);

  return (
    <div className="my-6" style={{ perspective: '1200px' }}>
      <motion.div
        ref={cardRef}
        initial={!reducedMotion ? { rotateY: 90, opacity: 0 } : { opacity: 1 }}
        animate={
          !reducedMotion
            ? flipped
              ? { rotateY: 180, opacity: 1 }
              : { rotateY: 0, opacity: 1 }
            : { opacity: 1 }
        }
        transition={{ duration: 0.7, ease: 'easeOut' }}
        className="relative"
        style={{ transformStyle: 'preserve-3d' }}
      >
        {/* FRONT: Original golden quote card */}
        <div
          className="bg-[#F5EDE4] rounded-3xl py-6 px-6 shadow-md relative"
          style={{ borderLeft: '3px solid #D4856A', backfaceVisibility: 'hidden' }}
        >
          <button
            onClick={handleShare}
            className="absolute top-3 right-3 w-8 h-8 flex items-center justify-center rounded-full hover:bg-[#E8E0D8] transition-colors text-[#8A817C] focus-visible:outline-2 focus-visible:outline-[#D4856A] focus-visible:outline-offset-2"
            aria-label="分享金句"
            title="分享金句"
          >
            <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8" />
              <polyline points="16 6 12 2 8 6" />
              <line x1="12" y1="2" x2="12" y2="15" />
            </svg>
          </button>

          <blockquote
            className="text-xl italic leading-relaxed text-[#3D3D3D] pr-8"
            style={{ fontFamily: 'var(--font-noto-serif)', fontStyle: 'italic' }}
          >
            &ldquo;{quote}&rdquo;
          </blockquote>
          {date && (
            <p className="text-xs text-[#8A817C] mt-3 text-right">
              {new Date(date).toLocaleDateString('zh-CN')}
            </p>
          )}
        </div>

        {/* BACK: Share card preview */}
        {flipped && (
          <div
            className="absolute inset-0"
            style={{ backfaceVisibility: 'hidden', transform: 'rotateY(180deg)' }}
          >
            <ShareCard
              date={date || new Date().toISOString()}
              moodEmoji={journal?.moodEmoji || '😐'}
              content={journal?.content || ''}
              aiResponse={journal?.aiResponse || ''}
              quote={quote}
            />

            {/* Action buttons */}
            <div className="flex gap-2 mt-4">
              <button
                onClick={handleCopy}
                disabled={loading}
                className={`flex-1 py-2.5 px-2 border rounded-xl text-[13px] flex flex-col items-center gap-1 transition-all
                  ${feedback?.action === 'copy'
                    ? 'bg-[#D4856A] text-white border-[#D4856A]'
                    : 'bg-white border-[#E8E0D8] text-[#3D3D3D] hover:bg-[#F5EDE4] hover:border-[#D4856A]'
                  } disabled:opacity-50`}
              >
                <span className="text-lg">📋</span>
                {feedback?.action === 'copy' ? '✓' : '复制'}
              </button>
              <button
                onClick={handleDownload}
                disabled={loading}
                className={`flex-1 py-2.5 px-2 border rounded-xl text-[13px] flex flex-col items-center gap-1 transition-all
                  ${feedback?.action === 'download'
                    ? 'bg-[#D4856A] text-white border-[#D4856A]'
                    : 'bg-white border-[#E8E0D8] text-[#3D3D3D] hover:bg-[#F5EDE4] hover:border-[#D4856A]'
                  } disabled:opacity-50`}
              >
                <span className="text-lg">💾</span>
                {feedback?.action === 'download' ? '✓' : '保存'}
              </button>
              <button
                onClick={handleCopyText}
                disabled={loading}
                className={`flex-1 py-2.5 px-2 border rounded-xl text-[13px] flex flex-col items-center gap-1 transition-all
                  ${feedback?.action === 'copyText'
                    ? 'bg-[#D4856A] text-white border-[#D4856A]'
                    : 'bg-white border-[#E8E0D8] text-[#3D3D3D] hover:bg-[#F5EDE4] hover:border-[#D4856A]'
                  } disabled:opacity-50`}
              >
                <span className="text-lg">📝</span>
                {feedback?.action === 'copyText' ? '✓' : '文字'}
              </button>
            </div>

            {/* Back button */}
            <div className="text-center mt-2">
              <button
                onClick={handleBack}
                className="py-2 px-6 text-[13px] text-[#D4856A] hover:underline focus-visible:outline-2 focus-visible:outline-[#D4856A] focus-visible:outline-offset-2 rounded"
              >
                ← 返回日记
              </button>
            </div>

            {/* Feedback toast */}
            {feedback && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-[#3D3D3D] text-white px-5 py-2.5 rounded-full text-[13px] whitespace-nowrap z-10"
              >
                {feedback.message}
              </motion.div>
            )}
          </div>
        )}
      </motion.div>
    </div>
  );
}
