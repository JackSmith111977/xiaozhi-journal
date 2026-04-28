import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { withAuth, createJsonResponseWithCookies } from '@/lib/middleware/withAuth'
import { encryptKey } from '@/lib/encryption'
import { callAI } from '@/lib/ai'

/**
 * GET /api/settings/byok
 * 查询当前用户的 BYOK Key 状态（不返回 Key 内容）
 */
export async function GET(request: NextRequest) {
  const { user, supabase, response: authResponse } = await withAuth(request)
  if (!user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  Sentry.setUser({ id: user.id, email: user.email ?? undefined })

  try {
    const { data: keyData, error } = await supabase
      .from('user_api_keys')
      .select('id, provider, is_active, created_at')
      .eq('user_id', user.id)
      .eq('is_active', true)
      .single()

    if (error || !keyData) {
      return createJsonResponseWithCookies(
        {
          hasKey: false,
          provider: null,
        },
        { status: 200 },
        authResponse
      )
    }

    return createJsonResponseWithCookies(
      {
        hasKey: true,
        provider: keyData.provider,
        createdAt: keyData.created_at,
      },
      { status: 200 },
      authResponse
    )
  } catch (error) {
    console.error('[BYOK API] Error fetching key status:', error)
    Sentry.captureException(error)
    return NextResponse.json(
      { error: '查询失败，请稍后重试' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/settings/byok
 * 验证并保存用户 BYOK Key（加密存储）
 */
export async function POST(request: NextRequest) {
  const { user, supabase, response: authResponse } = await withAuth(request)
  if (!user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  Sentry.setUser({ id: user.id, email: user.email ?? undefined })

  try {
    let body
    try {
      body = await request.json()
    } catch (parseError) {
      return NextResponse.json(
        { error: '请求体格式无效', valid: false },
        { status: 400 }
      )
    }
    const { apiKey } = body

    if (!apiKey || typeof apiKey !== 'string' || apiKey.trim().length === 0) {
      return NextResponse.json(
        { error: '缺少 API Key', valid: false },
        { status: 400 }
      )
    }

    // apiKey 长度限制
    const trimmedKey = apiKey.trim()
    if (trimmedKey.length > 256) {
      return NextResponse.json(
        { error: 'API Key 长度不能超过 256 字符', valid: false },
        { status: 400 }
      )
    }

    // 验证 Key 有效性（调用 AI 测试）
    const testResult = await callAI('test', 3, trimmedKey)

    if (testResult.invalidKey) {
      return NextResponse.json({
        valid: false,
        error: 'API Key 无效，请检查',
      }, { status: 400 })
    }

    // 加密存储
    const { encryptedKey, iv } = encryptKey(trimmedKey)

    // Upsert：同一用户同一 provider 只有一条活跃 Key
    const { error: upsertError } = await supabase
      .from('user_api_keys')
      .upsert(
        {
          user_id: user.id,
          encrypted_key: encryptedKey,
          iv,
          provider: 'dashscope',
          is_active: true,
          updated_at: new Date().toISOString(),
        },
        { onConflict: 'user_id,provider' }
      )

    if (upsertError) {
      console.error('[BYOK API] Upsert error:', upsertError)
      Sentry.captureException(upsertError)
      return createJsonResponseWithCookies({
        valid: true,
        saved: false,
        error: 'Key 有效但保存失败，请稍后重试',
      }, { status: 500 }, authResponse)
    }

    return createJsonResponseWithCookies(
      {
        valid: true,
        saved: true,
        message: 'Key 有效，已保存',
      },
      { status: 200 },
      authResponse
    )
  } catch (error) {
    console.error('[BYOK API] Error saving key:', error)
    Sentry.captureException(error)
    return createJsonResponseWithCookies({
      valid: false,
      error: '验证失败，请稍后重试',
    }, { status: 500 }, authResponse)
  }
}

/**
 * DELETE /api/settings/byok
 * 标记用户的 BYOK Key 为 inactive
 */
export async function DELETE(request: NextRequest) {
  const { user, supabase, response: authResponse } = await withAuth(request)
  if (!user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  Sentry.setUser({ id: user.id, email: user.email ?? undefined })

  try {
    const { data, error: updateError } = await supabase
      .from('user_api_keys')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('user_id', user.id)
      .eq('is_active', true)
      .select('id')

    if (updateError) {
      console.error('[BYOK API] Delete error:', updateError)
      Sentry.captureException(updateError)
      return createJsonResponseWithCookies({
        deleted: false,
        error: '删除失败，请稍后重试',
      }, { status: 500 }, authResponse)
    }

    // 检查是否有实际更新
    if (!data || data.length === 0) {
      return createJsonResponseWithCookies({
        deleted: false,
        error: '没有找到需要删除的 Key',
      }, { status: 404 }, authResponse)
    }

    return createJsonResponseWithCookies(
      {
        deleted: true,
        message: '已切换回平台 AI',
      },
      { status: 200 },
      authResponse
    )
  } catch (error) {
    console.error('[BYOK API] Error deleting key:', error)
    Sentry.captureException(error)
    return createJsonResponseWithCookies({
      deleted: false,
      error: '删除失败，请稍后重试',
    }, { status: 500 }, authResponse)
  }
}