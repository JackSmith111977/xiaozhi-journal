import { supabase } from './supabase';

/**
 * Delete the current user's account and all associated data.
 *
 * Notes:
 * - All child tables (journals, ai_usage, user_api_keys, subscriptions, app_meta)
 *   have ON DELETE CASCADE on profiles.id, so deleting the profile cascades.
 * - We delete the avatar from Supabase Storage before removing the profile.
 * - Auth user deletion requires service role key (server-side). On the client side,
 *   we delete the profile first (cascading all data), then sign out.
 *   The auth user becomes orphaned but can be cleaned up via a Supabase Edge Function
 *   or manually in the dashboard.
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
      await supabase.storage.from('avatars').remove([profile.avatar_url]);
    }
  } catch (err) {
    console.warn('[Account] Avatar deletion warning:', err);
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

  // 3. Sign out (auth user remains but all data is gone)
  await supabase.auth.signOut();
}
