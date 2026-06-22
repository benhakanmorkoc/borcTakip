import { shiftYearMonth } from './format'
import { createId } from './storage'

/**
 * Kalan vade × aylık taksit → ileri ay planı.
 * Bu ay taksit ödendiyse plan bir sonraki aydan başlar.
 */
export function buildLoanAutoSchedule(loan, anchorMonth) {
  const remaining = Math.max(0, Number(loan.remainingTerms) || 0)
  if (remaining <= 0) return []

  const startMonth = loan.installmentPaid ? shiftYearMonth(anchorMonth, 1) : anchorMonth
  const amount = Number(loan.monthlyPayment) || 0

  return Array.from({ length: remaining }, (_, i) => {
    const month = shiftYearMonth(startMonth, i)
    const isAnchorDue = month === anchorMonth
    return {
      id: `auto-${loan.id}-${month}`,
      loanId: loan.id,
      bankName: loan.bankName,
      month,
      amount,
      paid: isAnchorDue && Boolean(loan.installmentPaid),
      note: '',
      source: 'auto',
    }
  })
}

function normalizeManualInstallments(loan) {
  return (loan.futureInstallments || []).map((row) => ({
    id: row.id,
    loanId: loan.id,
    bankName: loan.bankName,
    month: row.month,
    amount: Number(row.amount) || 0,
    paid: Boolean(row.paid),
    note: row.note || '',
    source: 'manual',
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

export function buildLoanFullSchedule(loan, anchorMonth) {
  return mergeScheduleRows(
    buildLoanAutoSchedule(loan, anchorMonth),
    normalizeManualInstallments(loan)
  )
}

export function buildAllLoanSchedules(loans, anchorMonth) {
  return loans
    .flatMap((loan) => buildLoanFullSchedule(loan, anchorMonth))
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
