import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { createClient } from '@/lib/supabase/server'
import { callAI } from '@/lib/ai'
import type { MoodLevel } from '@/types'

export async function POST(request: NextRequest) {
  const supabase = await createClient()
  const { data, error: authError } = await supabase.auth.getUser()
  const user = data?.user ?? null

  if (!user || authError) {
    return NextResponse.json(
      { message: '未授权，请先登录' },
      { status: 401 }
    )
  }

  Sentry.setUser({ id: user.id, email: user.email ?? undefined })

  let journalId: string | undefined

  try {
    const body = await request.json()
    const { id, content, mood } = body
    journalId = id

    if (
      !id ||
      !content ||
      typeof content !== 'string' ||
      content.trim().length === 0 ||
      typeof mood !== 'number' ||
      mood < 1 ||
      mood > 5 ||
      Number.isNaN(mood)
    ) {
      return NextResponse.json(
        { message: '缺少必填字段: id, content, mood' },
        { status: 400 }
      )
    }

    const result = await callAI(content.trim(), mood as MoodLevel)

    return NextResponse.json({
      id,
      response: result.response,
      goldenQuote: result.goldenQuote,
      moodLabel: result.moodLabel,
      fromFallback: result.fromFallback,
    })
  } catch (error) {
    console.error('[API Route] Error:', error)
    Sentry.captureException(error)
    return NextResponse.json({
      id: journalId ?? '',
      response: '小知暂时不在，但你的感受已经保存好了。稍后再来看看想对你说什么吧~',
      goldenQuote: '每一段难熬的时光，都是生活在给你放假。',
      moodLabel: '本地',
      fromFallback: true,
    })
  }
}
