import { createFileRoute } from '@tanstack/react-router'
import { dbForRequest } from '../lib/db'

function extractShortCodeFromUrl(urlStr: string): string | null {
  try {
    const url = new URL(urlStr)
    const parts = url.pathname.split('/').filter(Boolean)
    // expecting /r/:shortCode => ['r', ':shortCode']
    const code = parts[1]
    return code || null
  } catch {
    return null
  }
}

function htmlPage(status: number, title: string, message: string) {
  const body = `<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <title>${title}</title>
  </head>
  <body>
    <h1>${title}</h1>
    <p>${message}</p>
    <a href="/">Return to Home</a>
  </body>
</html>`
  return new Response(body, {
    status,
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  })
}

export const Route = createFileRoute('/r/$shortCode')({
  server: {
    handlers: {
      GET: async ({ request }) => {
        try {
          const shortCode = extractShortCodeFromUrl(request.url)
          if (!shortCode) {
            return htmlPage(
              404,
              'QR Code Not Found',
              'This QR code is no longer active or does not exist.',
            )
          }

          // Anonymous Supabase client is enough due to public RLS policy
          const { client } = dbForRequest()
          const { data: record, error } = await client
            .from('qr_codes')
            .select('*')
            .eq('short_code', shortCode)
            .maybeSingle()

          if (error || !record || !record.is_active) {
            return htmlPage(
              404,
              'QR Code Not Found',
              'This QR code is no longer active or does not exist.',
            )
          }

          const dest = record.destination_url.trim()
          // Basic validation to avoid invalid Location header
          try {
            const u = new URL(dest)
            if (u.protocol !== 'http:' && u.protocol !== 'https:') {
              throw new Error('Invalid protocol')
            }
          } catch {
            return htmlPage(
              500,
              'Invalid Destination',
              'The redirect target is misconfigured.',
            )
          }

          return new Response(null, {
            status: 302,
            headers: {
              Location: dest,
              'Cache-Control': 'no-store',
            },
          })
        } catch (e) {
          console.error('Error in r.$shortCode:', e)
          return htmlPage(
            500,
            'Server Error',
            'An unexpected error occurred while processing the redirect.',
          )
        }
      },
    },
  },
})
