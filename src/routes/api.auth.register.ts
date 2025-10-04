import { createFileRoute } from '@tanstack/react-router'
import { dbForRequest } from '../lib/db'

type RegisterBody = {
  email?: string
  password?: string
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export const Route = createFileRoute('/api/auth/register')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const body = (await request.json().catch(() => ({}))) as RegisterBody
          const email = body.email?.trim() || ''
          const password = body.password || ''

          if (
            !email ||
            !isValidEmail(email) ||
            !password ||
            password.length < 8
          ) {
            return new Response(
              JSON.stringify({
                error:
                  'Invalid input. Provide a valid email and password (min 8 chars).',
              }),
              { status: 400, headers: { 'Content-Type': 'application/json' } },
            )
          }

          const { client } = dbForRequest()
          const origin = new URL(request.url).origin
          const { data, error } = await client.auth.signUp({
            email,
            password,
            options: {
              emailRedirectTo: origin,
            },
          })

          if (error) {
            const msg = (error as any)?.message?.toLowerCase?.() || ''
            const isDup =
              msg.includes('already registered') ||
              msg.includes('already exists')
            const status = isDup ? 409 : (error as any)?.status || 500
            return new Response(
              JSON.stringify({
                error: isDup
                  ? 'Email already registered'
                  : 'Registration failed',
                details: error,
              }),
              { status, headers: { 'Content-Type': 'application/json' } },
            )
          }

          return new Response(JSON.stringify(data), {
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
