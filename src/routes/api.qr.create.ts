import { createFileRoute } from '@tanstack/react-router'
import { dbForRequest } from '../lib/db'
import { ensureUniqueShortCode, generateQRCode } from '../lib/qr'
import { getSupabaseEnv } from '../lib/env'

type Body = {
  title?: string
  destinationUrl?: string
}

function isValidHttpUrl(url: string) {
  try {
    const u = new URL(url)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

async function getUserIdFromAuth(request: Request): Promise<string | null> {
  const auth = request.headers.get('authorization') || ''
  const token = auth.startsWith('Bearer ')
    ? auth.slice('Bearer '.length).trim()
    : ''
  if (!token) return null

  const { SUPABASE_URL, SUPABASE_ANON_KEY } = getSupabaseEnv()
  if (!SUPABASE_URL || !SUPABASE_ANON_KEY) return null

  const res = await fetch(`${SUPABASE_URL}/auth/v1/user`, {
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
      apikey: SUPABASE_ANON_KEY,
    },
  })
  if (!res.ok) return null
  const user = await res.json()
  return user?.id ?? null
}

export const Route = createFileRoute('/api/qr/create')({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const userId = await getUserIdFromAuth(request)
          if (!userId) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
              status: 401,
              headers: { 'Content-Type': 'application/json' },
            })
          }

          const body = (await request.json().catch(() => ({}))) as Body
          const title = body.title?.trim() || undefined
          const destinationUrl = body.destinationUrl?.trim() || ''

          if (
            !destinationUrl ||
            !isValidHttpUrl(destinationUrl) ||
            destinationUrl.length > 2048
          ) {
            return new Response(
              JSON.stringify({
                error:
                  'Invalid destinationUrl. Must be a valid http(s) URL up to 2048 chars.',
              }),
              { status: 400, headers: { 'Content-Type': 'application/json' } },
            )
          }
          if (title && title.length > 255) {
            return new Response(
              JSON.stringify({ error: 'Title too long. Max 255 characters.' }),
              { status: 400, headers: { 'Content-Type': 'application/json' } },
            )
          }

          const origin = new URL(request.url).origin
          const { client } = dbForRequest(request)
          const shortCode = await ensureUniqueShortCode(client, 7)
          const redirectUrl = `${origin}/r/${shortCode}`
          const qrImageData = await generateQRCode(redirectUrl)

          const { data: created, error: insertError } = await client
            .from('qr_codes')
            .insert({
              user_id: userId,
              title: title || null,
              short_code: shortCode,
              destination_url: destinationUrl,
              qr_image_data: qrImageData,
              is_active: true,
              updated_at: new Date().toISOString(),
            })
            .select()
            .limit(1)

          if (insertError || !created || created.length === 0) {
            console.error('Insert error:', insertError)
            return new Response(
              JSON.stringify({ error: 'Failed to create QR code' }),
              { status: 500, headers: { 'Content-Type': 'application/json' } },
            )
          }

          const row = created[0]
          const response = {
            id: row.id,
            userId: row.user_id,
            title: row.title,
            shortCode: row.short_code,
            destinationUrl: row.destination_url,
            qrImageData: row.qr_image_data,
            isActive: row.is_active,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            redirectUrl,
          }

          return new Response(JSON.stringify(response), {
            status: 201,
            headers: { 'Content-Type': 'application/json' },
          })
        } catch (err) {
          console.error('Error in api.qr.create:', err)
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
