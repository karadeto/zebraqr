import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { useAuth } from '../lib/auth-context'
import Loading from '../components/Loading'
import QRCodeDetail from '../components/QRCodeDetail'
import { getSession } from '../lib/supabase'

type QRDetail = {
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

export const Route = createFileRoute('/qr/$id')({
  head: () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const routerUrl = typeof window !== 'undefined' ? window.location.href : ''
    return {
      meta: [
        { title: 'QR Details | ZebraQR' },
        { name: 'robots', content: 'noindex,nofollow' },
      ],
      links: [{ rel: 'canonical', href: routerUrl || `${origin}/qr` }],
    }
  },
  component: QRDetailPage,
})

function QRDetailPage() {
  const router = useRouter()
  const params = Route.useParams()
  const { user, loading: authLoading } = useAuth()

  const [qr, setQr] = useState<QRDetail | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!authLoading && !user) {
      router.navigate({ to: '/' })
    }
  }, [authLoading, user, router])

  useEffect(() => {
    let cancelled = false
    async function run() {
      setLoading(true)
      setError(null)
      try {
        const { data } = await getSession()
        const token = data.session?.access_token
        if (!token) throw new Error('Not authenticated')
        const res = await fetch(`/api/qr/${params.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const json = await res.json().catch(() => ({}))
        if (!res.ok) {
          const code = res.status
          if (code === 404) throw new Error('QR code not found')
          if (code === 403)
            throw new Error('You do not have access to this QR code')
          throw new Error(json?.error || 'Failed to load QR code')
        }
        if (cancelled) return
        setQr(json as QRDetail)
      } catch (e: any) {
        if (cancelled) return
        setError(e?.message || 'Failed to load QR code')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    if (user && params.id) run()
    return () => {
      cancelled = true
    }
  }, [user, authLoading, params.id])

  function handleUpdated(patch: { id: string; destinationUrl?: string }) {
    setQr((prev) => (prev ? { ...prev, ...patch } : prev))
  }

  async function handleDeleted() {
    // After delete, route back to dashboard
    router.navigate({ to: '/dashboard' })
  }

  if (authLoading || loading) return <Loading message="Loading QR details…" />

  if (error) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="mx-auto max-w-xl rounded border border-red-200 bg-red-50 p-4 text-red-800">
          {error}
        </div>
        <div className="mt-4 text-center">
          <Link to="/dashboard" className="text-slate-700 hover:underline">
            ← Back to dashboard
          </Link>
        </div>
      </main>
    )
  }

  if (!qr) return null

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">QR Details</h1>
        <Link
          to="/dashboard"
          className="text-sm text-slate-700 hover:underline"
        >
          ← Back to dashboard
        </Link>
      </div>

      <section className="mt-6">
        <QRCodeDetail
          qr={qr}
          onUpdated={handleUpdated}
          onDeleted={handleDeleted}
        />
      </section>
    </main>
  )
}
