import { openDB, type IDBPDatabase } from 'idb';
import type { Journal, AppMeta } from '@/types';
import { supabase } from './supabase';

const DB_NAME = 'xiaozhi-journal';
const DB_VERSION = 1;

let dbPromise: Promise<IDBPDatabase> | null = null;
let dbInstance: IDBPDatabase | null = null;

function getDB() {
  if (dbInstance) return Promise.resolve(dbInstance);
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
      blocked(currentVersion, blockedVersion) {
        console.warn(`[DB] Blocked upgrading from v${currentVersion} to v${blockedVersion}`);
      },
      blocking(currentVersion, blockedVersion) {
        if (dbInstance) {
          dbInstance.close();
          dbInstance = null;
          dbPromise = null;
        }
      },
      terminated() {
        dbInstance = null;
        dbPromise = null;
      },
    }).then((db) => {
      dbInstance = db;
      return db;
    }).catch((err) => {
      dbPromise = null;
      throw err;
    });
  }
  return dbPromise;
}

export async function addJournal(journal: Journal) {
  const db = await getDB();
  await db.put('journals', journal);
}

export async function getJournals(): Promise<Journal[]> {
  const db = await getDB();
  const all = await db.getAll('journals');
  return all.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
}

export async function getJournalById(id: string): Promise<Journal | undefined> {
  const db = await getDB();
  return db.get('journals', id);
}

export async function updateJournal(journal: Journal) {
  const db = await getDB();
  await db.put('journals', journal);
}

export async function getPendingJournals(): Promise<Journal[]> {
  const db = await getDB();
  const all = await db.getAllFromIndex('journals', 'status', 'pending');
  return all;
}

export async function setMeta(key: string, value: unknown) {
  const db = await getDB();
  await db.put('appMeta', { key, value });
}

export async function getMeta(key: string): Promise<unknown | undefined> {
  const db = await getDB();
  const meta = await db.get('appMeta', key);
  return meta?.value;
}

export async function deleteJournal(id: string) {
  const db = await getDB();
  await db.delete('journals', id);
}

export async function markSynced(id: string) {
  const db = await getDB();
  const journal = await db.get('journals', id);
  if (journal) {
    const updated = { ...journal, status: 'ai_done' as const };
    await db.put('journals', updated);
  }
}

export async function syncToSupabase(journals: Journal[]) {
  if (journals.length === 0) return;

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    console.warn('[CacheProvider] syncToSupabase skipped: user not logged in');
    return;
  }

  const records = journals.map(j => ({
    id: j.id,
    user_id: user.id,
    content: j.content,
    mood: j.mood,
    mood_emoji: j.moodEmoji,
    ai_response: j.aiResponse,
    golden_quote: j.goldenQuote,
    mood_label: j.moodLabel,
    created_at: j.timestamp,
    status: j.status,
  }));

  const { error } = await supabase
    .from('journals')
    .upsert(records);

  if (error) {
    console.warn('[CacheProvider] syncToSupabase failed:', error.message);
    throw error;
  }

  for (const j of journals) {
    await markSynced(j.id);
  }
}
