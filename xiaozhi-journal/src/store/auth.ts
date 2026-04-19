import { create } from 'zustand'
import { supabase } from '@/lib/supabase'
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
    // Check current session on init
    supabase.auth.getSession().then(({ data: { session } }) => {
      set({ user: session?.user ?? null, isAuthenticated: !!session?.user, loading: false })
    })

    // Listen for auth state changes
    supabase.auth.onAuthStateChange((_event, session) => {
      set({
        user: session?.user ?? null,
        isAuthenticated: !!session?.user,
        loading: false,
      })
    })
  },
}))
