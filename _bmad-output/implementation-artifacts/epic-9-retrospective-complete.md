# Epic 9 Retrospective — 数据云端同步

**Date:** 2026-04-19 (original)
**E2E Verification:** 2026-04-21 (added)
**Status:** Complete

## Summary

Epic 9 implemented full cloud data synchronization including:
- 6 Supabase tables with RLS policies
- Real-time subscription for live data sync
- Offline-first architecture with IndexedDB
- Data export (GDPR portability)
- Account deletion (GDPR right to be forgotten)

## Sprint Status

| Story | Status | E2E |
|-------|--------|-----|
| 9.1 — DB Migration | done | PASS |
| 9.2 — Realtime Subscription | done | PASS |
| 9.3 — Offline Sync | done | PASS |
| 9.4 — Data Export | done | PASS |
| 9.5 — Account Deletion | done | PASS (partial) |

## P2 Follow-ups

| Story | Item | Priority |
|-------|------|----------|
| 9.1 | journals (user_id, updated_at DESC) index | Low |
| 9.1 | update_updated_at_column function naming | Low |
| 9.1 | app_meta.key format CHECK constraint | Low |
| 9.1 | profiles.nickname length CHECK | Low |
| 9.1 | Rollback migration scripts | Low |
| 9.2 | Supabase client realtime config | Low |
| 9.2 | INSERT prepend sorting | Low |
| 9.2 | Reconnect strategy | Low (default handled) |
| 9.2 | Channel name with userId | Low (RLS isolation) |
| 9.3 | pendingMessage auto-clear | Low |
| 9.3 | syncPending exponential backoff | Low |
| 9.3 | getPendingJournals IDBKeyRange optimization | Low |
| 9.3 | console.log in production | Low |
| 9.5 | 30-day backup removal | Ops task |
| 9.5 | Warning icon on delete button | Low |

## Known Limitations

1. **Auth user deletion** (9.5): Requires Supabase Edge Function with service role key. Current implementation deletes profile + CASCADE all child data, but the auth user itself persists. Logged as ops follow-up.
