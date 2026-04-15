'use client';

import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface XiaozhiBubbleProps {
  text: string;
}

export function XiaozhiBubble({ text }: XiaozhiBubbleProps) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  const indexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    indexRef.current = 0;
    setDisplayed('');
    setDone(false);

    const type = () => {
      if (indexRef.current >= text.length) {
        setDone(true);
        return;
      }
      indexRef.current += 1;
      setDisplayed(text.slice(0, indexRef.current));
      timerRef.current = setTimeout(type, 40);
    };

    timerRef.current = setTimeout(type, 300);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [text]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300 }}
      className="flex gap-3 mb-4"
    >
      <div className="w-8 h-8 rounded-full bg-[#D4856A] flex items-center justify-center text-white text-sm flex-shrink-0">
        知
      </div>
      <div className="flex-1 bg-white rounded-2xl rounded-tl-md py-3 px-4 shadow-sm">
        <p className="text-[#3D3D3D] leading-relaxed" style={{ fontFamily: 'var(--font-noto-sans)' }}>
          {displayed}
          {!done && <span className="inline-block w-[2px] h-[1em] bg-[#D4856A] ml-0.5 animate-pulse align-text-bottom" />}
        </p>
      </div>
    </motion.div>
  );
}
