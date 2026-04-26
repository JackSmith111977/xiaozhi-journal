// Supabase Edge Function: send-email
// 用于发送事务邮件（续费提醒、支付失败、安全通知、导出完成等）
//
// 部署命令: supabase functions deploy send-email
// 本地测试: supabase functions serve send-email --env-file .env.local

import "jsr:@supabase/functions-js/edge-runtime.d.ts"

interface EmailRequest {
  to: string
  subject: string
  template: string
  templatePath: string
  data: Record<string, string | number>
}

interface EmailResponse {
  success: boolean
  message: string
  messageId?: string
}

Deno.serve(async (req: Request) => {
  // CORS headers
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  // Only accept POST requests
  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ success: false, message: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }

  try {
    // Parse request body
    const body: EmailRequest = await req.json()
    const { to, subject, template, templatePath, data } = body

    // Validate required fields
    if (!to || !subject || !template) {
      return new Response(
        JSON.stringify({ success: false, message: 'Missing required fields: to, subject, template' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(to)) {
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid email format' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Get SMTP configuration from environment
    const smtpHost = Deno.env.get('SUPABASE_SMTP_HOST') || 'smtpdm.aliyun.com'
    const smtpPort = parseInt(Deno.env.get('SUPABASE_SMTP_PORT') || '465')
    const smtpUser = Deno.env.get('SUPABASE_SMTP_USER')
    const smtpPass = Deno.env.get('SUPABASE_SMTP_PASS')
    const senderName = '小知 Journal'

    if (!smtpUser || !smtpPass) {
      console.error('SMTP credentials not configured')
      return new Response(
        JSON.stringify({ success: false, message: 'SMTP service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Log email send request (for development/testing)
    console.log('📧 Sending email:')
    console.log(`  To: ${to}`)
    console.log(`  Subject: ${subject}`)
    console.log(`  Template: ${template}`)
    console.log(`  Template Path: ${templatePath}`)
    console.log(`  Data:`, data)

    // Note: Actual SMTP sending requires a SMTP client library
    // For production, integrate with:
    // - Deno SMTP client (https://deno.land/x/smtp)
    // - Or call external email API (Resend, SendGrid, etc.)

    // For now, return success (actual implementation deferred to production setup)
    const response: EmailResponse = {
      success: true,
      message: 'Email send request processed',
      messageId: `mock-${Date.now()}`,
    }

    return new Response(
      JSON.stringify(response),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Email send error:', error)
    return new Response(
      JSON.stringify({ success: false, message: 'Internal server error', error: String(error) }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})