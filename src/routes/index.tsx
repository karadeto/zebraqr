import { Link, createFileRoute, useRouter } from '@tanstack/react-router'
import { useEffect } from 'react'
import Loading from '../components/Loading'
import { useAuth } from '../lib/auth-context'

export const Route = createFileRoute('/')({
  head: () => {
    const origin = typeof window !== 'undefined' ? window.location.origin : ''
    const pageUrl = `${origin}/`
    const title = 'Free QR Code Generator | ZebraQR'
    const description =
      'Create dynamic QR codes with editable short links. Download PNGs and update destinations anytime.'
    const ogImage = `${origin || ''}/logo512.png`
    const ld = {
      '@context': 'https://schema.org',
      '@type': 'WebSite',
      name: 'ZebraQR',
      url: origin || 'https://example.com',
      description,
      potentialAction: {
        '@type': 'Action',
        name: 'Create QR code',
        target: `${origin || 'https://example.com'}/register`,
      },
    }
    const appLd = {
      '@context': 'https://schema.org',
      '@type': 'SoftwareApplication',
      name: 'ZebraQR',
      applicationCategory: 'UtilityApplication',
      operatingSystem: 'Web',
      offers: { '@type': 'Offer', price: '0', priceCurrency: 'USD' },
      url: pageUrl,
    }
    return {
      meta: [
        { title },
        { name: 'description', content: description },
        { property: 'og:title', content: title } as any,
        { property: 'og:description', content: description } as any,
        { property: 'og:url', content: pageUrl } as any,
        { property: 'og:image', content: ogImage } as any,
        { name: 'twitter:title', content: title },
        { name: 'twitter:description', content: description },
        { name: 'twitter:image', content: ogImage },
      ],
      links: [{ rel: 'canonical', href: pageUrl }],
      scripts: [
        {
          type: 'application/ld+json',
          children: JSON.stringify(ld),
        } as any,
        {
          type: 'application/ld+json',
          children: JSON.stringify(appLd),
        } as any,
      ],
    }
  },
  component: IndexPage,
})

function IndexPage() {
  const router = useRouter()
  const { user, loading } = useAuth()

  useEffect(() => {
    if (!loading && user) {
      router.navigate({ to: '/dashboard' })
    }
  }, [loading, user, router])

  if (loading) return <Loading message="Preparing your experience…" />

  return (
    <main>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-slate-50 to-white" />
        <div className="relative mx-auto max-w-6xl px-4 pt-12 pb-16 sm:pt-16 sm:pb-24">
          <div className="mx-auto max-w-3xl text-center">
            <div className="mb-6 flex justify-center">
              <img
                src="/logo.png"
                alt="ZebraQR logo"
                className="h-16 w-16 object-contain"
                onError={(e) => {
                  const img = e.currentTarget as HTMLImageElement
                  if (!img.dataset.fallback) {
                    img.dataset.fallback = '1'
                    img.src = '/logo512.png'
                  }
                }}
              />
            </div>
            <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-5xl">
              Dynamic QR Codes, Made Simple
            </h1>
            <p className="mt-3 text-lg text-slate-600">
              Create, update, and manage QR codes with short links you can
              change anytime. Fast redirects, clean design, and zero clutter.
            </p>
            <div className="mt-8 flex items-center justify-center gap-3">
              <Link
                to="/register"
                className="rounded-md bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
              >
                Get Started Free
              </Link>
              <Link
                to="/login"
                className="rounded-md border border-slate-300 px-5 py-2.5 text-sm font-medium text-slate-900 hover:bg-slate-50"
              >
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-4 pb-16">
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Feature
            title="Update anytime"
            text="All QR codes use short links so you can change destinations without reprinting."
          />
          <Feature
            title="Fast and reliable"
            text="Optimized 302 redirects with a simple, scalable backend."
          />
          <Feature
            title="Downloadable PNGs"
            text="Generate high‑quality QR images that are easy to share and print."
          />
          <Feature
            title="Secure by default"
            text="Authentication powered by Supabase with row‑level security."
          />
          <Feature
            title="Clean, minimal UI"
            text="Designed to get out of your way so you can work quickly."
          />
          <Feature
            title="Works everywhere"
            text="Responsive layouts for desktop and mobile with no fuss."
          />
        </div>
      </section>

      {/* How it works */}
      <section className="bg-slate-50">
        <div className="mx-auto max-w-6xl px-4 py-14">
          <h2 className="text-center text-2xl font-semibold text-slate-900">
            How it works
          </h2>
          <ol className="mx-auto mt-6 grid max-w-3xl list-decimal gap-4 pl-6 text-slate-700">
            <li>Create an account and sign in.</li>
            <li>Create a QR code with your destination URL.</li>
            <li>Use the generated short link anywhere — update it anytime.</li>
          </ol>
        </div>
      </section>

      {/* Final CTA */}
      <section className="mx-auto max-w-6xl px-4 py-14 text-center">
        <h2 className="text-2xl font-semibold text-slate-900">
          Start in minutes
        </h2>
        <p className="mt-2 text-slate-600">No credit card required.</p>
        <div className="mt-6">
          <Link
            to="/register"
            className="rounded-md bg-slate-900 px-5 py-2.5 text-sm font-medium text-white hover:bg-slate-800"
          >
            Create an account
          </Link>
        </div>
      </section>
    </main>
  )
}

function Feature({ title, text }: { title: string; text: string }) {
  return (
    <div className="rounded-lg border border-slate-200 bg-white p-5">
      <h3 className="text-base font-semibold text-slate-900">{title}</h3>
      <p className="mt-1 text-sm text-slate-600">{text}</p>
    </div>
  )
}
