import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import { FinanceProvider, useFinance } from './context/FinanceContext'
import Layout from './components/Layout'
import LoadingScreen from './components/LoadingScreen'
import Login from './pages/Login'
import Home from './pages/Home'
import Dashboard from './pages/Dashboard'
import CreditCards from './pages/CreditCards'
import Loans from './pages/Loans'
import OtherPayments from './pages/OtherPayments'
import Income from './pages/Income'

function AppShell() {
  const { loading: authLoading, session, supabaseEnabled } = useAuth()
  const { loading: financeLoading, syncError, setSyncError } = useFinance()

  if (authLoading) return <LoadingScreen message="Oturum kontrol ediliyor..." />
  if (supabaseEnabled && !session) return <Login />
  if (financeLoading) return <LoadingScreen message="Veriler yükleniyor..." />

  return (
    <>
      {syncError && (
        <div className="fixed left-1/2 top-4 z-50 w-[calc(100%-2rem)] max-w-phone -translate-x-1/2">
          <div className="flex items-start justify-between gap-2 rounded-xl bg-red-50 px-4 py-3 text-sm text-danger shadow-lg">
            <span>{syncError}</span>
            <button type="button" className="font-semibold" onClick={() => setSyncError('')}>
              ×
            </button>
          </div>
        </div>
      )}
      <Routes>
        <Route element={<Layout />}>
          <Route index element={<Home />} />
          <Route path="ozet" element={<Dashboard />} />
          <Route path="kartlar" element={<CreditCards />} />
          <Route path="krediler" element={<Loans />} />
          <Route path="odemeler" element={<OtherPayments />} />
          <Route path="gelirler" element={<Income />} />
        </Route>
      </Routes>
    </>
  )
}

export default function App() {
  return (
    <AuthProvider>
      <FinanceProvider>
        <BrowserRouter>
          <AppShell />
        </BrowserRouter>
      </FinanceProvider>
    </AuthProvider>
  )
}
