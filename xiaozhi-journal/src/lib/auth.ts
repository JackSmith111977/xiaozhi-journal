import { supabase } from '@/lib/supabase/client';

// ── Custom Error ──────────────────────────────────────────────────────────────

export class AuthError extends Error {
  code: string;

  constructor(code: string, message: string) {
    super(message);
    this.name = 'AuthError';
    this.code = code;
  }
}

// ── Sign Up ───────────────────────────────────────────────────────────────────
// Returns the created user. email_confirmed_at is null when email confirmation
// is enabled in Supabase dashboard.

export async function signUp(email: string, password: string) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    throw new AuthError(error.status?.toString() ?? 'unknown', error.message);
  }

  if (!data.user) {
    throw new AuthError('no_user', '注册失败，请稍后重试');
  }

  return data.user;
}

// ── Sign In ───────────────────────────────────────────────────────────────────
// Throws AuthError with code 'email_not_confirmed' if user hasn't confirmed email.

export async function signIn(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });

  if (error) {
    // Supabase returns "Email not confirmed" error when enable_confirmations is true
    // and user tries to sign in before confirming email.
    if (error.message?.includes('Email not confirmed')) {
      throw new AuthError('email_not_confirmed', '请先验证你的邮箱，检查收件箱或重新发送验证邮件');
    }
    throw new AuthError(error.status?.toString() ?? 'unknown', error.message);
  }

  return data.user;
}

// ── Sign Out ──────────────────────────────────────────────────────────────────

export async function signOut() {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw new AuthError(error.status?.toString() ?? 'unknown', error.message);
  }
}

// ── Reset Password ────────────────────────────────────────────────────────────

export async function resetPassword(email: string, redirectTo?: string) {
  const { error } = await supabase.auth.resetPasswordForEmail(email, {
    redirectTo: redirectTo ?? `${window.location.origin}/auth/callback`,
  });

  if (error) {
    throw new AuthError(error.status?.toString() ?? 'unknown', error.message);
  }
}

// ── Update Password ───────────────────────────────────────────────────────────

export async function updatePassword(newPassword: string) {
  const { error } = await supabase.auth.updateUser({
    password: newPassword,
  });

  if (error) {
    throw new AuthError(error.status?.toString() ?? 'unknown', error.message);
  }
}

// ── Send Email Confirmation ───────────────────────────────────────────────────

export async function sendEmailConfirmation(email: string) {
  const { error } = await supabase.auth.resend({
    type: 'signup',
    email,
    options: {
      emailRedirectTo: `${window.location.origin}/auth/callback`,
    },
  });

  if (error) {
    throw new AuthError(error.status?.toString() ?? 'unknown', error.message);
  }
}

// ── Get Current User ─────────────────────────────────────────────────────────

export async function getCurrentUser() {
  const { data, error } = await supabase.auth.getUser();
  if (error) {
    return null;
  }
  return data.user;
}
