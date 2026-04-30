'use client';

import { Skeleton } from '@/components/ui/skeleton';

export default function HistoryLoading() {
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
