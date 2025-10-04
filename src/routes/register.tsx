import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { useEffect } from 'react'
import AuthForm from '../components/AuthForm'
import Loading from '../components/Loading'
import { useAuth } from '../lib/auth-context'

export const Route = createFileRoute('/register')({
  head: () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const url = `${origin}/register`
    return {
      meta: [
        { title: 'Register | Zebra QR' },
        { name: 'robots', content: 'noindex,follow' },
      ],
      links: [{ rel: 'canonical', href: url }],
    }
  },
  component: RegisterPage,
})

function RegisterPage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && user) {
      router.navigate({ to: '/dashboard' })
    }
  }, [loading, user, router])

  if (loading) return <Loading message="Preparing your experience…" />

  return (
    <main className="mx-auto max-w-6xl px-4 py-10">
      <section className="mx-auto max-w-2xl text-center">
        <h1 className="text-3xl font-semibold text-slate-900">
          Create your account
        </h1>
        <p className="mt-2 text-slate-600">
          Sign up to generate and manage dynamic QR codes.
        </p>
        <ul className="mt-4 inline-block text-left text-slate-700 list-disc list-inside text-sm">
          <li>Update destinations anytime</li>
          <li>Fast redirects with a short code</li>
          <li>Minimal, distraction-free interface</li>
        </ul>
      </section>

      <section className="mt-8 flex justify-center">
        <AuthForm mode="register" className="w-full" />
      </section>
    </main>
  )
}
