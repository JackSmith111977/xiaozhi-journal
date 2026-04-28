import { NextRequest, NextResponse } from 'next/server'
import { withAuth, createJsonResponseWithCookies } from '@/lib/middleware/withAuth'

/**
 * 邮件发送 API Route Handler
 *
 * 处理事务邮件发送请求：
 * - 本地开发：记录邮件到日志（模拟发送）
 * - 生产环境：调用 Supabase Edge Function 发送真实邮件
 */

export async function POST(request: NextRequest) {
  const { user, response: authResponse } = await withAuth(request)
  if (!user) {
    return NextResponse.json({ error: '请先登录' }, { status: 401 })
  }

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
    const { to, subject, template, templatePath, data } = body

    // 过滤邮件主题中的换行符，防止 SMTP 头注入
    const sanitizedSubject = subject?.replace(/[\r\n]/g, '').trim()

    // 验证必填字段
    if (!to || !sanitizedSubject || !template) {
      return NextResponse.json(
        { error: '缺少必填字段: to, subject, template' },
        { status: 400 }
      )
    }

    // 验证邮箱格式
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(to)) {
      return NextResponse.json(
        { error: '邮箱格式无效' },
        { status: 400 }
      )
    }

    // 本地开发模式：记录邮件到日志
    if (process.env.NODE_ENV === 'development') {
      console.log('📧 [邮件发送模拟]')
      console.log(`  收件人: ${to}`)
      console.log(`  主题: ${sanitizedSubject}`)
      console.log(`  模板: ${template}`)
      console.log(`  模板路径: ${templatePath}`)
      console.log(`  变量数据:`, data)
      console.log('  → 本地开发邮件会发送到 Inbucket (http://localhost:54324)')

      return createJsonResponseWithCookies(
        {
          message: '邮件发送成功（本地开发模拟）',
          to,
          subject: sanitizedSubject,
          template,
          simulated: true,
        },
        { status: 200 },
        authResponse
      )
    }

    // 生产环境：调用 Supabase Edge Function
    // 注意：实际 Edge Function 需要单独创建
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!supabaseUrl || !supabaseAnonKey) {
      console.error('缺少 Supabase 配置')
      return NextResponse.json(
        { error: '邮件服务配置缺失' },
        { status: 500 }
      )
    }

    // 调用 Edge Function 发送邮件
    const edgeFunctionUrl = `${supabaseUrl}/functions/v1/send-email`

    const response = await fetch(edgeFunctionUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      body: JSON.stringify({
        to,
        subject: sanitizedSubject,
        template,
        templatePath,
        data,
      }),
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Edge Function 邮件发送失败:', errorText)
      return NextResponse.json(
        { error: '邮件发送失败' },
        { status: 500 }
      )
    }

    const result = await response.json()
    return createJsonResponseWithCookies(
      {
        message: '邮件发送成功',
        ...result,
      },
      { status: 200 },
      authResponse
    )

  } catch (error) {
    console.error('邮件发送 API 错误:', error)
    return createJsonResponseWithCookies(
      { error: '邮件发送失败，请稍后重试' },
      { status: 500 },
      authResponse
    )
  }
}