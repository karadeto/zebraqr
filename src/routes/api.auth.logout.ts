import { createFileRoute } from '@tanstack/react-router'
import { getSupabaseEnv } from '../lib/env'

// removed readEnv in favor of getSupabaseEnv

export const Route = createFileRoute('/api/auth/logout')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const auth = request.headers.get('authorization') || ''
        const token = auth.startsWith('Bearer ')
          ? auth.slice('Bearer '.length).trim()
          : ''

        if (!token) {
          return new Response(
            JSON.stringify({
              error: 'Missing or invalid Authorization header',
            }),
            {
              status: 401,
              headers: { 'Content-Type': 'application/json' },
            },
          )
        }

        const { SUPABASE_URL, SUPABASE_ANON_KEY } = getSupabaseEnv()

        if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
          return new Response(
            JSON.stringify({
              error: 'Server misconfiguration: Supabase env vars not set',
            }),
            {
              status: 500,
              headers: { 'Content-Type': 'application/json' },
            },
          )
        }

        try {
          const res = await fetch(`${SUPABASE_URL}/auth/v1/logout`, {
            method: 'POST',
            headers: {
              Authorization: `Bearer ${token}`,
              apikey: SUPABASE_ANON_KEY,
            },
          })

          if (res.status === 401) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
              status: 401,
              headers: { 'Content-Type': 'application/json' },
            })
          }

          if (!res.ok) {
            return new Response(JSON.stringify({ error: 'Logout failed' }), {
              status: 500,
              headers: { 'Content-Type': 'application/json' },
            })
          }

          return new Response(JSON.stringify({ success: true }), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        } catch (err) {
          return new Response(
            JSON.stringify({ error: 'Internal server error' }),
            {
              status: 500,
              headers: { 'Content-Type': 'application/json' },
            },
          )
        }
      },
    },
  },
})
