'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { Journal } from '@/types';

interface CapsulePopupProps {
  journal: Journal;
  onClose: () => void;
}

export function CapsulePopup({ journal, onClose }: CapsulePopupProps) {
  const router = useRouter();

  const handleView = useCallback(() => {
    onClose();
    router.push(`/history/${journal.id}`);
  }, [onClose, router, journal.id]);

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [onClose]);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center"
        style={{ backgroundColor: 'rgba(61,61,61,0.4)', backdropFilter: 'blur(4px)' }}
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          exit={{ scale: 0.9, opacity: 0 }}
          transition={{ duration: 0.3, ease: 'easeOut' }}
          className="bg-white rounded-3xl max-w-md w-full mx-4 p-6 shadow-lg"
          onClick={(e) => e.stopPropagation()}
        >
          <p className="text-[#8A817C] text-xs mb-2" style={{ letterSpacing: '2px' }}>
            时间胶囊
          </p>
          <h3 className="text-xl mb-4 text-[#3D3D3D]" style={{ fontFamily: 'var(--font-noto-serif)' }}>
            一年前的今天，你也这样想过
          </h3>
          <div className="bg-[#F5EDE4] rounded-2xl p-4 mb-4">
            <p className="text-2xl mb-2">{journal.moodEmoji}</p>
            <p className="text-[#3D3D3D] mb-2">{journal.content}</p>
            {journal.goldenQuote && (
              <p className="text-[#D4856A] italic text-sm" style={{ fontFamily: 'var(--font-noto-serif)' }}>
                "{journal.goldenQuote}"
              </p>
            )}
            <p className="text-xs text-[#8A817C] mt-2">
              {new Date(journal.timestamp).toLocaleDateString('zh-CN')}
            </p>
          </div>
          <div className="flex gap-3 justify-end">
            <button
              onClick={onClose}
              className="px-4 py-2 text-[#D4856A] hover:bg-[#F5EDE4] rounded-lg transition-colors focus-visible:outline-2 focus-visible:outline-[#D4856A] focus-visible:outline-offset-2"
            >
              稍后再说
            </button>
            <button
              onClick={handleView}
              className="px-4 py-2 border border-[#D4856A] text-[#D4856A] rounded-lg hover:bg-[#F5EDE4] transition-colors focus-visible:outline-2 focus-visible:outline-[#D4856A] focus-visible:outline-offset-2"
            >
              去看看
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
