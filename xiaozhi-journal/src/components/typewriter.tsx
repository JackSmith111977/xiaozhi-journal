'use client';

import { useEffect, useState } from 'react';
import { useReducedMotion } from 'motion/react';

interface TypewriterProps {
  text: string;
  speed?: number;
  onComplete?: () => void;
}

export function Typewriter({ text, speed = 50, onComplete }: TypewriterProps) {
  const [displayed, setDisplayed] = useState('');
  const reducedMotion = useReducedMotion();

  /* eslint-disable react-hooks/set-state-in-effect */
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
  }, [text, speed, reducedMotion, onComplete]);
  /* eslint-enable react-hooks/set-state-in-effect */

  return <span>{displayed}</span>;
}
