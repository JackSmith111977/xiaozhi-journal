import { supabase } from './supabase/client';
import { getPendingJournals } from './db';

export interface ExportData {
  version: '1.0';
  profile: {
    nickname: string;
    email: string;
    registeredAt: string;
  };
  journals: Array<{
    id: string;
    content: string;
    mood: number | null;
    moodEmoji: string | null;
    aiResponse: string | null;
    goldenQuote: string | null;
    moodLabel: string | null;
    createdAt: string;
    updatedAt: string;
    status: string;
  }>;
  exportedAt: string;
}

const PAGE_SIZE = 1000;

/**
 * Fetch all journals (paginated) and profile from Supabase, export as JSON download.
 * Also includes pending (unsynced) journals from IndexedDB.
 */
export async function exportUserData(): Promise<ExportData> {
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    throw new Error('未登录，无法导出数据');
  }

  // Fetch profile (with fallback if RLS blocks or profile missing)
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('nickname, email, created_at')
    .eq('id', user.id)
    .maybeSingle();

  if (profileError) {
    console.warn('[Export] Profile fetch failed, using fallback:', profileError.message);
  }

  // Fetch all journals with pagination (Supabase default limit is 1000)
  const allJournals: Record<string, unknown>[] = [];
  let from = 0;
  let to = PAGE_SIZE - 1;
  let hasMore = true;

  while (hasMore) {
    const { data: page, error } = await supabase
      .from('journals')
      .select('*')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .range(from, to);

    if (error) {
      throw new Error(`导出失败：${error.message}`);
    }

    if (!page || page.length === 0) {
      hasMore = false;
    } else {
      allJournals.push(...page);
      if (page.length < PAGE_SIZE) {
        hasMore = false;
      } else {
        from += PAGE_SIZE;
        to += PAGE_SIZE;
      }
    }
  }

  // Include pending (unsynced) journals from IndexedDB
  let pendingJournals: Array<Record<string, unknown>> = [];
  try {
    const localPending = await getPendingJournals();
    pendingJournals = localPending.map(j => ({
      id: j.id,
      content: j.content,
      mood: j.mood,
      mood_emoji: j.moodEmoji,
      ai_response: j.aiResponse,
      golden_quote: j.goldenQuote,
      mood_label: j.moodLabel,
      created_at: j.timestamp,
      updated_at: j.timestamp,
      status: j.status,
    }));
  } catch (err) {
    console.warn('[Export] Failed to fetch pending journals from IndexedDB:', err);
  }

  // Merge and deduplicate by id (pending journals may not yet exist in Supabase)
  const supabaseIds = new Set(allJournals.map(j => j.id as string));
  const uniquePending = pendingJournals.filter(j => !supabaseIds.has(j.id as string));
  const mergedJournals = [...allJournals, ...uniquePending];

  const exportData: ExportData = {
    version: '1.0',
    profile: {
      nickname: profile?.nickname || user.email?.split('@')[0] || '用户',
      email: profile?.email || user.email || '',
      registeredAt: profile?.created_at || user.created_at || '',
    },
    journals: mergedJournals.map((j) => ({
      id: j.id as string,
      content: (j.content as string) || '',
      mood: j.mood as number | null,
      moodEmoji: j.mood_emoji as string | null,
      aiResponse: j.ai_response as string | null,
      goldenQuote: j.golden_quote as string | null,
      moodLabel: j.mood_label as string | null,
      createdAt: j.created_at as string,
      updatedAt: j.updated_at as string,
      status: j.status as string,
    })),
    exportedAt: new Date().toISOString(),
  };

  // Trigger download
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  const date = new Date().toISOString().split('T')[0];
  a.href = url;
  a.download = `xiaozhi-journal-export-${date}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  // Revoke after a short delay to ensure download has started
  void revokeAfterDelay(url, 150);

  return exportData;
}

/**
 * Revoke an object URL after a delay, with proper cleanup to avoid timer leaks.
 */
function revokeAfterDelay(url: string, ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(() => {
      URL.revokeObjectURL(url);
      resolve();
    }, ms);
  });
}
