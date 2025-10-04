import { Link, useRouter } from '@tanstack/react-router'
import { useEffect, useState } from 'react'
import { getUser, onAuthStateChange, signOut } from '../lib/supabase'

export default function Header() {
  const router = useRouter()
  const [email, setEmail] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    getUser().then(({ data }) => {
      if (!mounted) return
      setEmail(data.user?.email ?? null)
    })

    const { data: sub } = onAuthStateChange(async (_event, session) => {
      setEmail(session?.user?.email ?? null)
    })
    return () => {
      mounted = false
      sub?.subscription?.unsubscribe()
    }
  }, [])

  async function handleLogout() {
    try {
      await signOut()
    } finally {
      router.navigate({ to: '/' })
    }
  }

  return (
    <header className="w-full border-b border-slate-200 bg-white/80 backdrop-blur supports-[backdrop-filter]:bg-white/60">
      <div className="mx-auto max-w-6xl px-4">
        <div className="h-14 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link to="/" className="flex items-center gap-2">
              <img
                src="/logo.png"
                alt="ZebraQR logo"
                className="h-7 w-7 object-contain"
                onError={(e) => {
                  // Fallback to existing public/logo192.png if logo.png not present
                  const img = e.currentTarget as HTMLImageElement
                  if (!img.dataset.fallback) {
                    img.dataset.fallback = '1'
                    img.src = '/logo192.png'
                  }
                }}
              />
              <span className="font-semibold text-slate-900">ZebraQR</span>
            </Link>
          </div>

          <nav className="flex items-center gap-3 text-sm">
            {email ? (
              <>
                <span className="hidden sm:inline text-slate-500 px-2">
                  {email}
                </span>
                <button
                  onClick={handleLogout}
                  className="px-3 py-1 rounded-md bg-slate-900 text-white hover:bg-slate-800"
                >
                  Logout
                </button>
              </>
            ) : (
              <>
                <Link to="/login" className="px-2 py-1 hover:underline">
                  Login
                </Link>
                <Link
                  to="/register"
                  className="px-3 py-1 rounded-md bg-slate-900 text-white hover:bg-slate-800"
                >
                  Register
                </Link>
              </>
            )}
          </nav>
        </div>
      </div>
    </header>
  )
}
