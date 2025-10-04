import { useState } from 'react'
import { getSession } from '../lib/supabase'

type Props = {
  onCreated?: (qr: any) => void
  className?: string
  defaultTitle?: string
  defaultUrl?: string
}

function isValidUrl(value: string) {
  try {
    const u = new URL(value)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

export default function QRCodeForm({
  onCreated,
  className,
  defaultTitle = '',
  defaultUrl = '',
}: Props) {
  const [title, setTitle] = useState(defaultTitle)
  const [destinationUrl, setDestinationUrl] = useState(defaultUrl)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)

    const url = destinationUrl.trim()
    if (!url || !isValidUrl(url)) {
      setError('Enter a valid URL (http or https).')
      return
    }

    setLoading(true)
    try {
      const { data: sessionData, error: sessionError } = await getSession()
      const token = sessionData?.session?.access_token
      if (sessionError || !token) {
        setError('You must be logged in to create QR codes.')
        return
      }

      const res = await fetch('/api/qr/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: title.trim() || undefined, destinationUrl: url }),
      })

      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data?.error || 'Failed to create QR code.')
        return
      }

      onCreated?.(data)
      // If no handler, clear form as a basic UX signal
      if (!onCreated) {
        setTitle('')
        setDestinationUrl('')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className={['w-full max-w-lg', className].filter(Boolean).join(' ')}>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-900">Create a QR Code</h2>
        <p className="mt-1 text-sm text-slate-500">Dynamic redirect-based QR code</p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-slate-700">
            Title (optional)
          </label>
          <input
            id="title"
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none"
            placeholder="My campaign QR"
            disabled={loading}
          />
        </div>

        <div>
          <label htmlFor="destinationUrl" className="block text-sm font-medium text-slate-700">
            Destination URL
          </label>
          <input
            id="destinationUrl"
            type="url"
            value={destinationUrl}
            onChange={(e) => setDestinationUrl(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none"
            placeholder="https://example.com/landing"
            disabled={loading}
            required
          />
          <p className="mt-1 text-xs text-slate-500">Must start with http:// or https://</p>
        </div>

        {error ? <div className="text-sm text-red-600">{error}</div> : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {loading ? 'Generating…' : 'Generate QR Code'}
        </button>
      </div>
    </form>
  )
}

