import { createFileRoute } from '@tanstack/react-router'
import { dbForRequest } from '../lib/db'
import { getSupabaseEnv } from '../lib/env'

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

function extractIdFromUrl(urlStr: string): string | null {
  const url = new URL(urlStr)
  const parts = url.pathname.split('/').filter(Boolean)
  // expecting /api/qr/:id/download => ['api','qr',':id','download']
  const id = parts[2]
  return id || null
}

export const Route = createFileRoute('/api/qr/$id/download')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const userId = await getUserIdFromAuth(request)
          if (!userId) {
            return new Response(JSON.stringify({ error: 'Unauthorized' }), {
              status: 401,
              headers: { 'Content-Type': 'application/json' },
            })
          }

          const id = extractIdFromUrl(request.url)
          if (!id) {
            return new Response(JSON.stringify({ error: 'Invalid ID' }), {
              status: 400,
              headers: { 'Content-Type': 'application/json' },
            })
          }

          const { client } = dbForRequest(request)
          const { data: record, error } = await client
            .from('qr_codes')
            .select('*')
            .eq('id', id)
            .maybeSingle()

          if (error) {
            console.error('Fetch error:', error)
            return new Response(
              JSON.stringify({ error: 'Failed to fetch item' }),
              { status: 500, headers: { 'Content-Type': 'application/json' } },
            )
          }
          if (!record) {
            return new Response(JSON.stringify({ error: 'Not found' }), {
              status: 404,
              headers: { 'Content-Type': 'application/json' },
            })
          }
          if (record.user_id !== userId) {
            return new Response(JSON.stringify({ error: 'Forbidden' }), {
              status: 403,
              headers: { 'Content-Type': 'application/json' },
            })
          }

          const dataUrl = record.qr_image_data
          const comma = dataUrl.indexOf(',')
          const base64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl
          let binary: Uint8Array
          try {
            binary = Uint8Array.from(Buffer.from(base64, 'base64'))
          } catch {
            return new Response(
              JSON.stringify({ error: 'Invalid QR image data' }),
              {
                status: 500,
                headers: { 'Content-Type': 'application/json' },
              },
            )
          }

          const headers = new Headers()
          headers.set('Content-Type', 'image/png')
          headers.set(
            'Content-Disposition',
            `attachment; filename="qrcode-${id}.png"`,
          )

          return new Response(binary.buffer as ArrayBuffer, {
            status: 200,
            headers,
          })
        } catch (err) {
          console.error('Error in api.qr.$id.download:', err)
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
