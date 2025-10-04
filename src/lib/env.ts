// Centralized env access that works in SSR and browser
// Avoids dynamic access of import.meta.env which Vite SSR forbids.

function viteEnv<T extends string = string>(key: T): string | undefined {
  try {
    // Use direct dotted access only; no dynamic index
    const env = (import.meta as any).env
    switch (key) {
      case 'VITE_SUPABASE_URL':
        return env?.VITE_SUPABASE_URL
      case 'VITE_SUPABASE_ANON_KEY':
        return env?.VITE_SUPABASE_ANON_KEY
      case 'VITE_ENABLE_DEVTOOLS':
        return env?.VITE_ENABLE_DEVTOOLS
      default:
        return undefined
    }
  } catch {
    return undefined
  }
}

export function getSupabaseEnv() {
  const url = viteEnv('VITE_SUPABASE_URL') || process.env.SUPABASE_URL
  const anon =
    viteEnv('VITE_SUPABASE_ANON_KEY') || process.env.SUPABASE_ANON_KEY
  return { SUPABASE_URL: url, SUPABASE_ANON_KEY: anon }
}

export function isDevtoolsEnabled(): boolean {
  const isDev = (() => {
    try {
      return !!(import.meta as any)?.env?.DEV
    } catch {
      return process.env.NODE_ENV === 'development'
    }
  })()
  const flag =
    (viteEnv('VITE_ENABLE_DEVTOOLS') || process.env.VITE_ENABLE_DEVTOOLS || '')
      .toString()
      .toLowerCase()
  return isDev && (flag === 'true' || flag === '1' || flag === 'yes')
}
