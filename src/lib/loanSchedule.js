import { shiftYearMonth } from './format'
import { createId } from './storage'
import {
  getLoanEndMonth,
  getLoanStartMonth,
  getPaymentsRemaining,
  isLoanActiveInMonth,
} from './loanUtils'

/**
 * İleri vade tablosu: seçili ayın SONRASI → kredi bitiş ayına kadar.
 * Örn. Temmuz, 4 taksit (Tem–Eki): ileri plan = Ağu, Eyl, Eki
 */
export function buildLoanAutoSchedule(loan, viewMonth) {
  if (!isLoanActiveInMonth(loan, viewMonth) && getPaymentsRemaining(loan, viewMonth) <= 0) {
    return []
  }

  const end = getLoanEndMonth(loan)
  const amount = Number(loan.monthlyPayment) || 0
  const firstForward = shiftYearMonth(viewMonth, 1)

  if (compare(firstForward, end) > 0) return []

  const rows = []
  let month = firstForward
  while (compare(month, end) <= 0) {
    const paymentsLeft = monthDiffFromView(month, end) + 1
    rows.push({
      id: `auto-${loan.id}-${month}`,
      loanId: loan.id,
      bankName: loan.bankName,
      month,
      amount,
      paid: false,
      note: '',
      source: 'auto',
      paymentsLeft,
    })
    month = shiftYearMonth(month, 1)
  }
  return rows
}

function compare(a, b) {
  return a.localeCompare(b)
}

function monthDiffFromView(from, to) {
  const [y1, m1] = from.split('-').map(Number)
  const [y2, m2] = to.split('-').map(Number)
  return (y2 - y1) * 12 + (m2 - m1)
}

/** Seçili ayın kendi taksiti (ileri tabloda değil, özet için) */
function buildLoanCurrentRow(loan, viewMonth, referenceMonth) {
  if (!isLoanActiveInMonth(loan, viewMonth)) return null
  const paid = viewMonth === referenceMonth && Boolean(loan.installmentPaid)
  return {
    id: `current-${loan.id}-${viewMonth}`,
    loanId: loan.id,
    bankName: loan.bankName,
    month: viewMonth,
    amount: Number(loan.monthlyPayment) || 0,
    paid,
    note: 'Bu ay',
    source: 'current',
    paymentsLeft: getPaymentsRemaining(loan, viewMonth),
  }
}

function normalizeManualInstallments(loan) {
  return (loan.futureInstallments || [])
    .filter((row) => isLoanActiveInMonth(loan, row.month) || compare(row.month, getLoanEndMonth(loan)) <= 0)
    .map((row) => ({
      id: row.id,
      loanId: loan.id,
      bankName: loan.bankName,
      month: row.month,
      amount: Number(row.amount) || 0,
      paid: Boolean(row.paid),
      note: row.note || '',
      source: 'manual',
      paymentsLeft: getPaymentsRemaining(loan, row.month),
    }))
}

function mergeScheduleRows(autoRows, manualRows) {
  const byMonth = new Map()
  for (const row of autoRows) {
    byMonth.set(row.month, row)
  }
  for (const row of manualRows) {
    const existing = byMonth.get(row.month)
    byMonth.set(row.month, existing ? { ...existing, ...row, source: 'manual' } : row)
  }
  return [...byMonth.values()].sort((a, b) => a.month.localeCompare(b.month))
}

export function buildLoanFullSchedule(loan, viewMonth, referenceMonth = viewMonth) {
  const current = buildLoanCurrentRow(loan, viewMonth, referenceMonth)
  const forward = buildLoanAutoSchedule(loan, viewMonth)
  const manual = normalizeManualInstallments(loan)
  const merged = mergeScheduleRows(forward, manual)
  return current ? [current, ...merged] : merged
}

export function buildAllLoanSchedules(loans, viewMonth, referenceMonth = viewMonth) {
  return loans
    .flatMap((loan) => buildLoanFullSchedule(loan, viewMonth, referenceMonth))
    .sort((a, b) => a.month.localeCompare(b.month) || a.bankName.localeCompare(b.bankName))
}

export function scheduleTotals(rows) {
  const total = rows.reduce((s, r) => s + r.amount, 0)
  const remaining = rows.filter((r) => !r.paid).reduce((s, r) => s + r.amount, 0)
  const paid = rows.filter((r) => r.paid).reduce((s, r) => s + r.amount, 0)
  return { total, remaining, paid, count: rows.length }
}

export function createFutureInstallment(data) {
  return {
    id: createId(),
    month: data.month,
    amount: Number(data.amount) || 0,
    paid: Boolean(data.paid),
    note: data.note || '',
  }
}
