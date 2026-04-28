'use client';

import { useState, useEffect, useRef } from 'react';
import { motion, useReducedMotion } from 'motion/react';

interface XiaozhiBubbleProps {
  text: string;
  onComplete?: () => void;
}

export function XiaozhiBubble({ text, onComplete }: XiaozhiBubbleProps) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);
  const indexRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const shouldReduceMotion = useReducedMotion();

  useEffect(() => {
  // eslint-disable-next-line react-hooks/set-state-in-effect
    setDisplayed('');
    setDone(false);

    // Reduced motion: show immediately and call onComplete
    if (shouldReduceMotion) {
      setDisplayed(text);
      setDone(true);
      onComplete?.();
      return;
    }

    const type = () => {
      if (indexRef.current >= text.length) {
        setDone(true);
        onComplete?.();
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
  }, [text, shouldReduceMotion, onComplete]);

  return (
    <motion.div
      initial={shouldReduceMotion ? undefined : { opacity: 0, y: 10 }}
      animate={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
      transition={shouldReduceMotion ? undefined : { type: 'spring', stiffness: 300 }}
      className="flex gap-3 mb-4"
    >
      <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center text-white text-sm flex-shrink-0">
        知
      </div>
      <div className="flex-1 bg-white rounded-2xl rounded-tl-md py-3 px-4 shadow-sm">
        <p className="text-foreground leading-relaxed font-sans">
          {displayed}
          {!done && <span className="inline-block w-[2px] h-[1em] bg-accent ml-0.5 animate-pulse align-text-bottom" />}
        </p>
      </div>
    </motion.div>
  );
}
