import { useState } from 'react'
import { Link, useRouter } from '@tanstack/react-router'
import { signIn as sbSignIn, signUp as sbSignUp } from '../lib/supabase'

type AuthMode = 'login' | 'register'

type Props = {
  mode: AuthMode
  onSuccess?: (data: any) => void
  className?: string
  initialEmail?: string
  showModeToggle?: boolean
}

function isValidEmail(email: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
}

export default function AuthForm({
  mode,
  onSuccess,
  className,
  initialEmail = '',
  showModeToggle = true,
}: Props) {
  const router = useRouter()
  const [email, setEmail] = useState(initialEmail)
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [info, setInfo] = useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)

    const trimmedEmail = email.trim()
    if (!isValidEmail(trimmedEmail)) {
      setError('Please enter a valid email address.')
      return
    }
    if (!password || password.length < 8) {
      setError('Password must be at least 8 characters.')
      return
    }

    setLoading(true)
    try {
      if (mode === 'login') {
        const { data, error } = await sbSignIn(trimmedEmail, password)
        if (error) {
          setError((error as any)?.message || 'Login failed')
          return
        }
        onSuccess?.(data)
        // Default navigation if no consumer handler provided
        if (!onSuccess) {
          await router.navigate({ to: '/dashboard' })
        }
      } else {
        const { data, error } = await sbSignUp(trimmedEmail, password)
        if (error) {
          setError((error as any)?.message || 'Registration failed')
          return
        }
        // After successful registration, redirect to login with a note
        await router.navigate({
          to: '/login',
          search: { notice: 'verify-email', email: trimmedEmail },
        })
        return
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  async function handleResetPassword(e: React.MouseEvent) {
    e.preventDefault()
    setError(null)
    setInfo(null)
    const trimmedEmail = email.trim()
    if (!isValidEmail(trimmedEmail)) {
      setError('Enter your email above, then click Forgot password.')
      return
    }
    setLoading(true)
    try {
      const redirectTo =
        typeof window !== 'undefined'
          ? `${window.location.origin}/reset-password`
          : undefined
      const res = await fetch('/api/auth/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: trimmedEmail, redirectTo }),
      })
      // Always show a generic message (API does the same for security)
      if (res.ok) {
        setInfo('If the email exists, we sent reset instructions.')
      } else {
        setInfo('If the email exists, we sent reset instructions.')
      }
    } catch (err) {
      setError('Unable to request password reset right now.')
    } finally {
      setLoading(false)
    }
  }

  const opposite: AuthMode = mode === 'login' ? 'register' : 'login'
  const title =
    mode === 'login' ? 'Sign in to your account' : 'Create your account'
  const submitText = mode === 'login' ? 'Sign In' : 'Create Account'

  return (
    <form
      onSubmit={handleSubmit}
      className={['w-full max-w-sm', className].filter(Boolean).join(' ')}
    >
      <div className="mb-6">
        <h1 className="text-xl font-semibold text-slate-900">{title}</h1>
        <p className="mt-1 text-sm text-slate-500">
          Use your email and a secure password.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-sm font-medium text-slate-700"
          >
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none"
            placeholder=""
            disabled={loading}
            required
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-sm font-medium text-slate-700"
          >
            Password
          </label>
          <input
            id="password"
            type="password"
            autoComplete={
              mode === 'login' ? 'current-password' : 'new-password'
            }
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="mt-1 w-full rounded-md border border-slate-300 px-3 py-2 text-sm shadow-sm focus:border-slate-400 focus:outline-none"
            placeholder=""
            disabled={loading}
            required
            minLength={8}
          />
        </div>

        {error ? (
          <div className="text-sm text-red-600">{error}</div>
        ) : info ? (
          <div className="text-sm text-emerald-600">{info}</div>
        ) : null}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800 disabled:opacity-60"
        >
          {loading ? 'Please wait…' : submitText}
        </button>

        <div className="flex items-center justify-between text-sm">
          {showModeToggle ? (
            <span className="text-slate-600">
              {mode === 'login' ? 'No account?' : 'Already have an account?'}{' '}
              <Link
                to={opposite === 'login' ? '/login' : '/register'}
                className="font-medium text-slate-900 hover:underline"
              >
                {opposite === 'login' ? 'Sign in' : 'Register'}
              </Link>
            </span>
          ) : (
            <span />
          )}

          <button
            type="button"
            onClick={handleResetPassword}
            className="text-slate-600 hover:underline"
            disabled={loading}
          >
            Forgot password?
          </button>
        </div>
      </div>
    </form>
  )
}
