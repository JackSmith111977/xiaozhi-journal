'use client';

import { useMemo, useRef } from 'react';
import { motion } from 'framer-motion';
import type { Journal } from '@/types';
import { MOOD_MAP } from '@/types';

interface EmotionChartProps {
  journals: Journal[];
}

const COLORS = ['#A8C5A0', '#B8B87A', '#C8AB94', '#D89E88', '#D4856A'];

export function EmotionChart({ journals }: EmotionChartProps) {
  const last7Days = useMemo(() => {
    const now = new Date();
    const days: { date: string; journals: Journal[] }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      const dayJournals = journals.filter(
        (j) => j.timestamp.split('T')[0] === dateStr
      );
      days.push({ date: dateStr, journals: dayJournals });
    }
    return days;
  }, [journals]);

  const hasData = last7Days.some((d) => d.journals.length > 0);

  if (!hasData) {
    return (
      <div className="mb-6 py-6">
        <svg viewBox="0 0 640 80" className="w-full max-w-[640px] mx-auto" style={{ height: '80px' }}>
          <line x1="0" y1="40" x2="640" y2="40" stroke="#E8E0D8" strokeWidth="1" strokeDasharray="4 4" />
        </svg>
        <p className="text-center text-[#8A817C] text-sm mt-2">
          你的第一条日记从这里开始 ✨
        </p>
      </div>
    );
  }

  const points = last7Days
    .map((day, i) => {
      if (day.journals.length === 0) return null;
      const avgMood = day.journals.reduce((sum, j) => sum + j.mood, 0) / day.journals.length;
      const x = (i / 6) * 600 + 20;
      const y = 60 - avgMood * 10;
      return { x, y, mood: Math.round(avgMood), date: day.date, journals: day.journals };
    })
    .filter(Boolean) as { x: number; y: number; mood: number; date: string; journals: Journal[] }[];

  if (points.length < 2) {
    return (
      <div className="mb-6 py-4">
        <p className="text-center text-[#8A817C] text-sm">
          再多写几天，波形图就会长出来 ✨
        </p>
      </div>
    );
  }

  const polylinePoints = points.map((p) => `${p.x},${p.y}`).join(' ');

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.8 }}
      className="mb-6"
    >
      <svg viewBox="0 0 640 120" className="w-full max-w-[640px] mx-auto" style={{ height: '120px' }}>
        <defs>
          <linearGradient id="waveGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#A8C5A0" />
            <stop offset="100%" stopColor="#D4856A" />
          </linearGradient>
        </defs>
        <polyline
          points={polylinePoints}
          fill="none"
          stroke="url(#waveGradient)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        {points.map((point, i) => (
          <g key={i}>
            <motion.circle
              cx={point.x}
              cy={point.y}
              r="4"
              fill={COLORS[point.mood - 1] || '#8A817C'}
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: 'spring', delay: i * 0.1 }}
            />
            <text x={point.x} y={point.y - 10} textAnchor="middle" fontSize="12">
              {MOOD_MAP[point.mood as 1 | 2 | 3 | 4 | 5]?.emoji}
            </text>
          </g>
        ))}
      </svg>
    </motion.div>
  );
}
