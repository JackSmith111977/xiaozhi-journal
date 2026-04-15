import type { Journal } from '@/types';

export const SEED_JOURNALS: Omit<Journal, 'id'>[] = [
  {
    content: '明天要交的方案还没写完，改了 3 版都不满意',
    mood: 2,
    moodEmoji: '😔',
    aiResponse: '改了 3 遍还在改，说明你没放弃自己。方案可能不完美，但你在坚持。',
    goldenQuote: '第 3 版不是失败，是第 3 次不肯妥协的自己。',
    moodLabel: '焦虑',
    timestamp: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'ai_done',
    shareCount: 0,
  },
  {
    content: '今天被夸了！虽然只是一个小功能，但开心了一整天',
    mood: 4,
    moodEmoji: '😊',
    aiResponse: '开心的时候就该开心，不用谦虚。一个小小的肯定，就值得高兴。',
    goldenQuote: '原来一个小小的肯定，就能让人开心一整天。',
    moodLabel: '开心',
    timestamp: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    status: 'ai_done',
    shareCount: 0,
  },
  {
    content: '周末的下午，什么都不想做，就这样吧',
    mood: 3,
    moodEmoji: '😐',
    aiResponse: '允许自己什么都不做，本身就是一种勇敢。周末嘛，就该浪费在美好的无聊上。',
    goldenQuote: '允许自己什么都不做，本身就是一种勇敢。',
    moodLabel: '平静',
    timestamp: new Date().toISOString(),
    status: 'ai_done',
    shareCount: 0,
  },
];
