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
  status: 'pending' | 'ai_ready' | 'ai_done';
  shareCount: number;
}

export interface AIResponse {
  response: string;
  goldenQuote: string;
  moodLabel: string;
  fromFallback: boolean;
}

export interface AppMeta {
  key: string;
  value: unknown;
}

export const MOOD_MAP: Record<MoodLevel, { emoji: string; label: string }> = {
  1: { emoji: '😡', label: '烦躁' },
  2: { emoji: '😔', label: '难过' },
  3: { emoji: '😐', label: '平静' },
  4: { emoji: '😊', label: '开心' },
  5: { emoji: '😴', label: '疲惫' },
};
