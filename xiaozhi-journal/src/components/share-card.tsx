'use client';

import { useRef } from 'react';
import Image from 'next/image';

interface ShareCardProps {
  date: string;
  moodEmoji: string;
  content: string;
  aiResponse: string;
  quote: string;
}

export function ShareCard({ date, moodEmoji, content, aiResponse, quote }: ShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);

  const formattedDate = new Date(date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  return (
    <div
      ref={cardRef}
      data-share-card
      className="bg-[#F5EDE4] rounded-[20px] overflow-hidden shadow-lg"
    >
      {/* Accent gradient bar */}
      <div className="h-1 bg-gradient-to-r from-[#D4856A] via-[#E8C4A0] to-[#A8C5A0]" />

      <div className="p-5">
        {/* Header: Brand + Date + Mood */}
        <div className="flex justify-between items-center mb-5 pb-3 border-b border-[#D4C5B9]">
          <div>
            <div
              className="text-[#D4856A] font-bold text-[15px] tracking-wider"
              style={{ fontFamily: 'var(--font-noto-serif)' }}
            >
              Xiaozhi Journal
            </div>
            <div className="text-[11px] text-[#8A817C] mt-0.5">{formattedDate}</div>
          </div>
          <span className="text-lg">{moodEmoji}</span>
        </div>

        {/* Journal section */}
        <div className="mb-5">
          <div className="text-[10px] uppercase tracking-[0.15em] text-[#C8AB94] font-semibold mb-2">
            我的日记
          </div>
          <p
            className="text-[14px] leading-[1.8] text-[#5A524D]"
            style={{ fontFamily: 'var(--font-noto-sans)' }}
          >
            {content}
          </p>
        </div>

        {/* Divider */}
        <div className="h-px bg-gradient-to-r from-transparent via-[#D4C5B9] to-transparent my-5" />

        {/* Xiaozhi response */}
        <div className="mb-5">
          <div className="text-[10px] uppercase tracking-[0.15em] text-[#C8AB94] font-semibold mb-2">
            小知说
          </div>
          <div className="relative bg-white/60 rounded-2xl p-3.5">
            <div className="text-[11px] text-[#D4856A] font-semibold mb-1">小知</div>
            <p className="text-[13px] leading-[1.7] text-[#5A524D]">{aiResponse}</p>
          </div>
        </div>

        {/* Decorative divider */}
        <div className="flex items-center gap-2 my-5">
          <div className="flex-1 h-px bg-[#D4C5B9]" />
          <span className="text-[#D4856A] text-sm">❝</span>
          <div className="flex-1 h-px bg-[#D4C5B9]" />
        </div>

        {/* Quote section (hero) */}
        <div className="mb-5 p-5 bg-white/50 rounded-2xl border-l-[3px] border-[#D4856A]">
          <p
            className="text-[17px] italic leading-[1.8] text-[#3D3D3D]"
            style={{ fontFamily: 'var(--font-noto-serif)', fontStyle: 'italic' }}
          >
            &ldquo;{quote}&rdquo;
          </p>
          <p className="text-[11px] text-[#8A817C] mt-2 italic">
            — Xiaozhi Journal · {formattedDate}
          </p>
        </div>
      </div>

      {/* Footer: QR + Branding */}
      <div className="flex justify-between items-center px-5 py-4 bg-white/40 border-t border-[#D4C5B9]">
        <div className="w-16 h-16 bg-white rounded-lg shadow-sm flex items-center justify-center overflow-hidden relative">
          <Image
            src={`https://api.qrserver.com/v1/create-qr-code/?size=112x112&data=${encodeURIComponent(typeof window !== 'undefined' ? window.location.origin : '')}&color=3D3D3D&bgcolor=FFFFFF`}
            alt="QR Code"
            width={56}
            height={56}
            className="w-14 h-14"
          />
        </div>
        <div className="text-right">
          <div
            className="text-[#D4856A] font-semibold text-[13px]"
            style={{ fontFamily: 'var(--font-noto-serif)' }}
          >
            Xiaozhi Journal
          </div>
          <div className="text-[10px] text-[#8A817C] mt-0.5">扫码记录你的感受</div>
        </div>
      </div>
    </div>
  );
}
