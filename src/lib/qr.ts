import { customAlphabet } from 'nanoid'
import QRCode from 'qrcode'
import type { SupabaseClient } from '@supabase/supabase-js'
import { qrCodes } from './db/schema'

// Alphanumeric only (avoid '-' and '_' for cleaner codes)
const ALPHANUM =
  '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'
const defaultShortCode = customAlphabet(ALPHANUM, 7)

export type GenerateQROptions = {
  width?: number
  margin?: number
  errorCorrectionLevel?: 'L' | 'M' | 'Q' | 'H'
}

// Generate a PNG data URL for the given content
export async function generateQRCode(
  content: string,
  options: GenerateQROptions = {},
): Promise<string> {
  const trimmed = content.trim()
  if (!trimmed) {
    throw new Error('QR content must be a non-empty string')
  }

  // Reasonable defaults
  const width = options.width ?? 512
  const margin = options.margin ?? 2
  const errorCorrectionLevel = options.errorCorrectionLevel ?? 'M'

  try {
    const dataUrl = await QRCode.toDataURL(trimmed, {
      type: 'image/png',
      width,
      margin,
      errorCorrectionLevel,
    })
    return dataUrl
  } catch (err) {
    throw new Error('Failed to generate QR code')
  }
}

// Simple generator for short codes (6-8 recommended)
export function generateShortCode(length = 7): string {
  if (length < 6 || length > 12) {
    throw new Error('Short code length must be between 6 and 12')
  }
  const gen = customAlphabet(ALPHANUM, length)
  return gen()
}

// Ensure uniqueness against the database; retries with new codes up to maxAttempts
export async function ensureUniqueShortCode(
  client: SupabaseClient,
  length = 7,
  maxAttempts = 5,
): Promise<string> {
  for (let i = 0; i < maxAttempts; i++) {
    const code = length === 7 ? defaultShortCode() : generateShortCode(length)
    const { data, error } = await client
      .from('qr_codes')
      .select('id')
      .eq('short_code', code)
      .limit(1)
    if (error) {
      throw error
    }
    if (!data || data.length === 0) return code
  }
  throw new Error('Unable to generate a unique short code. Please try again.')
}

export default {
  generateQRCode,
  generateShortCode,
  ensureUniqueShortCode,
}
