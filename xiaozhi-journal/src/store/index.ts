import { create } from 'zustand';
import type { StateCreator } from 'zustand';
import { getJournals, getJournalById, addJournal as dbAdd, updateJournal as dbUpdate, syncToSupabase } from '@/lib/db';
import { subscribeJournals, unsubscribeJournals } from '@/lib/realtime';
import { supabase } from '@/lib/supabase/client';
import type { Journal, AIResponse } from '@/types';
import type { User, Subscription } from '@supabase/supabase-js';

// ── Slice Types ──────────────────────────────────────────────────────────────

export interface AuthSlice {
  user: User | null;
  authLoading: boolean;
  isAuthenticated: boolean;
  setUser: (user: User | null) => void;
  setAuthLoading: (loading: boolean) => void;
}

export interface JournalSlice {
  journals: Journal[];
  loading: boolean;
  error: string | null;
  selectedMood: number | null;
  draftContent: string;
  aiWaiting: boolean;
  latestAIResponse: AIResponse | null;
  isSyncing: boolean;
  isOnline: boolean;
  pendingMessage: string | null;
  syncProgress: { total: number; done: number } | null;
  fetchJournals: () => Promise<void>;
  addJournal: (journal: Journal) => Promise<void>;
  updateJournal: (journal: Journal) => Promise<void>;
  updateAIResponse: (id: string, response: AIResponse) => Promise<void>;
  handleRealtimeChange: (event: 'INSERT' | 'UPDATE' | 'DELETE', journal: Journal) => void;
  startRealtimeSubscription: () => void;
  stopRealtimeSubscription: () => void;
  setSelectedMood: (mood: number | null) => void;
  setDraftContent: (content: string) => void;
  setAIWaiting: (waiting: boolean) => void;
  setLatestAIResponse: (response: AIResponse | null) => void;
  setError: (error: string | null) => void;
  clearAllData: () => void;
  initOfflineSync: () => void;
  stopOfflineSync: () => void;
}

export interface SyncSlice {
  initialized: boolean;
  setInitialized: (v: boolean) => void;
}

export type AppStore = AuthSlice & JournalSlice & SyncSlice;

// ── Slices ───────────────────────────────────────────────────────────────────

const createAuthSlice: StateCreator<AppStore, [], [], AuthSlice> = (set) => ({
  user: null,
  authLoading: true,
  isAuthenticated: false,

  setUser: (user) => set({ user, isAuthenticated: !!user }),
  setAuthLoading: (loading) => set({ authLoading: loading }),
});

const createJournalSlice: StateCreator<AppStore, [], [], JournalSlice> = (set, get) => ({
  journals: [],
  loading: false,
  error: null,
  selectedMood: null,
  draftContent: '',
  aiWaiting: false,
  latestAIResponse: null,
  isSyncing: false,
  isOnline: true, // SSR stable; updated by initOfflineSync on client
  pendingMessage: null,
  syncProgress: null,

  fetchJournals: async () => {
    set({ loading: true });
    try {
      const journals = await getJournals();
      set({ journals, loading: false });
    } catch {
      set({ error: '加载失败', loading: false });
    }
  },

  addJournal: async (journal: Journal) => {
    set({ error: null });
    try {
      const offlineJournal = { ...journal, status: 'pending' as const };
      await dbAdd(offlineJournal);
      set((state) => ({
        journals: [offlineJournal, ...state.journals],
        draftContent: '',
        selectedMood: null,
      }));

      if (typeof navigator !== 'undefined' && !navigator.onLine) {
        set({ pendingMessage: '已保存，小知在路上~' });
        return;
      }

      set({ isSyncing: true });
      try {
        await syncToSupabase([offlineJournal]);
        set({ pendingMessage: null });
      } catch {
        // Journal remains pending in IndexedDB for retry
      } finally {
        set({ isSyncing: false });
      }
    } catch {
      set({ error: '保存失败' });
    }
  },

  updateJournal: async (journal: Journal) => {
    set({ error: null });
    try {
      const offlineJournal = { ...journal, status: 'pending' as const };
      await dbUpdate(offlineJournal);
      set((state) => ({
        journals: state.journals.map((j) => (j.id === journal.id ? offlineJournal : j)),
      }));

      if (typeof navigator === 'undefined' || navigator.onLine) {
        try {
          await syncToSupabase([offlineJournal]);
        } catch {
          // Journal remains pending
        }
      }
    } catch {
      set({ error: '更新失败' });
    }
  },

  updateAIResponse: async (id: string, response: AIResponse) => {
    set({ aiWaiting: false, error: null });
    try {
      const journal = await getJournalById(id);
      if (journal) {
        const updated = {
          ...journal,
          aiResponse: response.response,
          goldenQuote: response.goldenQuote,
          moodLabel: response.moodLabel,
          status: 'ai_done' as const,
        };
        await dbUpdate(updated);
        set((state) => ({
          journals: state.journals.map((j) => (j.id === id ? updated : j)),
          latestAIResponse: response,
        }));
      }
    } catch {
      set({ error: 'AI 回应更新失败' });
    }
  },

  handleRealtimeChange: (event, journal) => {
    if (event === 'INSERT') {
      set((state) => ({ journals: [journal, ...state.journals] }));
    } else if (event === 'UPDATE') {
      set((state) => ({
        journals: state.journals.map((j) => (j.id === journal.id ? journal : j)),
      }));
    } else if (event === 'DELETE') {
      set((state) => ({
        journals: state.journals.filter((j) => j.id !== journal.id),
      }));
    }
  },

  startRealtimeSubscription: () => {
    set({ error: null });
    subscribeJournals((event, journal) => {
      get().handleRealtimeChange(event, journal);
    });
  },

  stopRealtimeSubscription: () => {
    unsubscribeJournals();
  },

  setSelectedMood: (mood) => set({ selectedMood: mood }),
  setDraftContent: (content) => set({ draftContent: content }),
  setAIWaiting: (waiting) => set({ aiWaiting: waiting }),
  setLatestAIResponse: (response) => set({ latestAIResponse: response }),
  setError: (error) => set({ error }),

  clearAllData: () => {
    set({
      journals: [],
      loading: false,
      error: null,
      selectedMood: null,
      draftContent: '',
      aiWaiting: false,
      latestAIResponse: null,
      isSyncing: false,
      isOnline: true,
      pendingMessage: null,
      syncProgress: null,
    });
  },

  initOfflineSync: () => {
    // Set actual online status on client
    set({ isOnline: navigator.onLine });

    const onOnline = () => {
      set({ isOnline: true, pendingMessage: null });

      // Import syncPendingWithAI dynamically
      import('@/lib/sync-manager').then(({ syncPendingWithAI }) => {
        set({ syncProgress: null });

        syncPendingWithAI(
          // onProgress
          (total, done) => {
            set({ syncProgress: { total, done }, aiWaiting: done < total });
          },
          // onComplete
          () => {
            set({ syncProgress: null, aiWaiting: false });
          }
        );
      }).catch((err) => {
        console.warn('[Store] Failed to load sync-manager:', err);
      });
    };
    const onOffline = () => set({ isOnline: false });

    // Store handlers on window for cleanup
    (window as Window & { __journalOnlineHandler?: () => void; __journalOfflineHandler?: () => void }).__journalOnlineHandler = onOnline;
    (window as Window & { __journalOnlineHandler?: () => void; __journalOfflineHandler?: () => void }).__journalOfflineHandler = onOffline;

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
  },

  stopOfflineSync: () => {
    const win = window as Window & { __journalOnlineHandler?: () => void; __journalOfflineHandler?: () => void };
    if (win.__journalOnlineHandler) window.removeEventListener('online', win.__journalOnlineHandler);
    if (win.__journalOfflineHandler) window.removeEventListener('offline', win.__journalOfflineHandler);
    delete win.__journalOnlineHandler;
    delete win.__journalOfflineHandler;
    set({ pendingMessage: null, syncProgress: null, aiWaiting: false });
  },
});

const createSyncSlice: StateCreator<AppStore, [], [], SyncSlice> = (set) => ({
  initialized: false,
  setInitialized: (v) => set({ initialized: v }),
});

// ── Store ────────────────────────────────────────────────────────────────────

let activeSubscription: Subscription | null = null;
let initialized = false;

export const useAppStore = create<AppStore>()((...a) => ({
  ...createAuthSlice(...a),
  ...createJournalSlice(...a),
  ...createSyncSlice(...a),
}));

// ── Auth initialization (extracted from old auth store) ──────────────────────

export function initializeAuth() {
  if (initialized) return;
  initialized = true;

  const store = useAppStore.getState();
  store.setAuthLoading(true);

  const sessionPromise = supabase.auth.getSession();
  const timeoutId = setTimeout(() => {
    store.setUser(null);
    store.setAuthLoading(false);
  }, 5000);

  sessionPromise.then(({ data: { session } }) => {
    clearTimeout(timeoutId);
    const isAuthenticated = !!session?.user;
    store.setUser(session?.user ?? null);
    store.setAuthLoading(false);
    if (isAuthenticated) {
      useAppStore.getState().startRealtimeSubscription();
      useAppStore.getState().initOfflineSync();
    }
  }).catch((err) => {
    clearTimeout(timeoutId);
    store.setUser(null);
    store.setAuthLoading(false);
  });

  if (!activeSubscription) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const isAuthenticated = !!session?.user;
      useAppStore.getState().setUser(session?.user ?? null);
      useAppStore.getState().setAuthLoading(false);
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (isAuthenticated) {
          useAppStore.getState().startRealtimeSubscription();
          useAppStore.getState().initOfflineSync();
        }
      } else if (event === 'SIGNED_OUT') {
        useAppStore.getState().stopRealtimeSubscription();
        useAppStore.getState().stopOfflineSync();
        useAppStore.getState().clearAllData();
        initialized = false;
      }
    });
    activeSubscription = subscription;
  }
}

// ── Convenience re-exports for backward compatibility ────────────────────────

/** @deprecated use useAppStore — kept for incremental migration */
export const useAuthStore = useAppStore;
/** @deprecated use useAppStore — kept for incremental migration */
export const useJournalStore = useAppStore;
