'use client';

import { useState, useRef } from 'react';
import { motion } from 'framer-motion';

interface GoldenQuoteProps {
  quote: string;
  date?: string;
}

export function GoldenQuote({ quote, date }: GoldenQuoteProps) {
  const [revealed, setRevealed] = useState(false);
  const reducedMotion = useRef(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ).current;

  const handleReveal = () => {
    if (reducedMotion) {
      setRevealed(true);
      return;
    }
    setTimeout(() => setRevealed(true), 600);
  };

  return (
    <motion.div
      initial={!reducedMotion ? { rotateY: 90, opacity: 0 } : { opacity: 1 }}
      animate={!reducedMotion ? { rotateY: 0, opacity: 1 } : { opacity: 1 }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      onAnimationComplete={handleReveal}
      className="my-6 bg-[#F5EDE4] rounded-3xl py-6 px-6 shadow-md"
      style={{ borderLeft: '3px solid #D4856A' }}
    >
      <blockquote
        className="text-xl italic leading-relaxed text-[#3D3D3D]"
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
