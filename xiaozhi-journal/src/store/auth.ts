import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
import { useJournalStore } from './journal'
import type { User } from '@supabase/supabase-js'

interface AuthState {
  user: User | null
  loading: boolean
  isAuthenticated: boolean
  setUser: (user: User | null) => void
  setLoading: (loading: boolean) => void
  initialize: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: true,
  isAuthenticated: false,

  setUser: (user) =>
    set({ user, isAuthenticated: !!user }),

  setLoading: (loading) => set({ loading }),

  initialize: () => {
    // Check current session on init — start realtime if already signed in.
    // subscribeJournals is idempotent (unsubscribes old channel first),
    // so calling it here and again in onAuthStateChange is safe.
    supabase.auth.getSession().then(({ data: { session } }) => {
      const isAuthenticated = !!session?.user
      set({ user: session?.user ?? null, isAuthenticated, loading: false })
      if (isAuthenticated) {
        useJournalStore.getState().startRealtimeSubscription()
        useJournalStore.getState().initOfflineSync()
      }
    })

    // Listen for auth state changes
    supabase.auth.onAuthStateChange((event, session) => {
      const isAuthenticated = !!session?.user
      set({
        user: session?.user ?? null,
        isAuthenticated,
        loading: false,
      })
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (isAuthenticated) {
          useJournalStore.getState().startRealtimeSubscription()
          useJournalStore.getState().initOfflineSync()
        }
      } else if (event === 'SIGNED_OUT') {
        useJournalStore.getState().stopRealtimeSubscription()
        useJournalStore.getState().stopOfflineSync()
        useJournalStore.getState().clearAllData()
      }
    })
  },
}))
