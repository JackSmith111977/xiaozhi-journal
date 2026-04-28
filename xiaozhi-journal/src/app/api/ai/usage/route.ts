import { NextRequest, NextResponse } from 'next/server'
import { withAuth, createJsonResponseWithCookies } from '@/lib/middleware/withAuth'

export async function GET(request: NextRequest) {
  const { user, response: authResponse } = await withAuth(request)
  if (!user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  return createJsonResponseWithCookies(
    {
      platformCalls: 0,
      dailyLimit: 5,
    },
    { status: 200 },
    authResponse
  )
}
