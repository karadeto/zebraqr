import { Component, ReactNode } from 'react'
import { Link } from '@tanstack/react-router'

type Props = {
  children?: ReactNode
  className?: string
}

type State = {
  hasError: boolean
  error?: any
}

export default class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(error: any): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: any, errorInfo: any) {
    // Minimal logging to console per task requirements
    // Avoid sending to external services
    console.error('[ErrorBoundary]', error, errorInfo)
  }

  handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload()
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className={[
          'mx-auto max-w-xl p-6 my-12 rounded-lg border border-slate-200 bg-white',
          this.props.className,
        ].filter(Boolean).join(' ')}>
          <h1 className="text-xl font-semibold text-slate-900">Something went wrong</h1>
          <p className="mt-2 text-sm text-slate-600">
            An unexpected error occurred. Try reloading the page, or return to the dashboard.
          </p>
          <div className="mt-4 flex gap-2">
            <button
              onClick={this.handleReload}
              className="rounded-md bg-slate-900 px-3 py-2 text-sm font-medium text-white hover:bg-slate-800"
            >
              Reload
            </button>
            <Link
              to="/dashboard"
              className="rounded-md border border-slate-300 px-3 py-2 text-sm font-medium text-slate-900 hover:bg-slate-50"
            >
              Return to Dashboard
            </Link>
          </div>
          {process.env.NODE_ENV !== 'production' && this.state.error ? (
            <pre className="mt-4 whitespace-pre-wrap rounded bg-slate-50 p-3 text-xs text-slate-700">
              {String(this.state.error)}
            </pre>
          ) : null}
        </div>
      )
    }
    return this.props.children as any
  }
}

