import { createClient } from '@/lib/supabase/server';
import { EmptyState } from '@/components/empty-state';
import { Skeleton } from '@/components/ui/skeleton';
import { JournalListItem } from '@/components/journal-list-item';
import { MOOD_MAP } from '@/types';
import type { Journal, MoodLevel } from '@/types';
import Link from 'next/link';
import { redirect } from 'next/navigation';

const PAGE_SIZE = 20;

interface SupabaseJournal {
  id: string;
  content: string;
  mood: number;
  mood_emoji: string | null;
  ai_response: string | null;
  golden_quote: string | null;
  mood_label: string | null;
  created_at: string;
  status: string | null;
}

function mapJournal(row: SupabaseJournal): Journal {
  const moodLevel = row.mood as keyof typeof MOOD_MAP;
  return {
    id: row.id,
    content: row.content,
    mood: row.mood as MoodLevel,
    moodEmoji: row.mood_emoji ?? MOOD_MAP[moodLevel]?.emoji ?? '😐',
    aiResponse: row.ai_response,
    goldenQuote: row.golden_quote,
    moodLabel: row.mood_label,
    timestamp: row.created_at,
    status: (row.status ?? 'synced') as Journal['status'],
    shareCount: 0,
  };
}

export default async function HistoryPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string }>;
}) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    redirect('/auth/login');
  }

  const params = await searchParams;
  const page = Math.max(1, parseInt(params.page || '1', 10));
  const offset = (page - 1) * PAGE_SIZE;

  const { data: rows, error } = await supabase
    .from('journals')
    .select(
      'id, content, mood, mood_emoji, ai_response, golden_quote, mood_label, created_at, status'
    )
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })
    .range(offset, offset + PAGE_SIZE - 1);

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">加载失败，请稍后重试</p>
      </div>
    );
  }

  const { count: total } = await supabase
    .from('journals')
    .select('*', { count: 'exact', head: true })
    .eq('user_id', user.id);

  const totalPages = Math.ceil((total || 0) / PAGE_SIZE);
  const journals = (rows || []).map(mapJournal);

  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-[680px] mx-auto px-6 py-12">
        <Link
          href="/"
          className="text-accent text-sm mb-6 inline-block hover:underline"
        >
          ← 返回首页
        </Link>
        <h1 className="text-2xl text-foreground mb-8 font-serif">过往记录</h1>

        {journals.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            <div className="space-y-4">
              {journals.map((journal, i) => (
                <JournalListItem key={journal.id} journal={journal} index={i} />
              ))}
            </div>

            {totalPages > 1 && (
              <div className="flex justify-center gap-3 mt-8">
                {page > 1 && (
                  <Link
                    href={`/history?page=${page - 1}`}
                    className="px-4 py-2 text-sm text-accent hover:underline"
                  >
                    ← 上一页
                  </Link>
                )}
                <span className="px-4 py-2 text-sm text-muted-foreground">
                  第 {page} 页 / 共 {totalPages} 页
                </span>
                {page < totalPages && (
                  <Link
                    href={`/history?page=${page + 1}`}
                    className="px-4 py-2 text-sm text-accent hover:underline"
                  >
                    下一页 →
                  </Link>
                )}
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
}

export function HistoryPageSkeleton() {
  return (
    <main className="min-h-screen bg-background">
      <div className="max-w-[680px] mx-auto px-6 py-12">
        <div className="h-4 w-20 bg-muted rounded mb-6 animate-pulse" />
        <Skeleton className="h-8 w-40 mb-8" />
        <div className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-24 w-full rounded-2xl" />
          ))}
        </div>
      </div>
    </main>
  );
}
