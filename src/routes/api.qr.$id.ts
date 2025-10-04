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
  // expecting /api/qr/:id => ['api','qr',':id']
  const id = parts[2]
  return id || null
}

export const Route = createFileRoute('/api/qr/$id')({
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

          const origin = new URL(request.url).origin
          const redirectUrl = `${origin}/r/${record.short_code}`
          const response = {
            id: record.id,
            userId: record.user_id,
            title: record.title,
            shortCode: record.short_code,
            destinationUrl: record.destination_url,
            qrImageData: record.qr_image_data,
            isActive: record.is_active,
            createdAt: record.created_at,
            updatedAt: record.updated_at,
            redirectUrl,
          }

          return new Response(JSON.stringify(response), {
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        } catch (err) {
          console.error('Error in api.qr.$id GET:', err)
          return new Response(
            JSON.stringify({ error: 'Internal server error' }),
            {
              status: 500,
              headers: { 'Content-Type': 'application/json' },
            },
          )
        }
      },
      DELETE: async ({ request }) => {
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
          const { error: delError } = await client
            .from('qr_codes')
            .delete()
            .eq('id', id)

          if (delError) {
            console.error('Delete error:', delError)
            return new Response(
              JSON.stringify({ error: 'Failed to delete' }),
              { status: 500, headers: { 'Content-Type': 'application/json' } },
            )
          }

          return new Response(
            JSON.stringify({ message: 'QR code deleted successfully', id }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          )
        } catch (err) {
          console.error('Error in api.qr.$id DELETE:', err)
          return new Response(
            JSON.stringify({ error: 'Internal server error' }),
            {
              status: 500,
              headers: { 'Content-Type': 'application/json' },
            },
          )
        }
      },
      PATCH: async ({ request }) => {
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

          const { destinationUrl } = (await request
            .json()
            .catch(() => ({}))) as {
            destinationUrl?: string
          }
          const nextUrl = destinationUrl?.trim() || ''
          if (!nextUrl) {
            return new Response(
              JSON.stringify({ error: 'destinationUrl is required' }),
              {
                status: 400,
                headers: { 'Content-Type': 'application/json' },
              },
            )
          }
          let valid = false
          try {
            const u = new URL(nextUrl)
            valid = u.protocol === 'http:' || u.protocol === 'https:'
          } catch {}
          if (!valid || nextUrl.length > 2048) {
            return new Response(
              JSON.stringify({
                error:
                  'Invalid destinationUrl. Must be a valid http(s) URL up to 2048 chars.',
              }),
              { status: 400, headers: { 'Content-Type': 'application/json' } },
            )
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
          const { data: updated, error: updError } = await client
            .from('qr_codes')
            .update({
              destination_url: nextUrl,
              updated_at: new Date().toISOString(),
            })
            .eq('id', id)
            .select()
            .limit(1)

          if (updError || !updated || updated.length === 0) {
            console.error('Update error:', updError)
            return new Response(
              JSON.stringify({ error: 'Failed to update' }),
              { status: 500, headers: { 'Content-Type': 'application/json' } },
            )
          }

          const origin = new URL(request.url).origin
          const redirectUrl = `${origin}/r/${updated[0].short_code}`
          const row = updated[0]
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
            status: 200,
            headers: { 'Content-Type': 'application/json' },
          })
        } catch (err) {
          console.error('Error in api.qr.$id PATCH:', err)
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
