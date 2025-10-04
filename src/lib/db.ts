import { createClient } from '@supabase/supabase-js'
import * as schema from './db/schema'
import { getSupabaseEnv } from './env'
import type { SupabaseClient } from '@supabase/supabase-js'

export function dbForRequest(request?: Request): {
  client: SupabaseClient
} {
  const { SUPABASE_URL, SUPABASE_ANON_KEY } = getSupabaseEnv()
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
    throw new Error(
      'Supabase environment not configured. Set SUPABASE_URL and SUPABASE_ANON_KEY.',
    )
  }

  const authHeader = request?.headers.get('authorization') || undefined

  const client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
    global: {
      headers: authHeader ? { Authorization: authHeader } : undefined,
    },
  })

  return { client }
}

export { schema }
