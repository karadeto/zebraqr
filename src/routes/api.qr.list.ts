import { createFileRoute } from '@tanstack/react-router'
import { dbForRequest } from '../lib/db'
import { getSupabaseEnv } from '../lib/env'

async function getUserIdFromAuth(request: Request): Promise<string | null> {
  const auth = request.headers.get('authorization') || ''
  const token = auth?.startsWith('Bearer ')
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

export const Route = createFileRoute('/api/qr/list')({
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

          const url = new URL(request.url)
          const page = Math.max(
            1,
            parseInt(url.searchParams.get('page') || '1', 10),
          )
          const limitRaw = parseInt(url.searchParams.get('limit') || '20', 10)
          const limit = Math.min(
            100,
            Math.max(1, isNaN(limitRaw) ? 20 : limitRaw),
          )
          const skip = (page - 1) * limit

          const { client } = dbForRequest(request)

          // Get total count using Supabase REST (exact count header)
          const { count: total, error: countError } = await client
            .from('qr_codes')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', userId)
          if (countError) {
            console.error('Count error:', countError)
            return new Response(
              JSON.stringify({ error: 'Failed to count items' }),
              { status: 500, headers: { 'Content-Type': 'application/json' } },
            )
          }

          // Get paginated items
          const { data: rows, error: listError } = await client
            .from('qr_codes')
            .select('*')
            .eq('user_id', userId)
            .order('created_at', { ascending: false })
            .range(skip, skip + limit - 1)

          if (listError) {
            console.error('List error:', listError)
            return new Response(
              JSON.stringify({ error: 'Failed to load items' }),
              { status: 500, headers: { 'Content-Type': 'application/json' } },
            )
          }

          const totalPages = Math.max(1, Math.ceil(total / limit))
          const origin = url.origin

          const qrCodesData = (rows || []).map((i) => ({
            id: i.id,
            userId: i.user_id,
            title: i.title,
            shortCode: i.short_code,
            destinationUrl: i.destination_url,
            qrImageData: i.qr_image_data,
            isActive: i.is_active,
            createdAt: i.created_at,
            updatedAt: i.updated_at,
            redirectUrl: `${origin}/r/${i.short_code}`,
          }))

          return new Response(
            JSON.stringify({
              qrCodes: qrCodesData,
              pagination: { page, limit, total, totalPages },
            }),
            { status: 200, headers: { 'Content-Type': 'application/json' } },
          )
        } catch (err) {
          console.error('Error in api.qr.list:', err)
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
