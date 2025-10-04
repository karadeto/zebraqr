import { createFileRoute } from '@tanstack/react-router'
import { resetPassword } from '../lib/supabase'

type Body = {
  email?: string
  redirectTo?: string
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export const Route = createFileRoute('/api/auth/reset-password')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json().catch(() => ({}))) as Body
          const email = body.email?.trim() || ''
          const redirectTo = body.redirectTo

          if (!email || !isValidEmail(email)) {
            return new Response(JSON.stringify({ error: 'Invalid email' }), {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            })
          }

          const { error } = await resetPassword(email, redirectTo)

          // Security: do not reveal whether the email exists.
          // Only escalate to 500 for server/unknown failures (e.g., network).
          if (error && (error as any)?.status && (error as any).status >= 500) {
            return new Response(
              JSON.stringify({ error: 'Internal server error' }),
              {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
              },
            )
          }

          return new Response(
            JSON.stringify({
              message: 'If that email exists, we sent reset instructions.',
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          )
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
