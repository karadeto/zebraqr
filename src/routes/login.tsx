import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { useEffect } from 'react'
import AuthForm from '../components/AuthForm'
import Loading from '../components/Loading'
import { useAuth } from '../lib/auth-context'

export const Route = createFileRoute('/login')({
  head: () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const url = `${origin}/login`
    return {
      meta: [
        { title: 'Login | ZebraQR' },
        { name: 'robots', content: 'noindex,follow' },
      ],
      links: [{ rel: 'canonical', href: url }],
    }
  },
  component: LoginPage,
})

function LoginPage() {
  const router = useRouter()
  const { user, loading } = useAuth()
  const search: any = (router as any)?.latestLocation?.search ?? {}
  const showVerifyNote = search?.notice === 'verify-email'
  const initialEmail = typeof search?.email === 'string' ? search.email : ''

  useEffect(() => {
    if (!loading && user) {
      router.navigate({ to: '/dashboard' })
    }
  }, [loading, user, router])

  if (loading) return <Loading message="Preparing your experience…" />

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <section className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-semibold text-slate-900">Welcome back</h1>
        <p className="mt-2 text-slate-600">Sign in to manage your QR codes.</p>
      </section>

      <section className="mt-8 flex justify-center">
        <div className="w-full max-w-sm">
          {showVerifyNote && (
            <div className="mb-4 rounded border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-800">
              Registration successful. Please verify your email, then sign in.
            </div>
          )}
          <AuthForm
            mode="login"
            onSuccess={() => router.navigate({ to: '/dashboard' })}
            className="w-full"
            initialEmail={initialEmail}
          />
        </div>
      </section>
    </main>
  )
}
