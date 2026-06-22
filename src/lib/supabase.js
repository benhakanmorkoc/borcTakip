import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabaseEnabled = Boolean(supabaseUrl && supabaseAnonKey)

if (!supabaseEnabled) {
  console.warn('Supabase yapılandırması eksik — localStorage modu kullanılacak.')
}

export const supabase = supabaseEnabled ? createClient(supabaseUrl, supabaseAnonKey) : null
