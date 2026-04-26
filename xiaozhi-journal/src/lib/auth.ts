import { supabase } from './supabase/client'
import { sendSecurityNotification } from './email'

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
  })
  if (error) throw error
  // Auto sign-in after registration regardless of email confirmation setting
  if (data.user && !data.session) {
    await supabase.auth.signInWithPassword({ email, password })
  }
  return data
}

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  })
  if (error) throw error
  return data
}

export async function signOut() {
  const { error } = await supabase.auth.signOut()
  if (error) throw error
}

export async function getCurrentUser() {
  const { data: { user } } = await supabase.auth.getUser()
  return user
}

export async function resetPassword(email: string, redirectTo: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  })
  if (error) throw error
}

/**
 * 安全获取设备信息（浏览器环境）
 * 服务端环境返回兜底值，不抛出异常
 */
function getDeviceInfo() {
  if (typeof navigator === 'undefined') {
    return { device: '未知设备', browser: '未知浏览器' }
  }
  return {
    device: navigator.userAgent.split(' ').slice(-2).join(' ') || navigator.userAgent,
    browser: navigator.userAgent.split('/')[0],
  }
}

/**
 * 更新密码并发送安全通知邮件
 *
 * @param password - 新密码
 * @returns Promise<void>
 */
export async function updatePassword(password: string) {
  const { error } = await supabase.auth.updateUser({ password })
  if (error) throw error

  // 发送密码修改安全通知邮件
  try {
    const { data: { user } } = await supabase.auth.getUser()
    if (user?.email) {
      const deviceInfo = getDeviceInfo()
      await sendSecurityNotification(
        user.email,
        'password_change',
        {
          timestamp: new Date().toLocaleString('zh-CN', {
            year: 'numeric',
            month: '2-digit',
            day: '2-digit',
            hour: '2-digit',
            minute: '2-digit',
          }),
          device: deviceInfo.device,
          ipAddress: '检测中...',
          browser: deviceInfo.browser,
        }
      )
    }
  } catch (emailError) {
    // 邮件发送失败不影响密码更新
    console.warn('[Auth] 安全通知邮件发送失败:', emailError)
  }
}
