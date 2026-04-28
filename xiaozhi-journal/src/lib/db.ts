import { openDB, type IDBPDatabase } from 'idb';
import type { Journal } from '@/types';

const DB_NAME = 'xiaozhi-journal';
const DB_VERSION = 2;

let currentUserId: string | null = null;

/** 设置当前用户 ID（登录时调用） */
export function setUserId(userId: string | null) {
  currentUserId = userId;
}

function getUserPrefix() {
  if (!currentUserId) {
    console.warn('[db] currentUserId not set — returning empty prefix');
    return '';
  }
  return `${currentUserId}_`;
}

function journalKey(id: string) {
  return `${getUserPrefix()}journal_${id}`;
}

function metaKey(key: string) {
  return `${getUserPrefix()}meta_${key}`;
}

let dbPromise: Promise<IDBPDatabase> | null = null;

async function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db, oldVersion) {
        // v1 → v2: 清除旧版无 prefix 数据，重建 stores（无 keyPath）
        if (oldVersion < 2) {
          if (db.objectStoreNames.contains('journals')) {
            db.deleteObjectStore('journals');
          }
          if (db.objectStoreNames.contains('appMeta')) {
            db.deleteObjectStore('appMeta');
          }
        }
        if (!db.objectStoreNames.contains('journals')) {
          const journalStore = db.createObjectStore('journals');
          journalStore.createIndex('timestamp', 'timestamp');
          journalStore.createIndex('status', 'status');
        }
        if (!db.objectStoreNames.contains('appMeta')) {
          db.createObjectStore('appMeta');
        }
      },
    });
  }
  return dbPromise;
}

// ── Journals ──────────────────────────────────────────────────────────────────

export async function getJournals(): Promise<Journal[]> {
  const db = await getDB();
  const prefix = `${getUserPrefix()}journal_`;
  const result: Journal[] = [];
  let cursor = await db.transaction('journals').store.openCursor();
  while (cursor) {
    if (typeof cursor.key === 'string' && cursor.key.startsWith(prefix)) {
      result.push(cursor.value);
    }
    cursor = await cursor.continue();
  }
  return result;
}

export async function getJournalById(id: string): Promise<Journal | undefined> {
  const db = await getDB();
  return db.get('journals', journalKey(id));
}

export async function addJournal(journal: Journal): Promise<void> {
  const db = await getDB();
  await db.put('journals', journal, journalKey(journal.id));
}

export async function updateJournal(journal: Journal): Promise<void> {
  const db = await getDB();
  await db.put('journals', journal, journalKey(journal.id));
}

export async function deleteJournal(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('journals', journalKey(id));
}

export async function getPendingJournals(): Promise<Journal[]> {
  const all = await getJournals();
  return all.filter(j => j.status === 'pending');
}

// ── App Meta ──────────────────────────────────────────────────────────────────

export async function getMeta(key: string): Promise<unknown> {
  const db = await getDB();
  const entry = await db.get('appMeta', metaKey(key));
  return entry?.value;
}

export async function setMeta(key: string, value: unknown): Promise<void> {
  const db = await getDB();
  await db.put('appMeta', { key, value }, metaKey(key));
}

export async function deleteMeta(key: string): Promise<void> {
  const db = await getDB();
  await db.delete('appMeta', metaKey(key));
}

// ── Supabase sync (stub — full implementation in later story) ─────────────────

export async function syncToSupabase(journals: Journal[]): Promise<void> {
  for (const journal of journals) {
    const db = await getDB();
    await db.put('journals', { ...journal, status: 'pending' }, journalKey(journal.id));
  }
}

// ── Clear all data (for logout) ───────────────────────────────────────────────

export async function clearAllData(): Promise<void> {
  const db = await getDB();
  const prefix = currentUserId ? `${currentUserId}_` : '';
  const tx1 = db.transaction('journals', 'readwrite');
  let cursor1 = await tx1.store.openCursor();
  while (cursor1) {
    if (typeof cursor1.key === 'string' && cursor1.key.startsWith(prefix)) {
      await cursor1.delete();
    }
    cursor1 = await cursor1.continue();
  }
  await tx1.done;

  const tx2 = db.transaction('appMeta', 'readwrite');
  let cursor2 = await tx2.store.openCursor();
  while (cursor2) {
    if (typeof cursor2.key === 'string' && cursor2.key.startsWith(prefix)) {
      await cursor2.delete();
    }
    cursor2 = await cursor2.continue();
  }
  await tx2.done;
}
