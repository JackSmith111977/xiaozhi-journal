'use client';

import { useEffect, useState, useRef } from 'react';
import { motion } from 'framer-motion';

interface TypewriterProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
}

export function Typewriter({ text, speed = 50, onComplete }: TypewriterProps) {
  const [displayed, setDisplayed] = useState('');
  const reducedMotion = useRef(
    typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches
  ).current;

  useEffect(() => {
    if (reducedMotion) {
      setDisplayed(text);
      onComplete?.();
      return;
    }

    let i = 0;
    const timer = setInterval(() => {
      if (i < text.length) {
        setDisplayed(text.slice(0, i + 1));
        i++;
      } else {
        clearInterval(timer);
        onComplete?.();
      }
    }, speed);
    return () => clearInterval(timer);
  }, [text, speed, reducedMotion]);

  return <span>{displayed}</span>;
}
