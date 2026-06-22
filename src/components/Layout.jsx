import { NavLink, Outlet } from 'react-router-dom'
import { CreditCard, Landmark, Receipt, Wallet, LayoutDashboard, Home, LogOut, AlertTriangle } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabaseConfig, supabaseEnabled } from '../lib/supabase'
const tabs = [
  { to: '/', label: 'Ana', icon: Home, end: true },
  { to: '/ozet', label: 'Özet', icon: LayoutDashboard },
  { to: '/kartlar', label: 'Kartlar', icon: CreditCard },
  { to: '/krediler', label: 'Krediler', icon: Landmark },
  { to: '/odemeler', label: 'Ödemeler', icon: Receipt },
  { to: '/gelirler', label: 'Gelirler', icon: Wallet },
]

export default function Layout() {
  const { supabaseEnabled, signOut, user } = useAuth()

  return (
    <div className="mx-auto min-h-screen max-w-phone bg-gray-100 shadow-xl">
      <header className="sticky top-0 z-10 bg-brand-700 px-4 pb-4 pt-safe text-white">
        <div className="flex items-start justify-between pt-4">
          <div>
            <p className="text-xs font-medium uppercase tracking-widest text-brand-100">Kişisel Finans</p>
            <h1 className="text-2xl font-bold">Borç Takip</h1>
            {user?.email && (
              <p className="mt-0.5 truncate text-xs text-brand-100 opacity-90">{user.email}</p>
            )}
          </div>
          {supabaseEnabled && (
            <button
              type="button"
              onClick={() => signOut()}
              className="rounded-xl bg-white/15 p-2 text-white active:bg-white/25"
              aria-label="Çıkış yap"
            >
              <LogOut size={18} />
            </button>
          )}
        </div>
      </header>

      <main className="px-4 pb-28 pt-4">
        {!supabaseEnabled && import.meta.env.PROD && (
          <div className="mb-4 flex gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-xs text-amber-950">
            <AlertTriangle className="shrink-0" size={16} />
            <div>
              <p className="font-semibold">Supabase bağlı değil — veriler yalnızca bu cihazda</p>
              <p className="mt-1">
                Vercel Environment Variables eksik veya deploy öncesi eklenmemiş.
                URL: {supabaseConfig.hasUrl ? '✓' : '✗'} · Key: {supabaseConfig.hasKey ? '✓' : '✗'}
              </p>
            </div>
          </div>
        )}
        <Outlet />
      </main>
      <nav className="fixed bottom-0 left-1/2 z-20 w-full max-w-phone -translate-x-1/2 border-t border-gray-200 bg-white/95 backdrop-blur pb-safe">
        <div className="flex items-stretch overflow-x-auto scrollbar-hide px-0.5 pt-1">
          {tabs.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                `flex min-w-[56px] flex-1 flex-col items-center gap-0.5 py-2 text-[10px] font-medium ${
                  isActive ? 'text-brand-700' : 'text-gray-400'
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <span
                    className={`rounded-xl p-1.5 ${isActive ? 'bg-brand-50 text-brand-700' : 'text-gray-400'}`}
                  >
                    <Icon size={20} strokeWidth={isActive ? 2.5 : 2} />
                  </span>
                  {label}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </nav>
    </div>
  )
}
