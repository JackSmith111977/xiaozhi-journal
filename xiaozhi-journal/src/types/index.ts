export type MoodLevel = 1 | 2 | 3 | 4 | 5;

export interface Journal {
  id: string;
  content: string;
  mood: MoodLevel;
  moodEmoji: string;
  aiResponse: string | null;
  goldenQuote: string | null;
  moodLabel: string | null;
  timestamp: string;
  status: 'pending' | 'synced' | 'ai_ready' | 'ai_done';
  shareCount: number;
}

export interface AIResponse {
  response: string;
  goldenQuote: string;
  moodLabel: string;
  fromFallback: boolean;
  invalidKey?: boolean;
}

export interface AppMeta {
  key: string;
  value: unknown;
}

export const MOOD_MAP = {
  1: { emoji: '😡', label: '烦躁' },
  2: { emoji: '😔', label: '难过' },
  3: { emoji: '😐', label: '平静' },
  4: { emoji: '😊', label: '开心' },
  5: { emoji: '😴', label: '疲惫' },
} as const satisfies Record<MoodLevel, { emoji: string; label: string }>;
