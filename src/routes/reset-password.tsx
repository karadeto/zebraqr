import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import Loading from '../components/Loading'
import { getSession, updatePassword } from '../lib/supabase'

export const Route = createFileRoute('/reset-password')({
  head: () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const url = `${origin}/reset-password`
    return {
      meta: [
        { title: 'Reset Password | ZebraQR' },
        { name: 'robots', content: 'noindex,nofollow' },
      ],
      links: [{ rel: 'canonical', href: url }],
    }
  },
  component: ResetPasswordPage,
})

function ResetPasswordPage() {
  const router = useRouter()
  const [initializing, setInitializing] = useState(true)
  const [hasSession, setHasSession] = useState(false)
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      const { data } = await getSession()
      setHasSession(!!data.session)
      setInitializing(false)
    })()
    return () => {
      mounted = false
    }
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    if (!hasSession) {
      setError('Reset link invalid or expired. Request a new one.')
      return
    }
    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }
    if (password !== confirm) {
      setError('Passwords do not match.')
      return
    }
    setSaving(true)
    try {
      const { error } = await updatePassword(password)
      if (error) {
        setError((error as any)?.message || 'Failed to update password')
        return
      }
      setInfo('Password updated. Redirecting…')
      setTimeout(() => router.navigate({ to: '/dashboard' }), 800)
    } catch (e: any) {
      setError(e?.message || 'Failed to update password')
    } finally {
      setSaving(false)
    }
  }

  if (initializing) return <Loading message="Preparing reset…" />

  if (!hasSession) {
    return (
      <main className="mx-auto max-w-6xl px-4 py-10">
        <div className="mx-auto max-w-xl rounded border border-slate-200 bg-white p-6">
          <h1 className="text-xl font-semibold text-slate-900">
            Reset link expired
          </h1>
          <p className="mt-2 text-sm text-slate-600">
            Your reset link is invalid or has expired. Request a new password
            reset.
          </p>
          <div className="mt-4">
            <Link to="/" className="text-slate-900 hover:underline">
              Return to login
            </Link>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <div className="mx-auto max-w-md rounded border border-slate-200 bg-white p-6">
        <h1 className="text-xl font-semibold text-slate-900">
          Set a new password
        </h1>
        <p className="mt-1 text-sm text-slate-600">
          Enter your new password below.
        </p>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div>
            <label
              htmlFor="pw"
              className="block text-sm font-medium text-slate-700"
            >
              New password
            </label>
            <input
              id="pw"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none"
              placeholder="At least 8 characters"
              required
              minLength={8}
              disabled={saving}
            />
          </div>

          <div>
            <label
              htmlFor="confirm"
              className="block text-sm font-medium text-slate-700"
            >
              Confirm password
            </label>
            <input
              id="confirm"
              type="password"
              value={confirm}
              onChange={(e) => setConfirm(e.target.value)}
              className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none"
              placeholder="Re-enter password"
              required
              minLength={8}
              disabled={saving}
            />
          </div>

          {error ? (
            <div className="text-sm text-red-600">{error}</div>
          ) : info ? (
            <div className="text-sm text-emerald-600">{info}</div>
          ) : null}

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
          >
            {saving ? 'Saving…' : 'Update Password'}
          </button>
        </form>
      </div>
    </main>
  )
}
