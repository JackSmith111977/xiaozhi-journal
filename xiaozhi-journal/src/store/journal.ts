import { create } from 'zustand';
import { getJournals, getJournalById, addJournal as dbAdd, updateJournal as dbUpdate, syncToSupabase } from '@/lib/db';
import { subscribeJournals, unsubscribeJournals } from '@/lib/realtime';
import { initSyncManager, stopSyncManager, getSyncingStatus } from '@/lib/sync-manager';
import type { Journal, AIResponse } from '@/types';

// Stable handler references for online/offline listener cleanup
let onOnlineHandler: (() => void) | null = null;
let onOfflineHandler: (() => void) | null = null;

interface JournalState {
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
}

interface JournalActions {
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

export const useJournalStore = create<JournalState & JournalActions>((set) => ({
  journals: [],
  loading: false,
  error: null,
  selectedMood: null,
  draftContent: '',
  aiWaiting: false,
  latestAIResponse: null,
  isSyncing: false,
  isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
  pendingMessage: null,

  fetchJournals: async () => {
    set({ loading: true });
    try {
      const journals = await getJournals();
      set({ journals, loading: false });
    } catch (err) {
      set({ error: '加载失败', loading: false });
    }
  },

  addJournal: async (journal: Journal) => {
    set({ error: null });
    try {
      // Always save to IndexedDB first with pending status
      const offlineJournal = { ...journal, status: 'pending' as const };
      await dbAdd(offlineJournal);
      set((state) => ({
        journals: [offlineJournal, ...state.journals],
        draftContent: '',
        selectedMood: null,
      }));

      // Check if online — show pending message if offline
      const { isOnline: online } = getSyncingStatus();
      if (!online) {
        set({ pendingMessage: '已保存，小知在路上~' });
        return;
      }

      // Async trigger Supabase sync, don't block user
      set({ isSyncing: true });
      try {
        await syncToSupabase([offlineJournal]);
        // Clear pending message on success
        set({ pendingMessage: null });
      } catch (err) {
        console.warn('[Store] syncToSupabase failed, journal remains pending:', err);
        // Journal stays pending in IndexedDB, will retry on next online
      } finally {
        set({ isSyncing: false });
      }
    } catch (err) {
      set({ error: '保存失败' });
    }
  },

  updateJournal: async (journal: Journal) => {
    set({ error: null });
    try {
      // Mark as pending so offline edits sync on reconnect
      const offlineJournal = { ...journal, status: 'pending' as const };
      await dbUpdate(offlineJournal);
      set((state) => ({
        journals: state.journals.map((j) => (j.id === journal.id ? offlineJournal : j)),
      }));

      // Check online status — if online, sync immediately
      const { isOnline: online } = getSyncingStatus();
      if (online) {
        try {
          await syncToSupabase([offlineJournal]);
        } catch (err) {
          console.warn('[Store] syncToSupabase failed on update, journal remains pending:', err);
        }
      }
    } catch (err) {
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
    } catch (err) {
      console.error('[Store] AI response update failed:', err);
      set({ error: 'AI 回应更新失败' });
    }
  },

  setSelectedMood: (mood) => set({ selectedMood: mood }),
  setDraftContent: (content) => set({ draftContent: content }),
  setAIWaiting: (waiting) => set({ aiWaiting: waiting }),
  setLatestAIResponse: (response) => set({ latestAIResponse: response }),
  setError: (error) => set({ error }),

  // Realtime subscription handlers
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
      useJournalStore.getState().handleRealtimeChange(event, journal);
    });
  },

  stopRealtimeSubscription: () => {
    unsubscribeJournals();
  },

  clearAllData: () => {
    // Only clears state — subscription lifecycle is managed by start/stop.
    set({
      journals: [],
      loading: false,
      error: null,
      selectedMood: null,
      draftContent: '',
      aiWaiting: false,
      latestAIResponse: null,
      isSyncing: false,
      isOnline: typeof navigator !== 'undefined' ? navigator.onLine : true,
      pendingMessage: null,
    });
  },

  initOfflineSync: () => {
    initSyncManager();
    // Remove old listeners first (idempotent)
    if (onOnlineHandler) window.removeEventListener('online', onOnlineHandler);
    if (onOfflineHandler) window.removeEventListener('offline', onOfflineHandler);
    // Create stable handler references
    onOnlineHandler = () => set({ isOnline: true, pendingMessage: null });
    onOfflineHandler = () => set({ isOnline: false });
    window.addEventListener('online', onOnlineHandler);
    window.addEventListener('offline', onOfflineHandler);
  },

  stopOfflineSync: () => {
    stopSyncManager();
    if (onOnlineHandler) window.removeEventListener('online', onOnlineHandler);
    if (onOfflineHandler) window.removeEventListener('offline', onOfflineHandler);
    onOnlineHandler = null;
    onOfflineHandler = null;
  },
}));
