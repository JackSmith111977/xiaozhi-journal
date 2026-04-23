'use client';

import { motion } from 'motion/react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { MOOD_MAP } from '@/types';

interface EmotionTooltipProps {
  svgX: number;
  svgY: number;
  viewBoxWidth: number;
  viewBoxHeight: number;
  date: string;
  mood: number;
  content: string;
  svgRef: React.RefObject<SVGSVGElement | null>;
}

// Fixed dimensions matching the tooltip's CSS
const TOOLTIP_MAX_WIDTH = 160;
const TOOLTIP_PADDING_X = 24; // px-3 = 12px * 2
const TOOLTIP_HEIGHT = 42; // approximate: two lines + padding

export function EmotionTooltip({
  svgX,
  svgY,
  viewBoxWidth,
  viewBoxHeight,
  date,
  mood,
  content,
  svgRef,
}: EmotionTooltipProps) {
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const computePos = useCallback(() => {
    const svg = svgRef.current;
    const el = tooltipRef.current;
    if (!svg) return;

    const rect = svg.getBoundingClientRect();
    const scaleX = rect.width / viewBoxWidth;
    const scaleY = rect.height / viewBoxHeight;

    // Use measured dimensions if available, otherwise use fallback
    const tw = el?.offsetWidth || TOOLTIP_MAX_WIDTH + TOOLTIP_PADDING_X;
    const th = el?.offsetHeight || TOOLTIP_HEIGHT;
    const gap = 8;

    // Ideal position: centered above the data point
    let left = rect.left + svgX * scaleX - tw / 2;
    let top = rect.top + svgY * scaleY - th - gap;

    // Clamp to viewport to prevent overflow
    const margin = 8;
    left = Math.max(margin, Math.min(window.innerWidth - tw - margin, left));
    top = Math.max(margin, Math.min(window.innerHeight - th - margin, top));

    setPos({ left, top });
  }, [svgX, svgY, viewBoxWidth, viewBoxHeight, svgRef]);

  // Compute position after paint so dimensions are accurate
  useEffect(() => {
    computePos();
  }, [computePos]);

  // Recompute on window resize for responsive behavior
  useEffect(() => {
    window.addEventListener('resize', computePos);
    return () => window.removeEventListener('resize', computePos);
  }, [computePos]);

  return (
    <motion.div
      ref={tooltipRef}
      initial={{ opacity: 0, y: 5 }}
      animate={{ opacity: pos ? 1 : 0, y: pos ? 0 : 5 }}
      exit={{ opacity: 0, y: -5 }}
      transition={{ duration: 0.15 }}
      className="pointer-events-none fixed"
      style={{ left: pos?.left ?? 0, top: pos?.top ?? 0, zIndex: 9999 }}
    >
      <div className="bg-secondary border-border rounded-xl px-3 py-2 shadow-lg max-w-[160px]">
        <p className="text-xs text-muted-foreground whitespace-nowrap">
          {new Date(date).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })}{' '}
          {MOOD_MAP[mood as 1 | 2 | 3 | 4 | 5]?.label}
        </p>
        <p className="text-[11px] text-foreground truncate mt-0.5">
          {content.length > 20 ? content.slice(0, 20) + '...' : content}
        </p>
      </div>
    </motion.div>
  );
}
