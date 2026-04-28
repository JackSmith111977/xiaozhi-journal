import { NextRequest, NextResponse } from 'next/server'
import { withAuth, createJsonResponseWithCookies } from '@/lib/middleware/withAuth'

export async function POST(request: NextRequest) {
  const { user, supabase, response: authResponse } = await withAuth(request)
  if (!user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  try {
    const body = await request.json()
    const { loginMethod = 'email', deviceInfo } = body

    if (!['email', 'wechat'].includes(loginMethod)) {
      return NextResponse.json({ error: 'Invalid login method' }, { status: 400 })
    }

    // 获取 IP 地址
    const ipAddress = request.headers.get('x-forwarded-for')?.split(',')[0]
      || request.headers.get('x-real-ip')
      || 'unknown'

    // 写入 login_logs（用户通过 RLS 策略插入自己的日志）
    const { error: insertError } = await supabase.from('login_logs').insert({
      user_id: user.id,
      ip_address: ipAddress,
      device_info: deviceInfo || navigatorUserAgent(request),
      login_method: loginMethod,
    })

    if (insertError) {
      console.error('[login-log] Insert failed:', insertError.message)
      // 不阻塞登录流程
      return createJsonResponseWithCookies(
        { success: false, error: '日志记录失败' },
        { status: 200 },
        authResponse
      )
    }

    // 更新 profiles 登录统计（原子递增 login_count）
    const { error: profileError } = await supabase.rpc('increment_login_count', {
      user_uuid: user.id,
    })
    if (profileError) {
      console.warn('[login-log] Profile update failed:', profileError.message)
      // 静默忽略，不阻塞
    }

    return createJsonResponseWithCookies(
      { success: true },
      { status: 200 },
      authResponse
    )
  } catch (error) {
    console.error('[login-log] Error:', error instanceof Error ? error.message : 'unknown')
    // 静默失败，不阻塞
    return NextResponse.json({ success: false }, { status: 200 })
  }
}

function navigatorUserAgent(request: NextRequest): string {
  const ua = request.headers.get('user-agent')
  return ua || 'unknown'
}
