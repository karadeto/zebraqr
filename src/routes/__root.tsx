import { HeadContent, Scripts, createRootRoute } from '@tanstack/react-router'
import { TanStackRouterDevtoolsPanel } from '@tanstack/react-router-devtools'
import { TanStackDevtools } from '@tanstack/react-devtools'

import Header from '../components/Header'
import ErrorBoundary from '../components/ErrorBoundary'
import { AuthProvider } from '../lib/auth-context'
import { isDevtoolsEnabled } from '../lib/env'

import appCss from '../styles.css?url'

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: 'utf-8' },
      { name: 'viewport', content: 'width=device-width, initial-scale=1' },
      { title: 'ZebraQR — Free Dynamic QR Code Generator' },
      {
        name: 'description',
        content:
          'Generate, update, and manage QR codes with editable short links. Fast redirects, clean UI, downloadable PNGs.',
      },
      { name: 'robots', content: 'index,follow' },
      { name: 'theme-color', content: '#0f172a' },
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:site', content: '@' },
      {
        name: 'twitter:title',
        content: 'ZebraQR — Free Dynamic QR Code Generator',
      },
      {
        name: 'twitter:description',
        content:
          'Create dynamic QR codes with editable destinations. Simple and fast.',
      },
      { property: 'og:type', content: 'website' } as any,
      { property: 'og:site_name', content: 'ZebraQR' } as any,
      {
        property: 'og:title',
        content: 'ZebraQR — Free Dynamic QR Code Generator',
      } as any,
      {
        property: 'og:description',
        content:
          'Generate, update and manage dynamic QR codes. Download PNGs and edit destinations anytime.',
      } as any,
      // We'll compute absolute URL & image client-side when available
      { property: 'og:url', content: '' } as any,
      { property: 'og:image', content: '/logo512.png' } as any,
      { name: 'referrer', content: 'no-referrer-when-downgrade' },
    ],
    links: [
      { rel: 'stylesheet', href: appCss },
      { rel: 'icon', href: '/favicon.ico' },
      { rel: 'icon', type: 'image/svg+xml', href: '/favicon.svg' },
      {
        rel: 'apple-touch-icon',
        sizes: '180x180',
        href: '/apple-touch-icon.png',
      },
      { rel: 'manifest', href: '/site.webmanifest' },
      // Canonical URL computed client-side as a fallback
      {
        rel: 'canonical',
        href:
          typeof window !== 'undefined'
            ? window.location.href
            : 'https://example.com/',
      } as any,
    ],
  }),

  shellComponent: RootDocument,
})

function RootDocument({ children }: { children: React.ReactNode }) {
  const showDevtools = isDevtoolsEnabled()
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        <AuthProvider>
          <Header />
          <ErrorBoundary>{children}</ErrorBoundary>
        </AuthProvider>
        {showDevtools && (
          <TanStackDevtools
            config={{ position: 'bottom-left' }}
            plugins={[
              {
                name: 'Tanstack Router',
                render: <TanStackRouterDevtoolsPanel />,
              },
            ]}
          />
        )}
        <Scripts />
      </body>
    </html>
  )
}
