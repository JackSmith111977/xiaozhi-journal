export interface PasswordResult {
  valid: boolean;
  strength: 'weak' | 'medium' | 'strong';
  message: string;
  segments: number; // 1-5
}

export function validatePassword(pwd: string): PasswordResult {
  // Trim whitespace to prevent accidental leading/trailing spaces
  const trimmed = pwd.trim();

  if (!trimmed) {
    return { valid: false, strength: 'weak', message: '', segments: 1 };
  }

  const hasMinLength = trimmed.length >= 8;
  const hasLower = /[a-z]/.test(trimmed);
  const hasUpper = /[A-Z]/.test(trimmed);
  const hasDigit = /\d/.test(trimmed);
  const complexity = [hasLower, hasUpper, hasDigit].filter(Boolean).length;

  if (!hasMinLength) {
    return { valid: false, strength: 'weak', message: '再加几位吧~', segments: 2 };
  }
  if (complexity === 1) {
    return { valid: false, strength: 'medium', message: '还不错，加点复杂度？', segments: 3 };
  }
  if (complexity === 2) {
    return { valid: false, strength: 'medium', message: '快达标了，再加一种？', segments: 4 };
  }
  return { valid: true, strength: 'strong', message: '这就很安全了 ✨', segments: 5 };
}

export function passwordsMatch(password: string, confirmPassword: string): boolean {
  // Only return true when both fields have content and match
  return password.length > 0 && confirmPassword.length > 0 && password === confirmPassword;
}
