import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => {
  // Yerel: .env dosyası | Vercel: process.env (build anında)
  const fileEnv = loadEnv(mode, process.cwd(), '')

  const supabaseUrl = (
    process.env.VITE_SUPABASE_URL ||
    fileEnv.VITE_SUPABASE_URL ||
    ''
  )
    .trim()
    .replace(/\/$/, '')

  const supabaseKey = (
    process.env.VITE_SUPABASE_ANON_KEY ||
    process.env.VITE_SUPABASE_PUBLISHABLE_KEY ||
    fileEnv.VITE_SUPABASE_ANON_KEY ||
    fileEnv.VITE_SUPABASE_PUBLISHABLE_KEY ||
    ''
  ).trim()

  if (mode === 'production') {
    if (!supabaseUrl || !supabaseKey) {
      console.warn(
        '\n⚠️  UYARI: Supabase env build sırasında BOŞ!\n' +
          '   Vercel → Settings → Environment Variables\n' +
          '   VITE_SUPABASE_URL ve VITE_SUPABASE_ANON_KEY ekleyip Redeploy yapın.\n'
      )
    } else {
      console.log(`✓ Supabase URL build'e eklendi: ${supabaseUrl.slice(0, 32)}...`)
    }
  }

  return {
    plugins: [react()],
    define: {
      __BT_SUPABASE_URL__: JSON.stringify(supabaseUrl),
      __BT_SUPABASE_KEY__: JSON.stringify(supabaseKey),
    },
    server: {
      host: true,
      port: 5180,
      strictPort: false,
      open: true,
    },
    build: {
      outDir: 'dist',
      sourcemap: false,
    },
  }
})
