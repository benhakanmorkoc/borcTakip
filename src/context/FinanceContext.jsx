import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { useAuth } from './AuthContext'
import { createId, emptyState, loadState, saveState } from '../lib/storage'
import { financeApi, loadFinanceForUser } from '../lib/supabaseFinance'
import { supabaseEnabled } from '../lib/supabase'
import { currentYearMonth } from '../lib/format'

const FinanceContext = createContext(null)

function mergeItem(list, id, patch) {
  return list.map((item) => (item.id === id ? { ...item, ...patch } : item))
}

export function FinanceProvider({ children }) {
  const { user } = useAuth()
  const userId = user?.id

  const [state, setState] = useState(emptyState)
  const [selectedMonth, setSelectedMonth] = useState(currentYearMonth)
  const [loading, setLoading] = useState(supabaseEnabled)
  const [syncError, setSyncError] = useState('')

  useEffect(() => {
    let cancelled = false

    async function init() {
      setSyncError('')
      if (!supabaseEnabled) {
        setState(loadState())
        setLoading(false)
        return
      }
      if (!userId) {
        setState(emptyState())
        setLoading(false)
        return
      }

      setLoading(true)
      try {
        const data = await loadFinanceForUser(userId)
        if (!cancelled) setState(data)
      } catch (err) {
        if (!cancelled) setSyncError(err.message || 'Veri yüklenemedi')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    init()
    return () => {
      cancelled = true
    }
  }, [userId])

  useEffect(() => {
    if (!supabaseEnabled) saveState(state)
  }, [state])

  const persist = useCallback(
    async (fn) => {
      if (!supabaseEnabled || !userId) return
      setSyncError('')
      try {
        await fn()
      } catch (err) {
        setSyncError(err.message || 'Kayıt başarısız')
        throw err
      }
    },
    [userId]
  )

  const actions = useMemo(
    () => ({
      addCreditCard: async (data) => {
        if (!supabaseEnabled || !userId) {
          setState((s) => ({ ...s, creditCards: [...s.creditCards, { id: createId(), ...data }] }))
          return
        }
        try {
          const row = await financeApi.insertCreditCard(userId, data)
          setState((s) => ({ ...s, creditCards: [...s.creditCards, row] }))
        } catch (err) {
          setSyncError(err.message || 'Kart kaydedilemedi')
        }
      },

      updateCreditCard: async (id, patch) => {
        const current = state.creditCards.find((c) => c.id === id)
        if (!current) return
        const next = { ...current, ...patch }
        setState((s) => ({ ...s, creditCards: mergeItem(s.creditCards, id, patch) }))
        if (!supabaseEnabled || !userId) return
        try {
          await persist(() => financeApi.updateCreditCard(id, next))
        } catch {
          setState((s) => ({ ...s, creditCards: mergeItem(s.creditCards, id, current) }))
        }
      },

      removeCreditCard: async (id) => {
        const backup = state.creditCards
        setState((s) => ({ ...s, creditCards: s.creditCards.filter((c) => c.id !== id) }))
        if (!supabaseEnabled || !userId) return
        try {
          await persist(() => financeApi.deleteCreditCard(id))
        } catch {
          setState((s) => ({ ...s, creditCards: backup }))
        }
      },

      dismissProjectedCard: async (sourceCardId, targetMonth) => {
        const entry = { kind: 'card', targetMonth, sourceId: sourceCardId }
        const backup = state.dismissedProjections || []
        setState((s) => ({
          ...s,
          dismissedProjections: [
            ...(s.dismissedProjections || []).filter(
              (d) =>
                !(
                  d.kind === 'card' &&
                  d.targetMonth === targetMonth &&
                  d.sourceId === sourceCardId
                )
            ),
            entry,
          ],
        }))
        if (!supabaseEnabled || !userId) return
        try {
          await persist(() => financeApi.insertProjectionDismissal(userId, entry))
        } catch {
          setState((s) => ({ ...s, dismissedProjections: backup }))
        }
      },

      dismissProjectedPayment: async (sourcePaymentId, targetMonth) => {
        const entry = { kind: 'payment', targetMonth, sourceId: sourcePaymentId }
        const backup = state.dismissedProjections || []
        setState((s) => ({
          ...s,
          dismissedProjections: [
            ...(s.dismissedProjections || []).filter(
              (d) =>
                !(
                  d.kind === 'payment' &&
                  d.targetMonth === targetMonth &&
                  d.sourceId === sourcePaymentId
                )
            ),
            entry,
          ],
        }))
        if (!supabaseEnabled || !userId) return
        try {
          await persist(() => financeApi.insertProjectionDismissal(userId, entry))
        } catch {
          setState((s) => ({ ...s, dismissedProjections: backup }))
        }
      },

      addLoan: async (data) => {
        if (!supabaseEnabled || !userId) {
          setState((s) => ({ ...s, loans: [...s.loans, { id: createId(), ...data }] }))
          return
        }
        try {
          const row = await financeApi.insertLoan(userId, data)
          setState((s) => ({ ...s, loans: [...s.loans, row] }))
        } catch (err) {
          setSyncError(err.message || 'Kredi kaydedilemedi')
        }
      },

      updateLoan: async (id, patch) => {
        const current = state.loans.find((l) => l.id === id)
        if (!current) return
        const next = { ...current, ...patch }
        setState((s) => ({ ...s, loans: mergeItem(s.loans, id, patch) }))
        if (!supabaseEnabled || !userId) return
        try {
          await persist(() => financeApi.updateLoan(id, next))
        } catch {
          setState((s) => ({ ...s, loans: mergeItem(s.loans, id, current) }))
        }
      },

      removeLoan: async (id) => {
        const backup = state.loans
        setState((s) => ({ ...s, loans: s.loans.filter((l) => l.id !== id) }))
        if (!supabaseEnabled || !userId) return
        try {
          await persist(() => financeApi.deleteLoan(id))
        } catch {
          setState((s) => ({ ...s, loans: backup }))
        }
      },

      addOtherPayment: async (data) => {
        if (!supabaseEnabled || !userId) {
          setState((s) => ({ ...s, otherPayments: [...s.otherPayments, { id: createId(), ...data }] }))
          return
        }
        try {
          const row = await financeApi.insertOtherPayment(userId, data)
          setState((s) => ({ ...s, otherPayments: [...s.otherPayments, row] }))
        } catch (err) {
          setSyncError(err.message || 'Ödeme kaydedilemedi')
        }
      },

      updateOtherPayment: async (id, patch) => {
        const current = state.otherPayments.find((p) => p.id === id)
        if (!current) return
        const next = { ...current, ...patch }
        setState((s) => ({ ...s, otherPayments: mergeItem(s.otherPayments, id, patch) }))
        if (!supabaseEnabled || !userId) return
        try {
          await persist(() => financeApi.updateOtherPayment(id, next))
        } catch {
          setState((s) => ({ ...s, otherPayments: mergeItem(s.otherPayments, id, current) }))
        }
      },

      removeOtherPayment: async (id) => {
        const backup = state.otherPayments
        setState((s) => ({ ...s, otherPayments: s.otherPayments.filter((p) => p.id !== id) }))
        if (!supabaseEnabled || !userId) return
        try {
          await persist(() => financeApi.deleteOtherPayment(id))
        } catch {
          setState((s) => ({ ...s, otherPayments: backup }))
        }
      },

      addPaymentType: async (type) => {
        const trimmed = type.trim()
        if (!trimmed) return
        setState((s) => {
          if (s.paymentTypes.includes(trimmed)) return s
          return { ...s, paymentTypes: [...s.paymentTypes, trimmed] }
        })
        if (!supabaseEnabled || !userId) return
        await persist(() => financeApi.insertCustomType(userId, 'payment', trimmed))
      },

      addIncome: async (data) => {
        if (!supabaseEnabled || !userId) {
          setState((s) => ({ ...s, incomes: [...s.incomes, { id: createId(), ...data }] }))
          return
        }
        try {
          const row = await financeApi.insertIncome(userId, data)
          setState((s) => ({ ...s, incomes: [...s.incomes, row] }))
        } catch (err) {
          setSyncError(err.message || 'Gelir kaydedilemedi')
        }
      },

      updateIncome: async (id, patch) => {
        const current = state.incomes.find((i) => i.id === id)
        if (!current) return
        const next = { ...current, ...patch }
        setState((s) => ({ ...s, incomes: mergeItem(s.incomes, id, patch) }))
        if (!supabaseEnabled || !userId) return
        try {
          await persist(() => financeApi.updateIncome(id, next))
        } catch {
          setState((s) => ({ ...s, incomes: mergeItem(s.incomes, id, current) }))
        }
      },

      removeIncome: async (id) => {
        const backup = state.incomes
        setState((s) => ({ ...s, incomes: s.incomes.filter((i) => i.id !== id) }))
        if (!supabaseEnabled || !userId) return
        try {
          await persist(() => financeApi.deleteIncome(id))
        } catch {
          setState((s) => ({ ...s, incomes: backup }))
        }
      },

      addIncomeType: async (type) => {
        const trimmed = type.trim()
        if (!trimmed) return
        setState((s) => {
          if (s.incomeTypes.includes(trimmed)) return s
          return { ...s, incomeTypes: [...s.incomeTypes, trimmed] }
        })
        if (!supabaseEnabled || !userId) return
        await persist(() => financeApi.insertCustomType(userId, 'income', trimmed))
      },
    }),
    [userId, state, persist]
  )

  const value = useMemo(
    () => ({
      state,
      selectedMonth,
      setSelectedMonth,
      loading,
      syncError,
      setSyncError,
      ...actions,
    }),
    [state, selectedMonth, loading, syncError, actions]
  )

  return <FinanceContext.Provider value={value}>{children}</FinanceContext.Provider>
}

export function useFinance() {
  const ctx = useContext(FinanceContext)
  if (!ctx) throw new Error('useFinance must be used within FinanceProvider')
  return ctx
}
