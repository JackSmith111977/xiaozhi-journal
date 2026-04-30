import { NextRequest } from 'next/server'
import { withAuth, createJsonResponseWithCookies } from '@/lib/middleware/withAuth'

export async function GET(request: NextRequest) {
  const { user, supabase, response } = await withAuth(request)

  if (!user) {
    return createJsonResponseWithCookies(
      { error: '请先登录' },
      { status: 401 },
      response
    )
  }

  const { searchParams } = new URL(request.url)
  const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10))
  const limit = Math.min(100, parseInt(searchParams.get('limit') || '20', 10))
  const offset = (page - 1) * limit

  const { data: rows, error } = await supabase
    .from('journals')
    .select(
      'id, content, mood, mood_emoji, ai_response, golden_quote, mood_label, created_at, status'
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1)

  if (error) {
    return createJsonResponseWithCookies(
      { error: '查询失败' },
      { status: 500 },
      response
    )
  }

  const { count: total, error: countError } = await supabase
    .from('journals')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id)

  if (countError) {
    return createJsonResponseWithCookies(
      { error: '查询失败' },
      { status: 500 },
      response
    )
  }

  const data = (rows || []).map((r: Record<string, unknown>) => ({
    id: r.id,
    content: r.content as string,
    mood: r.mood as number,
    moodEmoji: r.mood_emoji as string,
    aiResponse: (r.ai_response as string) || null,
    goldenQuote: (r.golden_quote as string) || null,
    moodLabel: (r.mood_label as string) || null,
    timestamp: r.created_at as string,
    status: r.status as string,
    shareCount: 0,
  }))

  return createJsonResponseWithCookies(
    {
      data,
      meta: {
        page,
        total: total || 0,
        hasMore: offset + data.length < (total || 0),
      },
    },
    { status: 200 },
    response
  )
}
