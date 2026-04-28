import { NextRequest, NextResponse } from 'next/server'
import * as Sentry from '@sentry/nextjs'
import { withAuth, createJsonResponseWithCookies } from '@/lib/middleware/withAuth'
import { callAI } from '@/lib/ai'
import { decryptKey } from '@/lib/encryption'
import type { MoodLevel } from '@/types'

export async function POST(request: NextRequest) {
  const { user, supabase, response: authResponse } = await withAuth(request)
  if (!user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

  Sentry.setUser({ id: user.id, email: user.email ?? undefined })

  let journalId: string | undefined

  try {
    let body
    try {
      body = await request.json()
    } catch (parseError) {
      return NextResponse.json(
        { error: '请求体格式无效' },
        { status: 400 }
      )
    }
    const { id, content, mood, useByok } = body
    journalId = id

    if (
      !id ||
      !content ||
      typeof content !== 'string' ||
      content.trim().length === 0 ||
      typeof mood !== 'number' ||
      mood < 1 ||
      mood > 5 ||
      Number.isNaN(mood) ||
      (useByok !== undefined && typeof useByok !== 'boolean')
    ) {
      return NextResponse.json(
        { error: '缺少必填字段: id, content, mood' },
        { status: 400 }
      )
    }

    // BYOK 模式
    if (useByok === true) {
      const { data: keyData, error: keyError } = await supabase
        .from('user_api_keys')
        .select('encrypted_key, iv')
        .eq('user_id', user.id)
        .eq('is_active', true)
        .single()

      if (keyError || !keyData || !keyData.encrypted_key || !keyData.iv) {
        return NextResponse.json({
          id,
          response: '你还没有配置 BYOK Key，先去设置页添加吧~',
          goldenQuote: '自带 Key，无限可能。',
          moodLabel: '提示',
          fromFallback: true,
          invalidKey: true,
        })
      }

      let decryptedKey: string
      try {
        decryptedKey = decryptKey(keyData.encrypted_key, keyData.iv)
      } catch (decryptError) {
        console.error('[API Route] decryptKey failed:', decryptError instanceof Error ? decryptError.message : 'unknown')
        // 不上报完整 error 对象（可能含敏感信息）
        Sentry.captureException(new Error('BYOK decryption failed'))
        return NextResponse.json({
          id,
          response: 'Key 解密失败，请检查设置页的配置',
          goldenQuote: '自带 Key，无限可能。',
          moodLabel: '提示',
          fromFallback: true,
          invalidKey: true,
        })
      }

      const result = await callAI(content.trim(), mood as MoodLevel, decryptedKey)

      if (result.invalidKey) {
        return NextResponse.json({
          id,
          response: result.response,
          goldenQuote: result.goldenQuote,
          moodLabel: result.moodLabel,
          fromFallback: true,
          invalidKey: true,
        })
      }

      return createJsonResponseWithCookies(
        {
          id,
          response: result.response,
          goldenQuote: result.goldenQuote,
          moodLabel: result.moodLabel,
          fromFallback: result.fromFallback,
        },
        { status: 200 },
        authResponse
      )
    }

    // 平台 Key 模式
    const result = await callAI(content.trim(), mood as MoodLevel)

    return createJsonResponseWithCookies(
      {
        id,
        response: result.response,
        goldenQuote: result.goldenQuote,
        moodLabel: result.moodLabel,
        fromFallback: result.fromFallback,
      },
      { status: 200 },
      authResponse
    )
  } catch (error) {
    console.error('[API Route] Error:', error)
    Sentry.captureException(error)
    return createJsonResponseWithCookies(
      {
        id: journalId ?? '',
        response: '小知暂时不在，但你的感受已经保存好了。稍后再来看看想对你说什么吧~',
        goldenQuote: '每一段难熬的时光，都是生活在给你放假。',
        moodLabel: '本地',
        fromFallback: true,
      },
      { status: 500 },
      authResponse
    )
  }
}
