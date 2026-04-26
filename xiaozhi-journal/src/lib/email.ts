/**
 * 邮件发送服务封装层
 *
 * 提供统一的事务邮件发送接口，支持：
 * - welcome: 注册欢迎邮件（复用 Supabase Auth signup 模板）
 * - renewal-reminder: 订阅续费提醒
 * - payment-failed: 支付失败提醒
 * - security-notification: 安全事件通知
 * - export-complete: 数据导出完成通知
 *
 * 本地开发：通过 Supabase Inbucket 测试邮件
 * 生产环境：通过 Edge Function 发送真实邮件
 */

// 邮件模板类型
export type EmailTemplateType =
  | 'welcome'           // 注册欢迎
  | 'renewal-reminder'  // 续费提醒
  | 'payment-failed'    // 支付失败
  | 'security-notification' // 安全通知
  | 'export-complete'   // 导出完成

// 邮件发送接口
export interface SendEmailOptions {
  to: string
  template: EmailTemplateType
  data: Record<string, string | number>  // 模板变量
}

// 邮件模板配置
const EMAIL_TEMPLATES: Record<EmailTemplateType, {
  subject: string
  templatePath: string
}> = {
  'welcome': {
    subject: '欢迎加入小知 Journal',
    templatePath: './supabase/templates/email-confirmation.html'
  },
  'renewal-reminder': {
    subject: '你的订阅即将到期',
    templatePath: './supabase/templates/renewal-reminder.html'
  },
  'payment-failed': {
    subject: '支付失败，请更新支付方式',
    templatePath: './supabase/templates/payment-failed.html'
  },
  'security-notification': {
    subject: '账号安全提醒',
    templatePath: './supabase/templates/security-notification.html'
  },
  'export-complete': {
    subject: '你的数据导出已完成',
    templatePath: './supabase/templates/export-complete.html'
  }
}

/**
 * 发送事务邮件
 *
 * 通过调用 Edge Function 发送邮件
 * 本地开发时邮件会发送到 Inbucket 测试服务器
 *
 * @param options - 邮件发送选项
 * @returns Promise<void>
 * @throws Error - 发送失败时抛出错误
 */
export async function sendEmail(options: SendEmailOptions, baseUrl?: string): Promise<void> {
  const { to, template, data } = options

  // 获取模板配置
  const templateConfig = EMAIL_TEMPLATES[template]
  if (!templateConfig) {
    throw new Error(`未知的邮件模板类型: ${template}`)
  }

  // 确定 API 端点 URL（服务端调用需传入 baseUrl）
  const origin = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '')
  if (!origin) {
    throw new Error('sendEmail: 无法确定 API 基础 URL，在服务端调用请传入 baseUrl')
  }

  let response: Response
  try {
    response = await fetch(`${origin}/api/email/send`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to,
        subject: templateConfig.subject,
        template,
        templatePath: templateConfig.templatePath,
        data,
      }),
    })
  } catch {
    throw new Error('邮件发送失败: 网络错误')
  }

  if (!response.ok) {
    let errorMessage = '邮件发送失败'
    try {
      const error = await response.json()
      errorMessage = error.message || errorMessage
    } catch {
      errorMessage = await response.text().catch(() => errorMessage)
    }
    throw new Error(errorMessage)
  }
}

/**
 * 发送安全通知邮件（便捷函数）
 *
 * @param email - 用户邮箱
 * @param eventType - 事件类型 (password_change | new_device)
 * @param deviceInfo - 设备信息
 */
export async function sendSecurityNotification(
  email: string,
  eventType: 'password_change' | 'new_device',
  deviceInfo: {
    device?: string
    ipAddress?: string
    browser?: string
    timestamp: string
  }
): Promise<void> {
  await sendEmail({
    to: email,
    template: 'security-notification',
    data: {
      EventType: eventType === 'password_change' ? '密码修改' : '新设备登录',
      Timestamp: deviceInfo.timestamp,
      Device: deviceInfo.device || '未知设备',
      IPAddress: deviceInfo.ipAddress || '未知IP',
      Browser: deviceInfo.browser || '未知浏览器',
      SiteURL: process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000',
    },
  })
}

/**
 * 发送续费提醒邮件（便捷函数）
 *
 * @param email - 用户邮箱
 * @param endDate - 订阅到期日期
 * @param tier - 订阅等级
 * @param renewalUrl - 续费链接
 */
export async function sendRenewalReminder(
  email: string,
  endDate: string,
  tier: string,
  renewalUrl: string
): Promise<void> {
  await sendEmail({
    to: email,
    template: 'renewal-reminder',
    data: {
      EndDate: endDate,
      Tier: tier,
      RenewalURL: renewalUrl,
    },
  })
}

/**
 * 发送支付失败提醒邮件（便捷函数）
 *
 * @param email - 用户邮箱
 * @param reason - 失败原因
 * @param retryUrl - 重试链接
 */
export async function sendPaymentFailedNotification(
  email: string,
  reason: string,
  retryUrl: string
): Promise<void> {
  await sendEmail({
    to: email,
    template: 'payment-failed',
    data: {
      Reason: reason,
      RetryURL: retryUrl,
    },
  })
}

/**
 * 发送数据导出完成通知邮件（便捷函数）
 *
 * @param email - 用户邮箱
 * @param downloadUrl - 下载链接
 * @param expiresIn - 有效期（小时）
 * @param format - 文件格式
 */
export async function sendExportCompleteNotification(
  email: string,
  downloadUrl: string,
  expiresIn: number,
  format: string
): Promise<void> {
  await sendEmail({
    to: email,
    template: 'export-complete',
    data: {
      DownloadURL: downloadUrl,
      ExpiresIn: expiresIn.toString(),
      Format: format,
    },
  })
}