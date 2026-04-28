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
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
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

    // Log email request
    console.log('📧 Email request:')
    console.log(`  To: ${to}`)
    console.log(`  Subject: ${subject}`)
    console.log(`  Template: ${template}`)

    // Mock mode — default, controlled by EMAIL_MOCK env var
    const isMock = Deno.env.get('EMAIL_MOCK') !== 'false'
    if (isMock) {
      console.warn('⚠️ EMAIL_MOCK=true — email not actually sent')
      console.warn('   Set EMAIL_MOCK=false in production SMTP environment')
      const response: EmailResponse = {
        success: true,
        message: 'Email send request processed (mock)',
        messageId: `mock-${Date.now()}`,
      }
      return new Response(
        JSON.stringify(response),
        { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Production mode — validate and send real email
    const smtpHost = Deno.env.get('SUPABASE_SMTP_HOST')
    const rawPort = Deno.env.get('SUPABASE_SMTP_PORT') || '465'
    const smtpPort = parseInt(rawPort, 10)
    if (Number.isNaN(smtpPort) || smtpPort < 1 || smtpPort > 65535) {
      console.error(`Invalid SMTP port: ${rawPort}`)
      return new Response(
        JSON.stringify({ success: false, message: 'Invalid SMTP port configuration' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    const smtpUser = Deno.env.get('SUPABASE_SMTP_USER')
    const smtpPass = Deno.env.get('SUPABASE_SMTP_PASS')
    if (!smtpHost || !smtpUser || !smtpPass) {
      console.error('SMTP configuration incomplete')
      return new Response(
        JSON.stringify({ success: false, message: 'SMTP service not configured' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // TODO: Implement real SMTP sending (deno.land/x/smtp or Resend/SendGrid API)
    return new Response(
      JSON.stringify({ success: false, message: 'SMTP sending not yet implemented' }),
      { status: 501, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Email send error:', error)
    return new Response(
      JSON.stringify({ success: false, message: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})