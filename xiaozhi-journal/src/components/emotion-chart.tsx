'use client';

import { useMemo, useState, useRef } from 'react';
import { motion, AnimatePresence, useReducedMotion } from 'motion/react';
import type { Journal } from '@/types';
import { MOOD_MAP } from '@/types';
import { EmotionTooltip } from '@/components/emotion-tooltip';

interface EmotionChartProps {
  journals: Journal[];
}

const COLORS = ['#A8C5A0', '#B8B87A', '#C8AB94', '#D89E88', '#D4856A'];

// Chart layout constants (UX spec: 120px height for desktop)
const SVG_WIDTH = 640;
const CHART_TOP = 20;      // top padding for emoji
const CHART_BOTTOM = 100;  // bottom data boundary
const CHART_HEIGHT = CHART_BOTTOM - CHART_TOP; // 80
const SVG_HEIGHT = 120;

export function EmotionChart({ journals }: EmotionChartProps) {
  const [hovered, setHovered] = useState<number | null>(null);
  const svgRef = useRef<SVGSVGElement>(null);
  const shouldReduceMotion = useReducedMotion();

  const last7Days = useMemo(() => {
    const now = new Date();
    const days: { date: string; journals: Journal[] }[] = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = d.toISOString().split('T')[0]!;
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
        <svg viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} className="w-full max-w-[640px] mx-auto" style={{ height: `${SVG_HEIGHT}px` }}>
          <line x1="0" y1={CHART_BOTTOM - CHART_HEIGHT / 2} x2={SVG_WIDTH} y2={CHART_BOTTOM - CHART_HEIGHT / 2} stroke="var(--border)" strokeWidth="1" strokeDasharray="4 4" />
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
      const x = (i / 6) * (SVG_WIDTH - 40) + 20;
      const y = CHART_BOTTOM - ((avgMood - 1) / 4) * CHART_HEIGHT;
      return { x, y, mood: Math.round(avgMood), date: day.date, journals: day.journals };
    })
    .filter(Boolean) as { x: number; y: number; mood: number; date: string; journals: Journal[] }[];

  if (points.length < 2) {
    return (
      <div className="mb-6 py-4">
        <p className="text-center text-muted-foreground text-sm">
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
      <svg ref={svgRef} viewBox={`0 0 ${SVG_WIDTH} ${SVG_HEIGHT}`} className="w-full max-w-[640px] mx-auto" style={{ height: `${SVG_HEIGHT}px` }}>
        <defs>
          <linearGradient id="waveGradient" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#A8C5A0" />
            <stop offset="100%" stopColor="#D4856A" />
          </linearGradient>
        </defs>
        <motion.polyline
          points={polylinePoints}
          fill="none"
          stroke="url(#waveGradient)"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          initial={shouldReduceMotion ? { opacity: 0 } : { pathLength: 0, opacity: 0 }}
          animate={shouldReduceMotion ? { opacity: 1 } : { pathLength: 1, opacity: 1 }}
          transition={shouldReduceMotion ? { duration: 0.3 } : { duration: 0.8, ease: 'easeOut' }}
        />
        {points.map((point, i) => {
          const day = last7Days.find((d) => d.date === point.date);
          // eslint-disable-next-line @typescript-eslint/no-unused-vars
          const _journal = day?.journals[0];
          const isHovered = hovered === i;
          return (
            <g key={i} onMouseEnter={() => setHovered(i)} onMouseLeave={() => setHovered(null)} className="cursor-pointer">
              {/* Invisible hit area for easier hover */}
              <circle cx={point.x} cy={point.y} r="16" fill="transparent" />
              <motion.circle
                cx={point.x}
                cy={point.y}
                r={isHovered ? 6 : 4}
                fill={COLORS[point.mood - 1] || '#8A817C'}
                initial={shouldReduceMotion ? undefined : { scale: 0 }}
                animate={shouldReduceMotion ? undefined : { scale: isHovered ? 1.5 : 1 }}
                transition={shouldReduceMotion ? undefined : { type: 'spring', delay: i * 0.1 }}
              />
              <text x={point.x} y={point.y - 14} textAnchor="middle" fontSize="12">
                {MOOD_MAP[point.mood as 1 | 2 | 3 | 4 | 5]?.emoji}
              </text>
            </g>
          );
        })}
      </svg>
      <AnimatePresence>
        {hovered !== null && points[hovered] && (
          <EmotionTooltip
            key={hovered}
            svgX={points[hovered].x}
            svgY={points[hovered].y}
            viewBoxWidth={640}
            viewBoxHeight={SVG_HEIGHT}
            date={points[hovered].date}
            mood={points[hovered].mood}
            content={points[hovered].journals[0]?.content ?? ''}
            svgRef={svgRef}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
