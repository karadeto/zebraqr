import { createClient } from '@supabase/supabase-js'
import { getSupabaseEnv } from './env'
import type { Session, SupabaseClient, User } from '@supabase/supabase-js'

let _client: SupabaseClient | null = null

export function getSupabase(): SupabaseClient {
  if (_client) return _client
  const { SUPABASE_URL, SUPABASE_ANON_KEY } = getSupabaseEnv()
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error('Supabase env vars are not set. Check your .env values.')
  }
  _client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  })
  return _client
}

// Auth helpers
export async function signUp(email: string, password: string) {
  const supabase = getSupabase()
  return supabase.auth.signUp({ email, password })
}

export async function signIn(email: string, password: string) {
  const supabase = getSupabase()
  return supabase.auth.signInWithPassword({ email, password })
}

export async function signOut() {
  const supabase = getSupabase()
  return supabase.auth.signOut()
}

export async function resetPassword(email: string, redirectTo?: string) {
  const supabase = getSupabase()
  return supabase.auth.resetPasswordForEmail(email, {
    redirectTo,
  })
}

export async function getUser(): Promise<{
  data: { user: User | null }
  error: any
}> {
  const supabase = getSupabase()
  return supabase.auth.getUser()
}

export async function getSession(): Promise<{
  data: { session: Session | null }
  error: any
}> {
  const supabase = getSupabase()
  return supabase.auth.getSession()
}

export function onAuthStateChange(
  callback: Parameters<SupabaseClient['auth']['onAuthStateChange']>[0],
) {
  const supabase = getSupabase()
  return supabase.auth.onAuthStateChange(callback)
}

export async function updatePassword(newPassword: string) {
  const supabase = getSupabase()
  return supabase.auth.updateUser({ password: newPassword })
}

export type { Session, User }
