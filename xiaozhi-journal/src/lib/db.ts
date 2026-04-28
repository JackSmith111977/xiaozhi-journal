import { openDB, type IDBPDatabase } from 'idb';
import type { Journal } from '@/types';

const DB_NAME = 'xiaozhi-journal';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase> | null = null;

async function getDB() {
  if (!dbPromise) {
    dbPromise = openDB(DB_NAME, DB_VERSION, {
      upgrade(db) {
        if (!db.objectStoreNames.contains('journals')) {
          const journalStore = db.createObjectStore('journals', { keyPath: 'id' });
          journalStore.createIndex('timestamp', 'timestamp');
          journalStore.createIndex('status', 'status');
        }
        if (!db.objectStoreNames.contains('appMeta')) {
          db.createObjectStore('appMeta', { keyPath: 'key' });
        }
      },
    });
  }
  return dbPromise;
}

// ── Journals ──────────────────────────────────────────────────────────────────

export async function getJournals(): Promise<Journal[]> {
  const db = await getDB();
  return db.getAll('journals');
}

export async function getJournalById(id: string): Promise<Journal | undefined> {
  const db = await getDB();
  return db.get('journals', id);
}

export async function addJournal(journal: Journal): Promise<void> {
  const db = await getDB();
  await db.add('journals', journal);
}

export async function updateJournal(journal: Journal): Promise<void> {
  const db = await getDB();
  await db.put('journals', journal);
}

export async function deleteJournal(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('journals', id);
}

export async function getPendingJournals(): Promise<Journal[]> {
  const db = await getDB();
  const index = db.transaction('journals').store.index('status');
  return index.getAll('pending');
}

// ── App Meta ──────────────────────────────────────────────────────────────────

export async function getMeta(key: string): Promise<unknown> {
  const db = await getDB();
  const entry = await db.get('appMeta', key);
  return entry?.value;
}

export async function setMeta(key: string, value: unknown): Promise<void> {
  const db = await getDB();
  await db.put('appMeta', { key, value });
}

export async function deleteMeta(key: string): Promise<void> {
  const db = await getDB();
  await db.delete('appMeta', key);
}

// ── Supabase sync (stub — full implementation in later story) ─────────────────

export async function syncToSupabase(journals: Journal[]): Promise<void> {
  // Placeholder: journals remain in IndexedDB with status 'pending'
  // Full Supabase sync will be implemented in Epic 9
  for (const journal of journals) {
    const db = await getDB();
    await db.put('journals', { ...journal, status: 'pending' });
  }
}

// ── Clear all data (for logout) ───────────────────────────────────────────────

export async function clearAllData(): Promise<void> {
  const db = await getDB();
  await db.clear('journals');
  await db.clear('appMeta');
}
