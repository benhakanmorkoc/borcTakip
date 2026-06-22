import { createClient } from '@supabase/supabase-js'

// vite.config.js define ile build anında gömülür (Vercel için kritik)
const supabaseUrl = (
  typeof __BT_SUPABASE_URL__ !== 'undefined' ? __BT_SUPABASE_URL__ : ''
)
  .trim()
  .replace(/\/$/, '')

const supabaseAnonKey = (
  typeof __BT_SUPABASE_KEY__ !== 'undefined' ? __BT_SUPABASE_KEY__ : ''
).trim()

export const supabaseEnabled = Boolean(supabaseUrl && supabaseAnonKey)

export const supabaseConfig = {
  hasUrl: Boolean(supabaseUrl),
  hasKey: Boolean(supabaseAnonKey),
  urlPreview: supabaseUrl ? `${supabaseUrl.slice(0, 28)}...` : null,
}

if (!supabaseEnabled && import.meta.env.PROD) {
  console.error(
    'Supabase bağlantısı yok. Vercel Environment Variables kontrol edip Redeploy yapın.'
  )
}

export const supabase = supabaseEnabled ? createClient(supabaseUrl, supabaseAnonKey) : null
