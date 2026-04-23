import { supabase } from './supabase/client';

/**
 * Delete the current user's account and all associated data.
 *
 * Flow:
 * 1. Delete avatar from Supabase Storage
 * 2. Delete profile (ON DELETE CASCADE removes all child tables)
 * 3. Call server-side API to delete auth.users record
 * 4. Sign out
 */
export async function deleteAccount(): Promise<void> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('未登录，无法删除账户');
  }

  // 1. Delete avatar from storage
  try {
    const { data: profile } = await supabase
      .from('profiles')
      .select('avatar_url')
      .eq('id', user.id)
      .single();

    if (profile?.avatar_url) {
      const { error: removeError } = await supabase.storage.from('avatars').remove([profile.avatar_url]);
      if (removeError) {
        console.warn('[Account] Avatar file deletion failed, orphan file will remain in storage:', removeError.message);
      }
    }
  } catch (err) {
    console.warn('[Account] Avatar deletion skipped:', err);
    // Continue even if avatar deletion fails
  }

  // 2. Delete profile (ON DELETE CASCADE removes all child tables)
  const { error } = await supabase
    .from('profiles')
    .delete()
    .eq('id', user.id);

  if (error) {
    throw new Error(`删除账户失败：${error.message}`);
  }

  // 3. Delete auth user via server-side API route
  try {
    const response = await fetch('/api/account/delete', { method: 'DELETE' });
    if (!response.ok) {
      const body = await response.json().catch(() => ({}));
      console.warn('[Account] Auth user deletion API failed:', body.error || response.statusText);
    }
  } catch (err) {
    console.warn('[Account] Auth user deletion API call failed:', err);
    // Profile is already deleted, so data is gone. Auth user remains as orphan.
  }

  // 4. Sign out
  await supabase.auth.signOut();
}
