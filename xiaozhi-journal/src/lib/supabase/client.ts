import { createBrowserClient } from '@supabase/ssr'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables')
}

/**
 * Singleton Supabase browser client for Client Components.
 * All callers share the same instance — no per-render instantiation.
 */
export const supabase = createBrowserClient(supabaseUrl, supabaseAnonKey)

/**
 * Factory function — use when you need a fresh instance (e.g. tests).
 */
export function createClient() {
  return createBrowserClient(supabaseUrl, supabaseAnonKey)
}
