'use client';

import { motion } from 'framer-motion';
import { MOOD_MAP, type MoodLevel } from '@/types';
import { useJournalStore } from '@/store/journal';

const moods = [1, 2, 3, 4, 5] as MoodLevel[];

const MOOD_ICONS: Record<MoodLevel, React.ReactNode> = {
  1: (
    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M7 9L9 11" />
      <path d="M17 9L15 11" />
      <path d="M8 15c1-1.5 3-2 4-2s3 .5 4 2" />
    </svg>
  ),
  2: (
    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="9" cy="10" r="1" fill="currentColor" />
      <circle cx="15" cy="10" r="1" fill="currentColor" />
      <path d="M8 16c1-1 2.5-1.5 4-1.5s3 .5 4 1.5" />
      <path d="M7.5 7.5c.5-.5 1.5-.5 2 0" />
      <path d="M14.5 7.5c.5-.5 1.5-.5 2 0" />
    </svg>
  ),
  3: (
    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <circle cx="9" cy="10" r="1" fill="currentColor" />
      <circle cx="15" cy="10" r="1" fill="currentColor" />
      <line x1="8" y1="15" x2="16" y2="15" />
    </svg>
  ),
  4: (
    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 14s1.5 2 4 2 4-2 4-2" />
      <line x1="9" y1="9" x2="9.01" y2="9" strokeWidth="2" />
      <line x1="15" y1="9" x2="15.01" y2="9" strokeWidth="2" />
    </svg>
  ),
  5: (
    <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10" />
      <line x1="8" y1="12" x2="16" y2="12" />
      <path d="M8 15c1 0 2-.5 4-.5s3 .5 4 .5" />
      <path d="M9 8c0-.5.5-1 1-1s1 .5 1 1" />
      <path d="M13 8c0-.5.5-1 1-1s1 .5 1 1" />
    </svg>
  ),
};

export function MoodSelector() {
  const { selectedMood, setSelectedMood } = useJournalStore();

  return (
    <div className="mb-4">
      <h2 className="text-center text-[26px] text-[#8A817C] mb-3" style={{ fontFamily: 'var(--font-noto-serif)' }}>
        今天心情怎么样？
      </h2>
      <div className="flex justify-center gap-4" role="radiogroup" aria-label="心情选择">
        {moods.map((mood) => {
          const info = MOOD_MAP[mood];
          const isSelected = selectedMood === mood;
          return (
            <motion.button
              key={mood}
              role="radio"
              aria-checked={isSelected}
              aria-label={info.label}
              whileHover={{ scale: 1.15, y: -2 }}
              whileTap={{ scale: 1.3 }}
              animate={isSelected ? { scale: 1.2 } : { scale: 1 }}
              transition={{ type: 'spring', stiffness: 300 }}
              className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl transition-all duration-200 focus-visible:outline-2 focus-visible:outline-[#D4856A] focus-visible:outline-offset-2
                ${isSelected ? 'bg-[#D4856A] text-white shadow-md' : 'bg-white text-[#3D3D3D] border border-[#E8E0D8]'}`}
              style={{
                opacity: selectedMood && !isSelected ? 0.5 : 1,
              }}
              onClick={() => setSelectedMood(isSelected ? null : mood)}
            >
              {MOOD_ICONS[mood]}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
