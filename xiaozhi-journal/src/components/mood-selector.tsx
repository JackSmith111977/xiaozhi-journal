'use client';

import { motion } from 'framer-motion';
import { MOOD_MAP, type MoodLevel } from '@/types';
import { useJournalStore } from '@/store/journal';

const moods = [1, 2, 3, 4, 5] as MoodLevel[];

const MOOD_ICONS: Record<MoodLevel, string> = {
  1: '😡',
  2: '😔',
  3: '😐',
  4: '😊',
  5: '😴',
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
              className={`w-14 h-14 rounded-full flex items-center justify-center text-[32px] leading-none transition-all duration-200 focus-visible:outline-2 focus-visible:outline-[#D4856A] focus-visible:outline-offset-2
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
