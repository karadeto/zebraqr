import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useAuth } from '../../lib/auth-context'
import Loading from '../../components/Loading'
import QRCodeForm from '../../components/QRCodeForm'
import { getSession } from '../../lib/supabase'

type CreatedQR = {
  id: string
  title?: string | null
  shortCode: string
  destinationUrl: string
  qrImageData: string
  isActive: boolean
  createdAt?: string
  updatedAt?: string
  redirectUrl?: string
}

export const Route = createFileRoute('/qr/create')({
  head: () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const url = `${origin}/qr/create`
    return {
      meta: [
        { title: 'Create QR Code | ZebraQR' },
        { name: 'robots', content: 'noindex,nofollow' },
      ],
      links: [{ rel: 'canonical', href: url }],
    }
  },
  component: CreateQRPage,
})

function CreateQRPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const [created, setCreated] = useState<CreatedQR | null>(null)
  const [downloading, setDownloading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!loading && !user) {
      router.navigate({ to: '/' })
    }
  }, [loading, user, router])

  if (loading) return <Loading message="Loading…" />

  async function handleDownload() {
    if (!created) return
    setError(null)
    setDownloading(true)
    try {
      const { data } = await getSession()
      const token = data.session?.access_token
      if (!token) throw new Error('Not authenticated')

      const res = await fetch(`/api/qr/${created.id}/download`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
      })
      if (!res.ok) throw new Error('Failed to download')

      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `qrcode-${created.id}.png`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e: any) {
      setError(e?.message || 'Download failed')
    } finally {
      setDownloading(false)
    }
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">
          Create QR Code
        </h1>
        <Link
          to="/dashboard"
          className="text-sm text-slate-700 hover:underline"
        >
          ← Back to dashboard
        </Link>
      </div>

      {!created ? (
        <section className="mt-6 flex justify-center">
          <QRCodeForm
            onCreated={(data: any) => setCreated(data as CreatedQR)}
          />
        </section>
      ) : (
        <section className="mt-6">
          <div className="mx-auto max-w-xl rounded-lg border border-slate-200 bg-white p-5">
            <div className="text-center">
              <img
                src={created.qrImageData}
                alt={created.title || 'QR code'}
                className="mx-auto h-64 w-64 rounded-md border border-slate-200 object-contain bg-white"
              />
              <h2 className="mt-4 text-lg font-semibold text-slate-900">
                {created.title || 'QR code created!'}
              </h2>
              {created.redirectUrl ? (
                <p className="mt-1 text-sm text-slate-600 break-words">
                  Redirect URL:{' '}
                  <a
                    href={created.redirectUrl}
                    className="text-slate-900 hover:underline"
                    target="_blank"
                    rel="noreferrer"
                  >
                    {created.redirectUrl}
                  </a>
                </p>
              ) : null}
              <p className="mt-1 text-sm text-slate-600 break-words">
                Destination:{' '}
                <a
                  href={created.destinationUrl}
                  className="text-slate-900 hover:underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  {created.destinationUrl}
                </a>
              </p>
            </div>

            {error ? (
              <div className="mt-3 rounded border border-red-200 bg-red-50 p-2 text-sm text-red-800">
                {error}
              </div>
            ) : null}

            <div className="mt-5 grid grid-cols-1 gap-2 sm:grid-cols-3">
              <button
                onClick={handleDownload}
                disabled={downloading}
                className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {downloading ? 'Preparing…' : 'Download PNG'}
              </button>
              <button
                onClick={() => setCreated(null)}
                className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
              >
                Create Another
              </button>
              <Link
                to="/dashboard"
                className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-900 text-center hover:bg-slate-50"
              >
                Back to Dashboard
              </Link>
            </div>
          </div>
        </section>
      )}
    </main>
  )
}
