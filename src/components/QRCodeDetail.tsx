import { useMemo, useState } from 'react'
import { Link } from '@tanstack/react-router'
import { getSession } from '../lib/supabase'
import ConfirmDialog from './ConfirmDialog'

type QRCodeItem = {
  id: string
  title?: string | null
  shortCode: string
  destinationUrl: string
  qrImageData: string
  isActive: boolean
  createdAt?: string | Date
  updatedAt?: string | Date
  redirectUrl?: string
}

type Props = {
  qr: QRCodeItem
  className?: string
  onUpdated?: (qr: Partial<QRCodeItem> & { id: string }) => void
  onDeleted?: (id: string) => void
}

function isValidUrl(value: string) {
  try {
    const u = new URL(value)
    return u.protocol === 'http:' || u.protocol === 'https:'
  } catch {
    return false
  }
}

export default function QRCodeDetail({
  qr,
  className,
  onUpdated,
  onDeleted,
}: Props) {
  const [dest, setDest] = useState(qr.destinationUrl)
  const [saving, setSaving] = useState(false)
  const [busyDelete, setBusyDelete] = useState(false)
  const [busyDownload, setBusyDownload] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)
  const [confirmOpen, setConfirmOpen] = useState(false)

  const created = useMemo(
    () => (qr.createdAt ? new Date(qr.createdAt) : null),
    [qr.createdAt],
  )
  const updated = useMemo(
    () => (qr.updatedAt ? new Date(qr.updatedAt) : null),
    [qr.updatedAt],
  )

  async function withAuth() {
    const { data } = await getSession()
    const token = data.session?.access_token
    if (!token) throw new Error('Not authenticated')
    return token
  }

  async function handleSave() {
    setError(null)
    setInfo(null)
    const url = dest.trim()
    if (!url || !isValidUrl(url)) {
      setError('Enter a valid URL (http or https).')
      return
    }
    setSaving(true)
    try {
      const token = await withAuth()
      const res = await fetch(`/api/qr/${qr.id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ destinationUrl: url }),
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data?.error || 'Failed to update destination.')
        return
      }
      onUpdated?.({ id: qr.id, destinationUrl: url })
      setInfo('Destination updated.')
    } catch (e: any) {
      setError(e?.message || 'Update failed')
    } finally {
      setSaving(false)
    }
  }

  async function performDelete() {
    setError(null)
    setInfo(null)
    setBusyDelete(true)
    try {
      const token = await withAuth()
      const res = await fetch(`/api/qr/${qr.id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json().catch(() => ({}))
      if (!res.ok) {
        setError(data?.error || 'Delete failed')
        return
      }
      onDeleted?.(qr.id)
    } catch (e: any) {
      setError(e?.message || 'Delete failed')
    } finally {
      setBusyDelete(false)
      setConfirmOpen(false)
    }
  }

  async function handleDownload() {
    setError(null)
    setInfo(null)
    setBusyDownload(true)
    try {
      const token = await withAuth()
      const res = await fetch(`/api/qr/${qr.id}/download`, {
        method: 'GET',
        headers: { Authorization: `Bearer ${token}` },
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
      setBusyDownload(false)
    }
  }

  return (
    <div className={['w-full', className].filter(Boolean).join(' ')}>
      <div className="flex flex-col md:flex-row gap-6">
        <div className="md:w-64 md:flex-shrink-0">
          <img
            src={qr.qrImageData}
            alt={qr.title || 'QR code'}
            className="w-64 h-64 rounded-lg border border-slate-200 object-contain bg-white"
          />
          <div className="mt-3 flex gap-2">
            <button
              onClick={handleDownload}
              disabled={busyDownload}
              className="flex-1 rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
            >
              {busyDownload ? 'Downloading…' : 'Download PNG'}
            </button>
            <button
              onClick={() => setConfirmOpen(true)}
              disabled={busyDelete}
              className="flex-1 rounded-md border border-red-300 px-3 py-2 text-sm font-medium text-red-700 hover:bg-red-50 disabled:opacity-60"
            >
              {busyDelete ? 'Deleting…' : 'Delete'}
            </button>
          </div>
        </div>

        <div className="flex-1 min-w-0">
          <div>
            <h2 className="text-xl font-semibold text-slate-900">
              {qr.title || 'Untitled QR'}
            </h2>
            <div className="mt-1 flex items-center gap-2 text-sm">
              {!qr.isActive && (
                <span className="inline-flex items-center rounded-full bg-red-100 px-2 py-0.5 text-[11px] font-medium text-red-700">
                  Inactive
                </span>
              )}
            </div>
          </div>

          <div className="mt-4 space-y-2 text-sm">
            <div>
              <span className="font-medium text-slate-700">QR ID:</span>{' '}
              <span className="text-slate-600 break-all">{qr.id}</span>
            </div>
            <div>
              <span className="font-medium text-slate-700">Short code:</span>{' '}
              <span className="text-slate-600">{qr.shortCode}</span>
            </div>
            {qr.redirectUrl ? (
              <div className="break-words">
                <span className="font-medium text-slate-700">
                  Redirect URL:
                </span>{' '}
                <a
                  href={qr.redirectUrl}
                  className="text-slate-900 hover:underline"
                  target="_blank"
                  rel="noreferrer"
                >
                  {qr.redirectUrl}
                </a>
              </div>
            ) : null}
            <div className="break-words">
              <span className="font-medium text-slate-700">Destination:</span>{' '}
              <a
                href={qr.destinationUrl}
                className="text-slate-900 hover:underline"
                target="_blank"
                rel="noreferrer"
              >
                {qr.destinationUrl}
              </a>
            </div>
            {created ? (
              <div>
                <span className="font-medium text-slate-700">Created:</span>{' '}
                <span className="text-slate-600">
                  {created.toLocaleString()}
                </span>
              </div>
            ) : null}
            {updated ? (
              <div>
                <span className="font-medium text-slate-700">Updated:</span>{' '}
                <span className="text-slate-600">
                  {updated.toLocaleString()}
                </span>
              </div>
            ) : null}
          </div>

          <div className="mt-6">
            <label
              htmlFor="dest"
              className="block text-sm font-medium text-slate-700"
            >
              Edit destination URL
            </label>
            <div className="mt-1 flex gap-2">
              <input
                id="dest"
                type="url"
                value={dest}
                onChange={(e) => setDest(e.target.value)}
                className="flex-1 rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none"
                placeholder="https://example.com/new-destination"
                disabled={saving}
              />
              <button
                onClick={handleSave}
                disabled={saving}
                className="whitespace-nowrap rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
              >
                {saving ? 'Saving…' : 'Save'}
              </button>
            </div>
          </div>

          {error ? (
            <div className="mt-3 text-sm text-red-600">{error}</div>
          ) : info ? (
            <div className="mt-3 text-sm text-emerald-600">{info}</div>
          ) : null}
        </div>
      </div>
      <ConfirmDialog
        open={confirmOpen}
        title="Delete QR code?"
        description="This will permanently remove the QR code and disable its redirect."
        confirmText={busyDelete ? 'Deleting…' : 'Delete'}
        cancelText="Cancel"
        onConfirm={performDelete}
        onCancel={() => !busyDelete && setConfirmOpen(false)}
        disabled={busyDelete}
      />
    </div>
  )
}
