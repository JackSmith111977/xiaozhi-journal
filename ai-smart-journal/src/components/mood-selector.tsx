'use client';

import { motion } from 'framer-motion';
import { MOOD_MAP, type MoodLevel } from '@/types';
import { useJournalStore } from '@/store/journal';

const moods = [1, 2, 3, 4, 5] as MoodLevel[];

export function MoodSelector() {
  const { selectedMood, setSelectedMood } = useJournalStore();

  return (
    <div className="mb-4">
      <h2 className="text-center text-lg text-[#8A817C] mb-3" style={{ fontFamily: 'var(--font-noto-sans)' }}>
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
              className={`w-14 h-14 rounded-full flex items-center justify-center text-2xl transition-all duration-200
                ${isSelected ? 'bg-[#D4856A] shadow-md' : 'bg-white border border-[#E8E0D8]'}`}
              style={{
                opacity: selectedMood && !isSelected ? 0.5 : 1,
                outline: 'none',
                outlineOffset: '2px',
              }}
              onFocus={(e) => {
                e.currentTarget.style.outline = '2px solid #D4856A';
              }}
              onBlur={(e) => {
                e.currentTarget.style.outline = 'none';
              }}
              onClick={() => setSelectedMood(isSelected ? null : mood)}
            >
              {info.emoji}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
