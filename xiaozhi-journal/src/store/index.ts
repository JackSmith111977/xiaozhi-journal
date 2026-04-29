import { create } from 'zustand';
import type { StateCreator } from 'zustand';
import { getJournals, getJournalById, addJournal as dbAdd, updateJournal as dbUpdate, syncToSupabase, setUserId, clearAllData as clearDbData } from '@/lib/db';
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
        return;
      }

      set({ isSyncing: true });
      try {
        await syncToSupabase([offlineJournal]);
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
      syncProgress: null,
    });
  },

  initOfflineSync: () => {
    // Set actual online status on client
    set({ isOnline: navigator.onLine });

    const onOnline = () => {
      set({ isOnline: true });

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
    set({ syncProgress: null, aiWaiting: false });
  },
});

const createSyncSlice: StateCreator<AppStore, [], [], SyncSlice> = (set) => ({
  initialized: false,
  setInitialized: (v) => set({ initialized: v }),
});

// ── Store ────────────────────────────────────────────────────────────────────

function recordLoginLog(userId: string, method: 'email' | 'wechat' = 'email') {
  // 静默记录，失败不阻塞登录
  fetch('/api/auth/login-log', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ loginMethod: method }),
  }).catch(() => {
    // 网络异常或端点不可用时静默忽略
  })
}

let activeSubscription: Subscription | null = null;
let initialized = false;
let initialLoginLogged = false;

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

  // Fallback timeout: 10s 后强制结束加载状态（防止离线/网络异常时无限加载）
  const fallbackTimeoutId = setTimeout(() => {
    const currentStore = useAppStore.getState();
    if (currentStore.authLoading) {
      console.warn('[Auth] INITIAL_SESSION timeout, forcing authLoading=false');
      currentStore.setAuthLoading(false);
    }
  }, 10000);

  // Supabase Auth v2: onAuthStateChange 订阅时立即发送 INITIAL_SESSION 事件
  // 无需 getSession() 调用，避免竞态条件
  if (!activeSubscription) {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      const isAuthenticated = !!session?.user;
      const currentStore = useAppStore.getState();

      // INITIAL_SESSION: 首次加载完成，设置初始状态
      if (event === 'INITIAL_SESSION') {
        clearTimeout(fallbackTimeoutId);
        currentStore.setUser(session?.user ?? null);
        currentStore.setAuthLoading(false);
        if (isAuthenticated) {
          setUserId(session!.user.id);
          currentStore.startRealtimeSubscription();
          currentStore.initOfflineSync();
          initialLoginLogged = true;
          recordLoginLog(session!.user.id, 'email');
        }
        return;
      }

      // 其他事件：更新状态但不重复设置 authLoading（已在 INITIAL_SESSION 中设置）
      currentStore.setUser(session?.user ?? null);

      if (event === 'SIGNED_IN') {
        if (isAuthenticated) {
          setUserId(session!.user.id);
          currentStore.startRealtimeSubscription();
          currentStore.initOfflineSync();
          // 仅 SIGNED_IN 时记录（去重 session 恢复已记录）
          if (!initialLoginLogged) {
            recordLoginLog(session!.user.id, 'email');
          }
        }
      } else if (event === 'TOKEN_REFRESHED') {
        // Token 刷新，无需额外处理，user 已更新
        if (isAuthenticated) {
          setUserId(session!.user.id);
        }
      } else if (event === 'SIGNED_OUT') {
        clearTimeout(fallbackTimeoutId);
        currentStore.stopRealtimeSubscription();
        currentStore.stopOfflineSync();
        currentStore.clearAllData();
        clearDbData();
        setUserId(null);
        initialized = false;
        initialLoginLogged = false;
        activeSubscription = null;
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
