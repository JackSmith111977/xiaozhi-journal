'use client';

import { motion } from 'framer-motion';

interface XiaozhiBubbleProps {
  text: string;
  typing?: boolean;
}

export function XiaozhiBubble({ text, typing }: XiaozhiBubbleProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: 'spring', stiffness: 300 }}
      className="flex gap-3 mb-4"
    >
      <div className="w-8 h-8 rounded-full bg-[#D4856A] flex items-center justify-center text-white text-sm flex-shrink-0">
        知
      </div>
      <div className="flex-1 bg-white rounded-2xl rounded-tl-md py-3 px-4 shadow-sm">
        <p className="text-[#3D3D3D] leading-relaxed" style={{ fontFamily: 'var(--font-noto-sans)' }}>
          {text}
        </p>
      </div>
    </motion.div>
  );
}
