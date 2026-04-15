'use client';

import { motion } from 'framer-motion';

export function EmptyState() {
  return (
    <motion.div
      className="flex flex-col items-center py-8 text-center"
      animate={{ y: [0, -6, 0] }}
      transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
    >
      <svg width="80" height="80" viewBox="0 0 80 80" fill="none" className="mb-4">
        <circle cx="40" cy="40" r="36" stroke="#E8E0D8" strokeWidth="2" />
        <text x="40" y="48" textAnchor="middle" fontSize="24">✨</text>
      </svg>
      <p className="text-[#8A817C] text-sm" style={{ fontFamily: 'var(--font-noto-sans)' }}>
        你的第一条日记从这里开始 ✨
      </p>
    </motion.div>
  );
}
