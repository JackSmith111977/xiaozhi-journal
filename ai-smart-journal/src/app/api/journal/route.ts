import { NextResponse } from 'next/server';
import { callAI } from '@/lib/ai';
import type { MoodLevel } from '@/types';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { content, mood } = body;

    if (!content || typeof content !== 'string' || content.trim().length === 0) {
      return NextResponse.json({ error: 'content is required' }, { status: 400 });
    }
    if (!mood || typeof mood !== 'number' || mood < 1 || mood > 5) {
      return NextResponse.json({ error: 'mood must be a number 1-5' }, { status: 400 });
    }

    const result = await callAI(content.trim(), mood as MoodLevel);

    return NextResponse.json(result);
  } catch (error) {
    console.error('[API Route] Error:', error);
    return NextResponse.json({
      response: '小知暂时不在，但你的感受已经保存好了。稍后再来看看想对你说什么吧~',
      goldenQuote: '每一段难熬的时光，都是生活在给你放假。',
      moodLabel: '本地',
      fromFallback: true,
    });
  }
}
