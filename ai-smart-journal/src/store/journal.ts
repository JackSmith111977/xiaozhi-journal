import { create } from 'zustand';
import { getJournals, addJournal as dbAdd, updateJournal as dbUpdate } from '@/lib/db';
import type { Journal, AIResponse } from '@/types';

interface JournalState {
  journals: Journal[];
  loading: boolean;
  error: string | null;
  selectedMood: number | null;
  draftContent: string;
  aiWaiting: boolean;
  latestAIResponse: AIResponse | null;
}

interface JournalActions {
  fetchJournals: () => Promise<void>;
  addJournal: (journal: Journal) => Promise<void>;
  updateJournal: (journal: Journal) => Promise<void>;
  updateAIResponse: (id: string, response: AIResponse) => Promise<void>;
  setSelectedMood: (mood: number | null) => void;
  setDraftContent: (content: string) => void;
  setAIWaiting: (waiting: boolean) => void;
  setLatestAIResponse: (response: AIResponse | null) => void;
  setError: (error: string | null) => void;
}

export const useJournalStore = create<JournalState & JournalActions>((set) => ({
  journals: [],
  loading: false,
  error: null,
  selectedMood: null,
  draftContent: '',
  aiWaiting: false,
  latestAIResponse: null,

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
    try {
      await dbAdd(journal);
      set((state) => ({
        journals: [journal, ...state.journals],
        draftContent: '',
      }));
    } catch (err) {
      set({ error: '保存失败' });
    }
  },

  updateJournal: async (journal: Journal) => {
    try {
      await dbUpdate(journal);
      set((state) => ({
        journals: state.journals.map((j) => (j.id === journal.id ? journal : j)),
      }));
    } catch (err) {
      set({ error: '更新失败' });
    }
  },

  updateAIResponse: async (id: string, response: AIResponse) => {
    set({ aiWaiting: false });
    try {
      const journals = await getJournals();
      const journal = journals.find((j) => j.id === id);
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
}));
