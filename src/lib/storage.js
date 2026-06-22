import { isNegativeBalancePayment } from './paymentCategories'

const STORAGE_KEY = 'borc-takip-data-v1'

export const DEFAULT_PAYMENT_TYPES = [
  'Okul Taksidi',
  'Kur Taksidi',
  'Kira',
  'Fatura',
  'Negatif Bakiye',
  'Diğer',
]
export const DEFAULT_INCOME_TYPES = ['Maaş', 'Ek Kazanç', 'Kira Geliri', 'Diğer']

function normalizeOtherPayment(payment) {
  return {
    ...payment,
    isNegativeBalance: Boolean(payment.isNegativeBalance) || isNegativeBalancePayment(payment),
  }
}

export function normalizeFinanceState(state) {
  return {
    ...state,
    dismissedProjections: state.dismissedProjections || [],
    otherPayments: (state.otherPayments || []).map(normalizeOtherPayment),
    paymentTypes: [...new Set([...(state.paymentTypes || []), ...DEFAULT_PAYMENT_TYPES])],
  }
}

export const emptyState = () => ({
  creditCards: [],
  loans: [],
  otherPayments: [],
  incomes: [],
  dismissedProjections: [],
  paymentTypes: [...DEFAULT_PAYMENT_TYPES],
  incomeTypes: [...DEFAULT_INCOME_TYPES],
})

export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return emptyState()
    const parsed = JSON.parse(raw)
    return normalizeFinanceState({
      ...emptyState(),
      ...parsed,
      paymentTypes: parsed.paymentTypes?.length ? parsed.paymentTypes : [...DEFAULT_PAYMENT_TYPES],
      incomeTypes: parsed.incomeTypes?.length ? parsed.incomeTypes : [...DEFAULT_INCOME_TYPES],
    })
  } catch {
    return emptyState()
  }
}

export function saveState(state) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
}

export function createId() {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`
}
