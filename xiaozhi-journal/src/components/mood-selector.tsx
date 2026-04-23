'use client';

import { motion, useReducedMotion } from 'motion/react';
import { useShallow } from 'zustand/react/shallow';
import { MOOD_MAP, type MoodLevel } from '@/types';
import { useAppStore } from '@/store';

const moods = [1, 2, 3, 4, 5] as MoodLevel[];

/** SVG mood icons — replace emoji characters for consistent cross-platform rendering */
function MoodSvg({ mood, selected }: { mood: MoodLevel; selected: boolean }) {
  const fill = selected ? '#fff' : '#3D3D3D';

  switch (mood) {
    case 1: // 烦躁 — angry furrowed brows
      return (
        <svg width="100%" height="100%" viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <circle cx="24" cy="24" r="20" fill={selected ? '#D4856A' : '#FFE0D0'} stroke="#D4856A" strokeWidth="2" />
          <line x1="10" y1="17" x2="20" y2="20" stroke={fill} strokeWidth="2.5" strokeLinecap="round" />
          <line x1="38" y1="17" x2="28" y2="20" stroke={fill} strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="16" cy="22" r="2" fill={fill} />
          <circle cx="32" cy="22" r="2" fill={fill} />
          <path d="M15 34 Q24 28 33 34" stroke={fill} strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </svg>
      );
    case 2: // 难过 — sad downturned mouth, droopy brows
      return (
        <svg width="100%" height="100%" viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <circle cx="24" cy="24" r="20" fill={selected ? '#D4856A' : '#D0E0FF'} stroke="#8AA4D4" strokeWidth="2" />
          <line x1="10" y1="20" x2="20" y2="17" stroke={fill} strokeWidth="2.5" strokeLinecap="round" />
          <line x1="38" y1="20" x2="28" y2="17" stroke={fill} strokeWidth="2.5" strokeLinecap="round" />
          <circle cx="16" cy="22" r="2" fill={fill} />
          <circle cx="32" cy="22" r="2" fill={fill} />
          <path d="M33 25 Q34 28 33 30 Q32 28 33 25Z" fill={fill} opacity="0.6" />
          <path d="M15 34 Q24 38 33 34" stroke={fill} strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </svg>
      );
    case 3: // 平静 — neutral flat line
      return (
        <svg width="100%" height="100%" viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <circle cx="24" cy="24" r="20" fill={selected ? '#D4856A' : '#E8E0D8'} stroke="#B5ADA9" strokeWidth="2" />
          <circle cx="16" cy="20" r="2" fill={fill} />
          <circle cx="32" cy="20" r="2" fill={fill} />
          <line x1="16" y1="33" x2="32" y2="33" stroke={fill} strokeWidth="2.5" strokeLinecap="round" />
        </svg>
      );
    case 4: // 开心 — big smile
      return (
        <svg width="100%" height="100%" viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <circle cx="24" cy="24" r="20" fill={selected ? '#D4856A' : '#FFF3D0'} stroke="#E8C4A0" strokeWidth="2" />
          <path d="M11 19 Q16 15 21 19" stroke={fill} strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M27 19 Q32 15 37 19" stroke={fill} strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M14 29 Q24 39 34 29" stroke={fill} strokeWidth="2.5" fill="none" strokeLinecap="round" />
        </svg>
      );
    case 5: // 疲惫 — sleepy half-closed eyes, yawn, Zzz bubbles
      return (
        <svg width="100%" height="100%" viewBox="0 0 48 48" fill="none" aria-hidden="true">
          <circle cx="24" cy="24" r="20" fill={selected ? '#D4856A' : '#E0D8F0'} stroke="#A098C0" strokeWidth="2" />
          <path d="M11 21 Q16 24 21 21" stroke={fill} strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <path d="M27 21 Q32 24 37 21" stroke={fill} strokeWidth="2.5" fill="none" strokeLinecap="round" />
          <ellipse cx="24" cy="33" rx="5" ry="4" stroke={fill} strokeWidth="2" fill="none" />
          {/* Zzz as circles (sleep bubbles) instead of text */}
          <circle cx="38" cy="12" r="2.5" fill={fill} opacity="0.5" />
          <circle cx="42" cy="7" r="1.5" fill={fill} opacity="0.35" />
        </svg>
      );
    default:
      return null;
  }
}

export function MoodSelector() {
  const { selectedMood, setSelectedMood } = useAppStore(
    useShallow((s) => ({
      selectedMood: s.selectedMood,
      setSelectedMood: s.setSelectedMood,
    }))
  );
  const shouldReduceMotion = useReducedMotion();

  // Hover/tap: tween — instant response, no bounce
  const hoverAnim = shouldReduceMotion
    ? undefined
    : {
        scale: 1.15,
        y: -2,
        transition: { type: 'tween' as const, duration: 0.12, ease: 'easeOut' as const },
      };
  const tapAnim = shouldReduceMotion
    ? undefined
    : {
        scale: 1.3,
        transition: { type: 'tween' as const, duration: 0.08, ease: 'easeOut' as const },
      };

  // Selected state: spring —仪式感但不拖沓
  const springTransition = {
    type: 'spring' as const,
    stiffness: 400,
    damping: 25,
  };

  return (
    <div className="mb-4">
      <h2 className="text-center text-[26px] text-muted-foreground mb-3 font-serif">
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
              whileHover={hoverAnim}
              whileTap={tapAnim}
              animate={shouldReduceMotion ? undefined : (isSelected ? { scale: 1.2 } : { scale: 1 })}
              transition={springTransition}
              className={`w-14 h-14 rounded-full flex items-center justify-center leading-none transition-all duration-200 focus-visible:outline-2 focus-visible:outline-accent focus-visible:outline-offset-2
                ${isSelected ? 'bg-accent shadow-md' : 'bg-white border border-border'}`}
              style={{
                opacity: selectedMood && !isSelected ? 0.5 : 1,
              }}
              onClick={() => setSelectedMood(isSelected ? null : mood)}
            >
              <MoodSvg mood={mood} selected={isSelected} />
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
