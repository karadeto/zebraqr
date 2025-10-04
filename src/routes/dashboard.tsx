import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { useEffect, useMemo, useState } from 'react'
import { useAuth } from '../lib/auth-context'
import Loading from '../components/Loading'
import QRCodeCard from '../components/QRCodeCard'
import { getSession } from '../lib/supabase'

type QRItem = {
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

type ListResponse = {
  qrCodes: Array<QRItem>
  pagination: { page: number; limit: number; total: number; totalPages: number }
}

export const Route = createFileRoute('/dashboard')({
  head: () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const url = `${origin}/dashboard`
    return {
      meta: [
        { title: 'Dashboard | ZebraQR' },
        { name: 'robots', content: 'noindex,nofollow' },
      ],
      links: [{ rel: 'canonical', href: url }],
    }
  },
  component: DashboardPage,
})

function DashboardPage() {
  const router = useRouter()
  const { user, loading: authLoading } = useAuth()

  const [items, setItems] = useState<Array<QRItem> | null>(null)
  const [page, setPage] = useState(1)
  const [limit] = useState(12)
  const [totalPages, setTotalPages] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!authLoading && !user) {
      router.navigate({ to: '/' })
    }
  }, [authLoading, user, router])

  useEffect(() => {
    if (!user || authLoading) return
    let cancelled = false
    async function run() {
      setLoading(true)
      setError(null)
      try {
        const { data } = await getSession()
        const token = data.session?.access_token
        if (!token) throw new Error('Not authenticated')
        const res = await fetch(`/api/qr/list?page=${page}&limit=${limit}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        const json = await res.json().catch(() => ({}))
        if (!res.ok) {
          throw new Error(json?.error || 'Failed to load QR codes')
        }
        if (cancelled) return
        setItems(json.qrCodes || [])
        setTotalPages(json.pagination?.totalPages || 1)
      } catch (e: any) {
        if (cancelled) return
        setError(e?.message || 'Failed to load QR codes')
        setItems([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    run()
    return () => {
      cancelled = true
    }
  }, [user, authLoading, page, limit])

  const hasItems = useMemo(() => (items?.length || 0) > 0, [items])

  function handleDeleted(id: string) {
    setItems((prev) => (prev ? prev.filter((i) => i.id !== id) : prev))
  }

  if (authLoading || loading)
    return <Loading message="Loading your dashboard…" />
  if (error) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="mx-auto max-w-xl rounded border border-red-200 bg-red-50 p-4 text-red-800">
          {error}
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-8">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-slate-900">Your QR Codes</h1>
        <Link
          to="/qr/create"
          className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
        >
          Create New QR Code
        </Link>
      </div>

      {!hasItems ? (
        <section className="mt-10 text-center text-slate-600">
          <p>No QR codes yet.</p>
          <Link
            to="/qr/create"
            className="mt-3 inline-block rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
          >
            Create your first QR code
          </Link>
        </section>
      ) : (
        <section className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {items!.map((qr) => (
            <QRCodeCard key={qr.id} qr={qr} onDeleted={handleDeleted} />
          ))}
        </section>
      )}

      {totalPages > 1 && (
        <nav className="mt-8 flex items-center justify-center gap-3 text-sm">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="rounded-md border border-slate-300 px-3 py-1.5 disabled:opacity-50 hover:bg-slate-50"
          >
            Previous
          </button>
          <span className="text-slate-600">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="rounded-md border border-slate-300 px-3 py-1.5 disabled:opacity-50 hover:bg-slate-50"
          >
            Next
          </button>
        </nav>
      )}
    </main>
  )
}
