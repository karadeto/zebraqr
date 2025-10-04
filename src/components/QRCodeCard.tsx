import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { getSession } from '../lib/supabase'
import ConfirmDialog from './ConfirmDialog'

type QRCodeItem = {
  id: string
  title?: string | null
  destinationUrl: string
  redirectUrl?: string
  qrImageData: string // base64 data URL (image/png)
  isActive: boolean
  createdAt?: string | Date
}

type Props = {
  qr: QRCodeItem
  className?: string
  onDeleted?: (id: string) => void
}

export default function QRCodeCard({ qr, className, onDeleted }: Props) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  async function withAuth() {
    const { data } = await getSession()
    const token = data.session?.access_token
    if (!token) throw new Error('Not authenticated')
    return token
  }

  async function handleDownload() {
    setError(null)
    setBusy(true)
    try {
      const token = await withAuth()
      const res = await fetch(`/api/qr/${qr.id}/download`, {
        method: 'GET',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      if (!res.ok) {
        throw new Error('Failed to download')
      }
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `qrcode-${qr.id}.png`
      document.body.appendChild(a)
      a.click()
      a.remove()
      URL.revokeObjectURL(url)
    } catch (e: any) {
      setError(e?.message || 'Download failed')
    } finally {
      setBusy(false)
    }
  }

  async function performDelete() {
    setError(null)
    setBusy(true)
    try {
      const token = await withAuth()
      const res = await fetch(`/api/qr/${qr.id}`, {
        method: 'DELETE',
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        throw new Error(data?.error || 'Delete failed')
      }
      onDeleted?.(qr.id)
    } catch (e: any) {
      setError(e?.message || 'Delete failed')
    } finally {
      setBusy(false)
      setConfirmOpen(false)
    }
  }

  return (
    <div
      className={[
        'rounded-lg border border-slate-200 bg-white p-4 shadow-sm',
        'flex flex-col sm:flex-row gap-4',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
    >
      <div className="self-start">
        <img
          src={qr.qrImageData}
          alt={qr.title || 'QR code'}
          className="h-32 w-32 rounded-md border border-slate-200 object-contain bg-white"
        />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <h3 className="text-base font-semibold text-slate-900 truncate">
            {qr.title || 'Untitled QR'}
          </h3>
          {!qr.isActive && (
            <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-medium text-red-700">
              Inactive
            </span>
          )}
        </div>

        <div className="mt-2 space-y-1 text-sm">
          <div className="text-slate-600 break-words">
            <span className="font-medium text-slate-700">Destination:</span>{' '}
            <a
              href={qr.destinationUrl}
              target="_blank"
              rel="noreferrer"
              className="text-slate-900 hover:underline break-words"
            >
              {qr.destinationUrl}
            </a>
          </div>
          {qr.redirectUrl ? (
            <div className="text-slate-600 break-words">
              <span className="font-medium text-slate-700">Redirect URL:</span>{' '}
              <a
                href={qr.redirectUrl}
                target="_blank"
                rel="noreferrer"
                className="text-slate-900 hover:underline break-words"
              >
                {qr.redirectUrl}
              </a>
            </div>
          ) : null}
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
          <Link
            to="/qr/$id"
            params={{ id: qr.id }}
            className="px-3 py-1.5 rounded-md border border-slate-300 hover:bg-slate-50"
          >
            View Details
          </Link>
          <button
            onClick={handleDownload}
            disabled={busy}
            className="px-3 py-1.5 rounded-md bg-slate-900 text-white hover:bg-slate-800 disabled:opacity-60"
          >
            Download
          </button>
          <button
            onClick={() => setConfirmOpen(true)}
            disabled={busy}
            className="px-3 py-1.5 rounded-md border border-red-300 text-red-700 hover:bg-red-50 disabled:opacity-60"
          >
            Delete
          </button>
        </div>

        {error ? (
          <div className="mt-2 text-sm text-red-600">{error}</div>
        ) : null}
      </div>
      <ConfirmDialog
        open={confirmOpen}
        title="Delete QR code?"
        description="This will permanently remove the QR code and disable its redirect."
        confirmText={busy ? 'Deleting…' : 'Delete'}
        cancelText="Cancel"
        onConfirm={performDelete}
        onCancel={() => !busy && setConfirmOpen(false)}
        disabled={busy}
      />
    </div>
  )
}
